"""AI hardware detection + per-hardware tweak recommendations."""

import logging
import re

from fastapi import APIRouter, Depends

from lib.catalog import TWEAK_BY_KEY
from lib.db import db
from lib.llm import detect_hardware
from lib.state import now
from models.profile import HardwareProfile, HardwareSignals, ProfileUpdate, TweakRecommendation
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/hardware", tags=["hardware"])

# Rule-based fallback shortlist: safe, high-impact, free tweaks that help any machine.
FALLBACK_KEYS = [
    ("core-parking-unpark", "Mantém todos os núcleos acordados — ganho em qualquer CPU."),
    ("cpu-priority-gaming", "Dá prioridade ao jogo em foco sobre apps de fundo."),
    ("gpu-scheduling-hags", "Reduz a fila de renderização da GPU."),
    ("background-apps-off", "Apps de segundo plano deixam de roubar CPU e rede."),
    ("telemetry-disable", "Corta a coleta de dados que roda durante o jogo."),
    ("power-plan-extreme", "Evita que a CPU reduza frequência no meio da partida."),
    ("game-bar-dvr-off", "O gravador do Xbox em background custa quadros."),
    ("tcp-nodelay", "Pacotes saem na hora, sem agrupamento do Nagle."),
    ("network-throttling-off", "Remove o limite de pacotes imposto pelo Windows."),
    ("usb-polling-1000", "Mouse reportando posição a cada 1ms."),
    ("timer-resolution-0-5ms", "Timer do sistema no ponto mais fino suportado."),
    ("pointer-accel-off", "1 pixel de mouse = 1 pixel na tela, sempre."),
]

VENDOR_PATTERNS = [
    (r"nvidia|geforce|rtx|gtx|quadro|titan", "NVIDIA"),
    (r"\bamd\b|ryzen|radeon|threadripper|athlon|\brx\s?\d|vega|epyc", "AMD"),
    (r"intel|core\s?i[3579]|\bultra\s?\d|pentium|celeron|xeon|\buhd\b|\biris\b|\barc\b", "Intel"),
    (r"apple|\bm[1-4]\b", "Apple"),
]


def _guess_vendor(text: str | None) -> str:
    if not text:
        return "Desconhecido"
    low = text.lower()
    for pattern, vendor in VENDOR_PATTERNS:
        if re.search(pattern, low):
            return vendor
    return "Desconhecido"


def _pick_vendor(explicit: str | None, from_name: str | None, fallback: str | None) -> str:
    """Prefer what the player sent, then what we can infer from the part name, then the
    stored value — "Desconhecido" must never overwrite a vendor we already knew."""
    if explicit:
        return explicit
    guessed = _guess_vendor(from_name)
    if guessed != "Desconhecido":
        return guessed
    return fallback or "Desconhecido"


def _clean_renderer(renderer: str | None) -> str | None:
    """"ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)" -> the model."""
    if not renderer:
        return None
    inner = re.search(r"ANGLE\s*\((.*)\)", renderer, re.IGNORECASE)
    text = inner.group(1) if inner else renderer
    parts = [p.strip() for p in text.split(",") if p.strip()]
    best = max(parts, key=len) if parts else text
    best = re.sub(r"\b(Direct3D\d+|vs_[\d_]+|ps_[\d_]+|D3D\d+|OpenGL.*)\b", "", best)
    best = re.sub(r"\s{2,}", " ", best).strip(" -,")
    return best or None


def _tier_from_signals(signals: HardwareSignals) -> str:
    cores = signals.cpu_cores or 0
    mem = signals.device_memory_gb or 0
    gpu = (signals.gpu_renderer or "").lower()
    if re.search(r"rtx\s?40[7-9]|rtx\s?50|rx\s?7[89]00", gpu) or (cores >= 16 and mem >= 8):
        return "topo"
    if re.search(r"rtx\s?[34]0[6-8]|rx\s?6[678]00", gpu) or cores >= 12:
        return "avancado"
    if cores >= 6:
        return "intermediario"
    return "entrada"


def _recommendations(items: list[dict]) -> list[TweakRecommendation]:
    out: list[TweakRecommendation] = []
    for item in items:
        tweak = TWEAK_BY_KEY.get(item["key"])
        if tweak is None:
            continue
        out.append(
            TweakRecommendation(
                key=tweak["key"],
                name=tweak["name"],
                category=tweak["category"],
                premium=tweak["premium"],
                reason=item.get("reason") or tweak["description"],
            )
        )
    return out


