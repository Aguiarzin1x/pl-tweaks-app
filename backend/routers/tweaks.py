"""Tweak catalog + per-user optimization state. State persists per logged-in user.
Every mutation is logged to the action timeline via lib/state.save_and_log."""

import logging

from fastapi import APIRouter, Depends, HTTPException

from lib.catalog import GAME_BY_ID, RIP_PACKAGE, TWEAK_BY_KEY, TWEAKS, catalog_out
from lib.commands import commands_for
from lib.db import db
from lib.state import load_state, metrics, save_and_log, state_out
from models.tweaks import (
    CatalogOut,
    CommandsOut,
    PresetRequest,
    PresetResult,
    RipModeRequest,
    StateOut,
    ToggleRequest,
    TweakCommands,
    VipOut,
)
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(tags=["tweaks"])


def _tweak_commands(tweak: dict) -> TweakCommands:
    cmd = commands_for(tweak["key"])
    return TweakCommands(
        key=tweak["key"],
        name=tweak["name"],
        category=tweak["category"],
        kind=cmd["kind"],
        apply=cmd["apply"],
        revert=cmd["revert"],
        requires_admin=cmd["requires_admin"],
        requires_reboot=cmd["requires_reboot"],
        note=cmd.get("note", ""),
    )


@router.get("/tweaks/catalog", response_model=CatalogOut)
async def get_catalog():
    return catalog_out()


@router.get("/tweaks/commands", response_model=CommandsOut)
async def get_all_commands():
    """Catálogo de comandos do Windows para o executável nativo. O app web NÃO executa
    nada disso — aqui ele é apenas servido."""
    items = [_tweak_commands(t) for t in TWEAKS]
    return CommandsOut(total=len(items), tweaks=items)


@router.get("/tweaks/commands/{key}", response_model=TweakCommands)
async def get_commands_for_key(key: str):
    tweak = TWEAK_BY_KEY.get(key)
    if tweak is None:
        raise HTTPException(status_code=404, detail="Ajuste não encontrado")
    return _tweak_commands(tweak)


@router.get("/tweaks/state", response_model=StateOut)
async def get_state(user: dict = Depends(get_current_user)):
    doc = await load_state(user["id"])
    return state_out(doc["applied"], doc["rip_mode_active"])


@router.post("/tweaks/toggle", response_model=StateOut)
async def toggle_tweak(body: ToggleRequest, user: dict = Depends(get_current_user)):
    tweak = TWEAK_BY_KEY.get(body.key)
    if tweak is None:
        raise HTTPException(status_code=404, detail="Ajuste não encontrado")
    if tweak["premium"] and not user.get("is_premium", False):
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Ajuste exclusivo do Premium — ative o VIP para desbloquear",
                "tweak_key": body.key,
            },
        )
    doc = await load_state(user["id"])
    applied = list(doc["applied"])
    if body.applied and body.key not in applied:
        applied.append(body.key)
    elif not body.applied and body.key in applied:
        applied.remove(body.key)

    return await save_and_log(
        user["id"],
        applied,
        doc["rip_mode_active"],
        kind="toggle_on" if body.applied else "toggle_off",
        label=f'{tweak["name"]} {"aplicado" if body.applied else "desfeito"}',
        detail=tweak["description"],
    )


async def _apply_keys(
    user: dict, keys: list[str], rip_mode_active: bool, kind: str, label: str
) -> PresetResult:
    doc = await load_state(user["id"])
    applied_set = set(doc["applied"])
    applied_now: list[str] = []
    blocked: list[str] = []
    for key in keys:
        tweak = TWEAK_BY_KEY.get(key)
        if tweak is None:
            continue
        if tweak["premium"] and not user.get("is_premium", False):
            blocked.append(key)
            continue
        if key not in applied_set:
            applied_set.add(key)
            applied_now.append(key)
    applied = list(applied_set)

    detail = f"{len(applied_now)} ajustes aplicados"
    if blocked:
        detail += f" · {len(blocked)} bloqueados pelo Premium"
    await save_and_log(user["id"], applied, rip_mode_active, kind=kind, label=label, detail=detail)

    return PresetResult(
        applied=applied,
        rip_mode_active=rip_mode_active,
        metrics=metrics(applied),
        applied_now=applied_now,
        blocked=blocked,
    )


@router.post("/tweaks/preset", response_model=PresetResult)
async def apply_preset(body: PresetRequest, user: dict = Depends(get_current_user)):
    game = GAME_BY_ID.get(body.game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Preset de jogo não encontrado")
    return await _apply_keys(
        user,
        game["keys"],
        rip_mode_active=False,
        kind="preset",
        label=f'Preset do {game["name"]} aplicado',
    )


@router.post("/tweaks/rip-mode", response_model=PresetResult)
async def rip_mode(body: RipModeRequest, user: dict = Depends(get_current_user)):
    if not body.active:
        doc = await load_state(user["id"])
        await save_and_log(
            user["id"],
            list(doc["applied"]),
            False,
            kind="rip_mode_off",
            label="RIP Mode desativado",
            detail="Os ajustes aplicados continuam valendo",
        )
        return PresetResult(
            applied=doc["applied"],
            rip_mode_active=False,
            metrics=metrics(doc["applied"]),
            applied_now=[],
            blocked=[],
        )
    return await _apply_keys(
        user,
        RIP_PACKAGE,
        rip_mode_active=True,
        kind="rip_mode_on",
        label="RIP Mode ativado",
    )


@router.post("/tweaks/restore", response_model=StateOut)
async def restore_point(user: dict = Depends(get_current_user)):
    """Ponto de restauração: devolve o PC ao estado original (tudo desfeito)."""
    return await save_and_log(
        user["id"],
        [],
        False,
        kind="restore",
        label="Ponto de restauração aplicado",
        detail="Todos os ajustes foram desfeitos",
    )


@router.post("/vip/activate", response_model=VipOut)
async def activate_vip(user: dict = Depends(get_current_user)):
    """Simulação de assinatura — concede VIP na hora, sem cobrança real."""
    await db.users.update_one({"id": user["id"]}, {"$set": {"is_premium": True}})
    return VipOut(is_premium=True)
