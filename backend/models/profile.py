"""Hardware profile, benchmark, history and cleanup models.
Mirrored by hand in frontend/src/lib/types.ts — keep both sides in sync in one edit."""

from typing import List, Optional

from pydantic import BaseModel, Field


# ---------- Hardware profile ----------
class HardwareSignals(BaseModel):
    """Raw, messy signals the browser can actually read."""

    gpu_renderer: Optional[str] = None
    gpu_vendor_raw: Optional[str] = None
    cpu_cores: Optional[int] = None
    device_memory_gb: Optional[float] = None
    user_agent: Optional[str] = None
    platform: Optional[str] = None
    screen: Optional[str] = None


class TweakRecommendation(BaseModel):
    key: str
    name: str
    category: str
    premium: bool
    reason: str


class HardwareProfile(BaseModel):
    cpu: Optional[str] = None
    cpu_vendor: str = "Desconhecido"
    gpu: Optional[str] = None
    gpu_vendor: str = "Desconhecido"
    ram_gb: Optional[float] = None
    storage: str = "Desconhecido"
    tier: str = "intermediario"
    confidence: str = "media"
    summary: str = ""
    needs_confirmation: bool = False
    detected_via: str = "ia"  # "ia" | "manual" | "regras"
    recommended: List[TweakRecommendation] = []


class ProfileUpdate(BaseModel):
    """Player corrections from the pre-filled confirmation form."""

    cpu: Optional[str] = None
    cpu_vendor: Optional[str] = None
    gpu: Optional[str] = None
    gpu_vendor: Optional[str] = None
    ram_gb: Optional[float] = None
    storage: Optional[str] = None


# ---------- Benchmark ----------
class BenchmarkRequest(BaseModel):
    game_id: str


class BenchmarkRun(BaseModel):
    id: str
    game_id: str
    game_name: str
    baseline_fps: int
    result_fps: int
    gain_pct: float
    lag_before: float
    lag_after: float
    applied_count: int
    optimization_pct: float
    created_at: str


class BenchmarkList(BaseModel):
    runs: List[BenchmarkRun]
    best_gain_pct: float


# ---------- History ----------
class HistoryEntry(BaseModel):
    id: str
    kind: str
    label: str
    detail: str = ""
    applied_count: int
    optimization_pct: float
    created_at: str


class HistoryList(BaseModel):
    entries: List[HistoryEntry]


# ---------- Cleanup schedule ----------
class CleanupScheduleIn(BaseModel):
    enabled: bool
    frequency: str = Field(default="diaria")  # "diaria" | "semanal"
    hour: int = Field(default=20, ge=0, le=23)
    weekday: int = Field(default=0, ge=0, le=6)  # 0 = segunda


class CleanupRun(BaseModel):
    id: str
    ran_at: str
    trigger: str  # "agendada" | "manual"
    ram_freed_gb: float
    mb_freed: int
    files_removed: int


class CleanupOut(BaseModel):
    enabled: bool
    frequency: str
    hour: int
    weekday: int
    next_run_at: Optional[str] = None
    last_run_at: Optional[str] = None
    total_runs: int
    total_mb_freed: int
    runs: List[CleanupRun]


# ---------- Performance-drop alerts ----------
class AlertOut(BaseModel):
    id: str
    tweak_key: str
    tweak_name: str
    fps_lost: float
    ping_lost: float
    lag_lost: float
    source: str  # "toggle_off" | "restore" | "history_restore"
    created_at: str


class AlertsList(BaseModel):
    alerts: List[AlertOut]


# ---------- Machine comparison ----------
class CohortPoint(BaseModel):
    percentile: float
    fps: int


class ComparisonOut(BaseModel):
    game_id: str
    game_name: str
    tier: str
    tier_label: str
    your_fps: int
    percentile: float
    median_fps: int
    top_fps: int
    curve: List[CohortPoint]
    verdict: str
    measured_at: Optional[str] = None
