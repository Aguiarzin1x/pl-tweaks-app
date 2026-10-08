"""Tweak catalog + user state models — mirror the TS interfaces in frontend/src/lib/types.ts."""

from pydantic import BaseModel
from typing import List


class CategoryOut(BaseModel):
    id: str
    name: str
    description: str


class TweakOut(BaseModel):
    key: str
    name: str
    description: str
    category: str
    impact: str  # "alto" | "medio" | "baixo"
    premium: bool
    fps_gain: float
    ping_reduction: float
    input_lag_reduction: float


class GamePresetOut(BaseModel):
    id: str
    name: str
    gain_pct: int
    baseline_fps: int
    keys: List[str]
    # Arte de capa servida de frontend/public/games/<id>.jpg
    banner: str = ""
    tagline: str = ""


class TweakCommands(BaseModel):
    """Comandos reais do Windows de um tweak — consumidos pelo EXECUTÁVEL futuro, nunca
    executados por este backend (o app web só simula estado)."""

    key: str
    name: str
    category: str
    kind: str  # "registry" | "powershell" | "cmd" | "bcdedit" | "service" | "manual"
    apply: List[str]
    revert: List[str]
    requires_admin: bool
    requires_reboot: bool
    note: str = ""


class CommandsOut(BaseModel):
    total: int
    tweaks: List[TweakCommands]


class CatalogOut(BaseModel):
    categories: List[CategoryOut]
    tweaks: List[TweakOut]
    games: List[GamePresetOut]


class ToggleRequest(BaseModel):
    key: str
    applied: bool


class PresetRequest(BaseModel):
    game_id: str


class RipModeRequest(BaseModel):
    active: bool


class Metrics(BaseModel):
    applied: int
    total: int
    optimization_pct: float
    fps_gain: float
    ping_reduction: float
    input_lag_reduction: float


class StateOut(BaseModel):
    applied: List[str]
    rip_mode_active: bool
    metrics: Metrics


class PresetResult(StateOut):
    applied_now: List[str] = []
    blocked: List[str] = []


class VipOut(BaseModel):
    is_premium: bool
