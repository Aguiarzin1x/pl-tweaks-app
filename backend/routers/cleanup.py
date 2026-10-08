"""Scheduled RAM/temp-file cleanup — simulated. The schedule lives in Mongo and, whenever
the player opens the app, any run that came due while they were away is materialised
(catch-up), so the history reflects the schedule they chose."""

import logging
import random
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from lib.db import db
from lib.state import log_action, load_state, now
from models.profile import CleanupOut, CleanupRun, CleanupScheduleIn
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cleanup", tags=["cleanup"])

MAX_CATCHUP_RUNS = 12  # don't flood the timeline if the account sat idle for months

DEFAULT_SCHEDULE = {
    "enabled": False,
    "frequency": "diaria",
    "hour": 20,
    "weekday": 0,
}


def _aware(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    return dt.replace(tzinfo=timezone.utc) if dt.tzinfo is None else dt


def _iso(dt: datetime | None) -> str | None:
    aware = _aware(dt)
    return aware.isoformat() if aware else None


def _next_occurrence(after: datetime, frequency: str, hour: int, weekday: int) -> datetime:
    """First scheduled moment strictly after `after`."""
    candidate = after.replace(hour=hour, minute=0, second=0, microsecond=0)
    if frequency == "semanal":
        delta_days = (weekday - candidate.weekday()) % 7
        candidate = candidate + timedelta(days=delta_days)
        while candidate <= after:
            candidate = candidate + timedelta(days=7)
        return candidate
    while candidate <= after:
        candidate = candidate + timedelta(days=1)
    return candidate


def _simulate_run(user_id: str, ran_at: datetime, trigger: str, applied_count: int) -> dict:
    # A tuned machine has less junk to sweep — the numbers track the optimization level.
    relief = min(1.0, applied_count / 50)
    return {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "ran_at": ran_at,
        "trigger": trigger,
        "ram_freed_gb": round(random.uniform(1.2, 4.8) * (1.25 - 0.4 * relief), 1),
        "mb_freed": int(random.uniform(380, 2600) * (1.2 - 0.35 * relief)),
        "files_removed": int(random.uniform(140, 1800) * (1.2 - 0.3 * relief)),
    }


def _doc_to_run(doc: dict) -> CleanupRun:
    return CleanupRun(
        id=doc["id"],
        ran_at=_iso(doc["ran_at"]) or "",
        trigger=doc["trigger"],
        ram_freed_gb=doc["ram_freed_gb"],
        mb_freed=doc["mb_freed"],
        files_removed=doc["files_removed"],
    )


async def _load_schedule(user_id: str) -> dict:
    doc = await db.cleanup_schedules.find_one({"user_id": user_id})
    if doc is None:
        return {**DEFAULT_SCHEDULE, "user_id": user_id, "last_run_at": None, "anchor_at": now()}
    return doc


async def _catch_up(user_id: str, schedule: dict, applied_count: int) -> datetime | None:
    """Materialise scheduled runs that came due while the player was away."""
    if not schedule.get("enabled"):
        return _aware(schedule.get("last_run_at"))

    cursor = _aware(schedule.get("last_run_at")) or _aware(schedule.get("anchor_at")) or now()
    current = now()
    last_run = _aware(schedule.get("last_run_at"))
    created = 0

    while created < MAX_CATCHUP_RUNS:
        nxt = _next_occurrence(
            cursor, schedule.get("frequency", "diaria"), schedule.get("hour", 20), schedule.get("weekday", 0)
        )
        if nxt > current:
            break
        run = _simulate_run(user_id, nxt, "agendada", applied_count)
        await db.cleanup_runs.insert_one(run)
        await log_action(
            user_id,
            kind="cleanup",
            label="Limpeza agendada executada",
            applied_after=(await load_state(user_id))["applied"],
            rip_after=(await load_state(user_id))["rip_mode_active"],
            detail=f'{run["ram_freed_gb"]} GB de RAM e {run["mb_freed"]} MB em disco liberados',
        )
        cursor = nxt
        last_run = nxt
        created += 1

    if created:
        await db.cleanup_schedules.update_one(
            {"user_id": user_id}, {"$set": {"last_run_at": last_run}}, upsert=True
        )
    return last_run


async def _build_out(user_id: str, schedule: dict, last_run: datetime | None) -> CleanupOut:
    docs = await db.cleanup_runs.find({"user_id": user_id}).sort("ran_at", -1).to_list(60)
    runs = [_doc_to_run(d) for d in docs]
    # "Última limpeza" must reflect the newest run of ANY kind — a manual run counts too,
    # even though it never moves the schedule's own last_run_at cursor.
    newest_run = _aware(docs[0]["ran_at"]) if docs else None
    last_seen = max([d for d in (last_run, newest_run) if d is not None], default=None)
    next_run = (
        _next_occurrence(
            now(), schedule.get("frequency", "diaria"), schedule.get("hour", 20), schedule.get("weekday", 0)
        )
        if schedule.get("enabled")
        else None
    )
    return CleanupOut(
        enabled=bool(schedule.get("enabled")),
        frequency=schedule.get("frequency", "diaria"),
        hour=schedule.get("hour", 20),
        weekday=schedule.get("weekday", 0),
        next_run_at=_iso(next_run),
        last_run_at=_iso(last_seen),
        total_runs=len(runs),
        total_mb_freed=sum(r.mb_freed for r in runs),
        runs=runs,
    )


@router.get("", response_model=CleanupOut)
async def get_cleanup(user: dict = Depends(get_current_user)):
    schedule = await _load_schedule(user["id"])
    state = await load_state(user["id"])
    last_run = await _catch_up(user["id"], schedule, len(state["applied"]))
    return await _build_out(user["id"], schedule, last_run)


@router.put("/schedule", response_model=CleanupOut)
async def set_schedule(body: CleanupScheduleIn, user: dict = Depends(get_current_user)):
    existing = await _load_schedule(user["id"])
    payload = {
        "enabled": body.enabled,
        "frequency": body.frequency if body.frequency in ("diaria", "semanal") else "diaria",
        "hour": body.hour,
        "weekday": body.weekday,
        # Re-anchor on enable so catch-up never back-fills before the player opted in.
        "anchor_at": now() if body.enabled and not existing.get("enabled") else existing.get("anchor_at", now()),
    }
    await db.cleanup_schedules.update_one(
        {"user_id": user["id"]},
        {"$set": payload, "$setOnInsert": {"user_id": user["id"], "last_run_at": None}},
        upsert=True,
    )
    schedule = await _load_schedule(user["id"])
    return await _build_out(user["id"], schedule, _aware(schedule.get("last_run_at")))


@router.post("/run", response_model=CleanupOut)
async def run_now(user: dict = Depends(get_current_user)):
    state = await load_state(user["id"])
    run = _simulate_run(user["id"], now(), "manual", len(state["applied"]))
    await db.cleanup_runs.insert_one(run)
    await log_action(
        user["id"],
        kind="cleanup",
        label="Limpeza manual executada",
        applied_after=state["applied"],
        rip_after=state["rip_mode_active"],
        detail=f'{run["ram_freed_gb"]} GB de RAM e {run["mb_freed"]} MB em disco liberados',
    )
    schedule = await _load_schedule(user["id"])
    return await _build_out(user["id"], schedule, _aware(schedule.get("last_run_at")))
