"""Shared optimization-state helpers + action history. Imported by every router that
mutates a user's applied tweaks, so the timeline never misses an action."""

import logging
import uuid
from datetime import datetime, timezone

from lib.catalog import TWEAKS, TWEAK_BY_KEY
from lib.db import db
from models.tweaks import Metrics, StateOut

logger = logging.getLogger(__name__)


def now() -> datetime:
    return datetime.now(timezone.utc)


def metrics(applied: list[str]) -> Metrics:
    total = len(TWEAKS)
    keys = set(applied)
    return Metrics(
        applied=len(keys),
        total=total,
        optimization_pct=round(len(keys) / total * 100, 1),
        fps_gain=round(sum(t["fps_gain"] for t in TWEAKS if t["key"] in keys), 1),
        ping_reduction=round(sum(t["ping_reduction"] for t in TWEAKS if t["key"] in keys), 1),
        input_lag_reduction=round(
            sum(t["input_lag_reduction"] for t in TWEAKS if t["key"] in keys), 1
        ),
    )


def state_out(applied: list[str], rip_mode_active: bool) -> StateOut:
    return StateOut(applied=applied, rip_mode_active=rip_mode_active, metrics=metrics(applied))


async def load_state(user_id: str) -> dict:
    doc = await db.user_states.find_one({"user_id": user_id})
    if doc is None:
        doc = {"user_id": user_id, "applied": [], "rip_mode_active": False}
    return doc


async def save_state(user_id: str, applied: list[str], rip_mode_active: bool) -> None:
    await db.user_states.update_one(
        {"user_id": user_id},
        {
            "$set": {"applied": applied, "rip_mode_active": rip_mode_active, "updated_at": now()},
            "$setOnInsert": {"created_at": now()},
        },
        upsert=True,
    )


async def log_action(
    user_id: str,
    kind: str,
    label: str,
    applied_after: list[str],
    rip_after: bool,
    detail: str = "",
) -> None:
    """Append a timeline entry holding the FULL post-action snapshot, so "restore here"
    can put the machine back exactly as it was at that point."""
    m = metrics(applied_after)
    await db.history.insert_one(
        {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "kind": kind,
            "label": label,
            "detail": detail,
            "applied_after": list(applied_after),
            "rip_after": rip_after,
            "applied_count": m.applied,
            "optimization_pct": m.optimization_pct,
            "created_at": now(),
        }
    )


async def _raise_drop_alerts(
    user_id: str, before: list[str], after: list[str], source: str
) -> None:
    """A high-impact tweak that stops being applied is a performance drop — record it so the
    dashboard can offer "reaplicar". Only `impact == "alto"` qualifies (user's choice)."""
    lost = set(before) - set(after)
    if not lost:
        return
    docs = []
    for key in lost:
        tweak = TWEAK_BY_KEY.get(key)
        if tweak is None or tweak["impact"] != "alto":
            continue
        docs.append(
            {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "tweak_key": key,
                "tweak_name": tweak["name"],
                "fps_lost": tweak["fps_gain"],
                "ping_lost": tweak["ping_reduction"],
                "lag_lost": tweak["input_lag_reduction"],
                "source": source,
                "dismissed": False,
                "created_at": now(),
            }
        )
    if docs:
        await db.alerts.insert_many(docs)


async def save_and_log(
    user_id: str,
    applied: list[str],
    rip_mode_active: bool,
    kind: str,
    label: str,
    detail: str = "",
) -> StateOut:
    previous = (await load_state(user_id))["applied"]
    await save_state(user_id, applied, rip_mode_active)
    await log_action(user_id, kind, label, applied, rip_mode_active, detail)
    await _raise_drop_alerts(user_id, previous, applied, source=kind)
    return state_out(applied, rip_mode_active)
