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