def _fallback_profile(signals: HardwareSignals) -> HardwareProfile:
    gpu = _clean_renderer(signals.gpu_renderer)
    return HardwareProfile(
        cpu=f"CPU de {signals.cpu_cores} núcleos" if signals.cpu_cores else None,
        cpu_vendor=_guess_vendor(signals.platform or signals.user_agent),
        gpu=gpu,
        gpu_vendor=_guess_vendor(signals.gpu_renderer or signals.gpu_vendor_raw),
        ram_gb=signals.device_memory_gb,
        storage="Desconhecido",
        tier=_tier_from_signals(signals),
        confidence="baixa",
        summary=(
            "Detecção automática parcial: o navegador não revelou tudo. Confirme as peças "
            "abaixo para recomendações mais precisas."
        ),
        needs_confirmation=True,
        detected_via="regras",
        recommended=_recommendations([{"key": k, "reason": r} for k, r in FALLBACK_KEYS]),
    )


def _doc_to_profile(doc: dict) -> HardwareProfile:
    return HardwareProfile(
        cpu=doc.get("cpu"),
        cpu_vendor=doc.get("cpu_vendor") or "Desconhecido",
        gpu=doc.get("gpu"),
        gpu_vendor=doc.get("gpu_vendor") or "Desconhecido",
        ram_gb=doc.get("ram_gb"),
        storage=doc.get("storage") or "Desconhecido",
        tier=doc.get("tier") or "intermediario",
        confidence=doc.get("confidence") or "media",
        summary=doc.get("summary") or "",
        needs_confirmation=doc.get("needs_confirmation", False),
        detected_via=doc.get("detected_via") or "ia",
        recommended=_recommendations(doc.get("recommended") or []),
    )


async def _save(user_id: str, profile: HardwareProfile, signals: HardwareSignals | None) -> None:
    payload = profile.model_dump()
    payload["recommended"] = [{"key": r.key, "reason": r.reason} for r in profile.recommended]
    payload["updated_at"] = now()
    if signals is not None:
        payload["signals"] = signals.model_dump()
    await db.hardware_profiles.update_one(
        {"user_id": user_id},
        {"$set": payload, "$setOnInsert": {"user_id": user_id, "created_at": now()}},
        upsert=True,
    )


@router.get("/profile", response_model=HardwareProfile | None)
async def get_profile(user: dict = Depends(get_current_user)):
    doc = await db.hardware_profiles.find_one({"user_id": user["id"]})
    return _doc_to_profile(doc) if doc else None


@router.post("/detect", response_model=HardwareProfile)
async def detect(signals: HardwareSignals, user: dict = Depends(get_current_user)):
    """Claude Sonnet 5.5 reads the browser signals; falls back to rules if it can't."""
    parsed = await detect_hardware(signals.model_dump(), session_id=f"hw-{user['id']}")

    if parsed is None:
        profile = _fallback_profile(signals)
    else:
        ram = parsed.get("ram_gb")
        profile = HardwareProfile(
            cpu=parsed.get("cpu"),
            cpu_vendor=parsed.get("cpu_vendor") or "Desconhecido",
            gpu=parsed.get("gpu"),
            gpu_vendor=parsed.get("gpu_vendor") or "Desconhecido",
            ram_gb=float(ram) if isinstance(ram, (int, float)) else signals.device_memory_gb,
            storage=parsed.get("storage") or "Desconhecido",
            tier=parsed.get("tier") or _tier_from_signals(signals),
            confidence=parsed.get("confidence") or "media",
            summary=parsed.get("summary") or "",
            needs_confirmation=bool(parsed.get("needs_confirmation", False)),
            detected_via="ia",
            recommended=_recommendations(parsed.get("recommended") or []),
        )
        if not profile.recommended:  # model answered but gave nothing usable
            profile.recommended = _recommendations(
                [{"key": k, "reason": r} for k, r in FALLBACK_KEYS]
            )

    await _save(user["id"], profile, signals)
    return profile


@router.put("/profile", response_model=HardwareProfile)
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    """Player confirms/corrects the pre-filled form; recommendations are kept."""
    doc = await db.hardware_profiles.find_one({"user_id": user["id"]}) or {}
    merged = {
        "cpu": body.cpu if body.cpu is not None else doc.get("cpu"),
        "cpu_vendor": _pick_vendor(body.cpu_vendor, body.cpu, doc.get("cpu_vendor")),
        "gpu": body.gpu if body.gpu is not None else doc.get("gpu"),
        "gpu_vendor": _pick_vendor(body.gpu_vendor, body.gpu, doc.get("gpu_vendor")),
        "ram_gb": body.ram_gb if body.ram_gb is not None else doc.get("ram_gb"),
        "storage": body.storage or doc.get("storage") or "Desconhecido",
    }
    profile = HardwareProfile(
        **merged,
        tier=doc.get("tier") or "intermediario",
        confidence="alta",
        summary=doc.get("summary") or "Perfil confirmado pelo jogador.",
        needs_confirmation=False,
        detected_via="manual",
        recommended=_recommendations(doc.get("recommended") or []),
    )
    await _save(user["id"], profile, None)
    return profile
