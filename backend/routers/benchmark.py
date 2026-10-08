"""Simulated FPS benchmark: measures the machine "before" (baseline) vs "now" (with the
applied tweaks). The number is derived server-side from the real applied-tweak state."""

import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException

from lib.catalog import GAME_BY_ID, TWEAK_BY_KEY
from lib.db import db
from lib.reference import (
    TIER_LABEL,
    cohort_curve,
    median_fps,
    normalise_tier,
    percentile_of,
    top_fps,
    verdict,
)
from lib.state import load_state, metrics, now
from models.profile import (
    BenchmarkList,
    BenchmarkRequest,
    BenchmarkRun,
    CohortPoint,
    ComparisonOut,
)
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/benchmark", tags=["benchmark"])

BASE_LAG_MS = 17.4


def _iso(dt) -> str:
    from datetime import timezone

    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _doc_to_run(doc: dict) -> BenchmarkRun:
    return BenchmarkRun(
        id=doc["id"],
        game_id=doc["game_id"],
        game_name=doc["game_name"],
        baseline_fps=doc["baseline_fps"],
        result_fps=doc["result_fps"],
        gain_pct=doc["gain_pct"],
        lag_before=doc["lag_before"],
        lag_after=doc["lag_after"],
        applied_count=doc["applied_count"],
        optimization_pct=doc["optimization_pct"],
        created_at=_iso(doc["created_at"]),
    )


@router.get("", response_model=BenchmarkList)
async def list_runs(user: dict = Depends(get_current_user)):
    docs = await db.benchmark_runs.find({"user_id": user["id"]}).sort("created_at", -1).to_list(50)
    runs = [_doc_to_run(d) for d in docs]
    return BenchmarkList(
        runs=runs, best_gain_pct=max((r.gain_pct for r in runs), default=0.0)
    )


@router.post("/run", response_model=BenchmarkRun)
async def run_benchmark(body: BenchmarkRequest, user: dict = Depends(get_current_user)):
    game = GAME_BY_ID.get(body.game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")

    state = await load_state(user["id"])
    applied = set(state["applied"])
    m = metrics(state["applied"])

    # Game-wide FPS lift: every applied tweak contributes, preset-matched ones count double.
    lift = 0.0
    for key in applied:
        tweak = TWEAK_BY_KEY.get(key)
        if tweak is None:
            continue
        lift += tweak["fps_gain"] * (2.0 if key in game["keys"] else 1.0)

    baseline = game["baseline_fps"]
    result = int(round(baseline + lift))
    gain_pct = round((result - baseline) / baseline * 100, 1) if baseline else 0.0
    lag_after = round(max(1.8, BASE_LAG_MS - m.input_lag_reduction), 1)

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "game_id": game["id"],
        "game_name": game["name"],
        "baseline_fps": baseline,
        "result_fps": result,
        "gain_pct": gain_pct,
        "lag_before": BASE_LAG_MS,
        "lag_after": lag_after,
        "applied_count": m.applied,
        "optimization_pct": m.optimization_pct,
        "created_at": now(),
    }
    await db.benchmark_runs.insert_one(doc)
    return _doc_to_run(doc)


@router.get("/compare/{game_id}", response_model=ComparisonOut)
async def compare(game_id: str, user: dict = Depends(get_current_user)):
    """Where the player's latest measurement for this game sits among PCs in their tier.
    With no measurement yet, the current state is scored so the block is never empty."""
    game = GAME_BY_ID.get(game_id)
    if game is None:
        raise HTTPException(status_code=404, detail="Jogo não encontrado")

    profile = await db.hardware_profiles.find_one({"user_id": user["id"]})
    tier = normalise_tier((profile or {}).get("tier"))

    latest = await db.benchmark_runs.find_one(
        {"user_id": user["id"], "game_id": game_id}, sort=[("created_at", -1)]
    )
    if latest:
        your_fps = latest["result_fps"]
        measured_at = _iso(latest["created_at"])
    else:
        state = await load_state(user["id"])
        applied = set(state["applied"])
        lift = sum(
            (TWEAK_BY_KEY[k]["fps_gain"] * (2.0 if k in game["keys"] else 1.0))
            for k in applied
            if k in TWEAK_BY_KEY
        )
        your_fps = int(round(game["baseline_fps"] + lift))
        measured_at = None

    pct = percentile_of(your_fps, game_id, tier)
    return ComparisonOut(
        game_id=game_id,
        game_name=game["name"],
        tier=tier,
        tier_label=TIER_LABEL[tier],
        your_fps=your_fps,
        percentile=pct,
        median_fps=median_fps(game_id, tier),
        top_fps=top_fps(game_id, tier),
        curve=[CohortPoint(percentile=p, fps=f) for p, f in cohort_curve(game_id, tier)],
        verdict=verdict(pct, tier),
        measured_at=measured_at,
    )
