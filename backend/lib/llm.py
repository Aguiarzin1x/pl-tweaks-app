"""Claude Sonnet 5.5 hardware identification via the Emergent universal LLM key.

The browser can only hand us raw, messy signals (a WebGL renderer string like
"ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)"). The LLM turns
those into a clean profile + a tweak shortlist. Every failure path degrades to the
rule-based fallback in routers/hardware.py — the user flow must never 500 on the LLM.
"""

import asyncio
import json
import logging
import os
import re

from lib.catalog import TWEAKS

logger = logging.getLogger(__name__)

LLM_TIMEOUT_SECONDS = 45

SYSTEM_MESSAGE = """Você é o motor de detecção de hardware do PL Tweaks, um otimizador de PC para jogos.

Recebe sinais brutos coletados do navegador do jogador e devolve um perfil de hardware limpo
mais uma lista de ajustes recomendados do catálogo fornecido.

REGRAS:
- Responda SOMENTE com um objeto JSON válido, sem markdown, sem cercas de código, sem comentários.
- Todo texto voltado ao usuário deve estar em português do Brasil, direto e com vocabulário gamer.
- Use apenas chaves de ajuste ("key") que existam no catálogo recebido. Nunca invente uma chave.
- Recomende entre 8 e 14 ajustes, priorizando os de maior impacto para ESTE hardware.
- A string do renderizador WebGL costuma vir embrulhada em ANGLE: extraia o modelo real da GPU.
- Se um campo não puder ser determinado, use null (nunca invente um modelo específico).

FORMATO EXATO:
{
  "cpu": "Intel Core i5-12400F" ou null,
  "cpu_vendor": "Intel" | "AMD" | "Apple" | "Desconhecido",
  "gpu": "NVIDIA GeForce RTX 3060" ou null,
  "gpu_vendor": "NVIDIA" | "AMD" | "Intel" | "Apple" | "Desconhecido",
  "ram_gb": 16 ou null,
  "storage": "SSD NVMe" | "SSD" | "HD" | "Desconhecido",
  "tier": "entrada" | "intermediario" | "avancado" | "topo",
  "confidence": "alta" | "media" | "baixa",
  "summary": "Uma frase sobre o perfil da máquina e onde estão os maiores ganhos.",
  "needs_confirmation": true | false,
  "recommended": [
    {"key": "core-parking-unpark", "reason": "Motivo curto e específico para este hardware."}
  ]
}

"needs_confirmation" deve ser true quando a GPU ou a CPU não puder ser identificada com
segurança a partir dos sinais."""


def _catalog_digest() -> str:
    lines = [
        f'{t["key"]} | {t["name"]} | cat={t["category"]} | impacto={t["impact"]}'
        f'{" | PREMIUM" if t["premium"] else ""}'
        for t in TWEAKS
    ]
    return "\n".join(lines)


def _extract_json(text: str) -> dict | None:
    """Claude occasionally wraps JSON in prose or a fence — pull out the first object."""
    text = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    try:
        parsed = json.loads(text[start : end + 1])
        return parsed if isinstance(parsed, dict) else None
    except json.JSONDecodeError:
        logger.warning("llm hardware detect: response was not valid JSON")
        return None


async def _run_chat(prompt: str, session_id: str) -> str:
    # Imported lazily so a missing/incompatible lib degrades to the fallback instead of
    # breaking module import (and therefore the whole backend).
    from emergentintegrations.llm.chat import LlmChat, StreamDone, TextDelta, UserMessage

    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=session_id,
        system_message=SYSTEM_MESSAGE,
    ).with_model("anthropic", "claude-sonnet-5-5")

    chunks: list[str] = []
    async for event in chat.stream_message(UserMessage(text=prompt)):
        if isinstance(event, TextDelta):
            chunks.append(event.content)
        elif isinstance(event, StreamDone):
            break
    return "".join(chunks)


async def detect_hardware(signals: dict, session_id: str) -> dict | None:
    """Returns the parsed profile dict, or None if the LLM is unavailable/unusable."""
    if not os.environ.get("EMERGENT_LLM_KEY"):
        logger.warning("EMERGENT_LLM_KEY missing — using rule-based hardware fallback")
        return None

    prompt = (
        "SINAIS COLETADOS DO NAVEGADOR:\n"
        f"{json.dumps(signals, ensure_ascii=False, indent=2)}\n\n"
        "CATÁLOGO DE AJUSTES DISPONÍVEIS (key | nome | categoria | impacto):\n"
        f"{_catalog_digest()}\n\n"
        "Identifique o hardware e recomende os ajustes. Responda só com o JSON."
    )

    try:
        raw = await asyncio.wait_for(_run_chat(prompt, session_id), timeout=LLM_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.warning("llm hardware detect: timed out after %ss", LLM_TIMEOUT_SECONDS)
        return None
    except Exception as exc:  # network, auth, lib — all degrade the same way
        logger.error("llm hardware detect failed: %s", exc)
        return None

    parsed = _extract_json(raw)
    if parsed is None:
        return None

    # Never trust the model's keys blindly — drop anything outside the catalog.
    valid_keys = {t["key"] for t in TWEAKS}
    cleaned: list[dict] = []
    for item in parsed.get("recommended") or []:
        if isinstance(item, dict) and item.get("key") in valid_keys:
            cleaned.append({"key": item["key"], "reason": str(item.get("reason") or "")[:240]})
    parsed["recommended"] = cleaned[:14]
    return parsed
