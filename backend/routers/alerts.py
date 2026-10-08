"""Performance-drop alerts: raised whenever a high-impact tweak stops being applied."""

import logging
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.catalog import TWEAK_BY_KEY
from lib.db import db
from lib.state import load_state, save_and_log
from models.profile import AlertOut, AlertsList
from models.tweaks import StateOut
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/alerts", tags=["alerts"])


def _iso(dt) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def _doc_to_alert(doc: dict) -> AlertOut:
    return AlertOut(
        id=doc["id"],
        tweak_key=doc["tweak_key"],
        tweak_name=doc["tweak_name"],
        fps_lost=doc.get("fps_lost", 0),
        ping_lost=doc.get("ping_lost", 0),
        lag_lost=doc.get("lag_lost", 0),
        source=doc.get("source", "toggle_off"),
        created_at=_iso(doc["created_at"]),
    )


@router.get("", response_model=AlertsList)
async def list_alerts(user: dict = Depends(get_current_user)):
    """Open alerts only — and an alert for a tweak that is applied again is stale, so it is
    cleared on read instead of nagging the player about a drop they already fixed."""
    state = await load_state(user["id"])
    applied = set(state["applied"])
    docs = (
        await db.alerts.find({"user_id": user["id"], "dismissed": False})
        .sort("created_at", -1)
        .to_list(50)
    )
    fresh: list[dict] = []
    stale_ids: list[str] = []
    for doc in docs:
        if doc["tweak_key"] in applied:
            stale_ids.append(doc["id"])
        else:
            fresh.append(doc)
    if stale_ids:
        await db.alerts.update_many({"id": {"$in": stale_ids}}, {"$set": {"dismissed": True}})

    # One alert per tweak: the newest drop wins.
    seen: set[str] = set()
    unique: list[dict] = []
    for doc in fresh:
        if doc["tweak_key"] in seen:
            continue
        seen.add(doc["tweak_key"])
        unique.append(doc)

    return AlertsList(alerts=[_doc_to_alert(d) for d in unique])


@router.post("/{alert_id}/dismiss", status_code=204)
async def dismiss_alert(alert_id: str, user: dict = Depends(get_current_user)):
    result = await db.alerts.update_one(
        {"id": alert_id, "user_id": user["id"]}, {"$set": {"dismissed": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")


@router.post("/{alert_id}/reapply", response_model=StateOut)
async def reapply_alert(alert_id: str, user: dict = Depends(get_current_user)):
    alert = await db.alerts.find_one({"id": alert_id, "user_id": user["id"]})
    if alert is None:
        raise HTTPException(status_code=404, detail="Alerta não encontrado")

    tweak = TWEAK_BY_KEY.get(alert["tweak_key"])
    if tweak is None:
        raise HTTPException(status_code=404, detail="Ajuste não encontrado")
    if tweak["premium"] and not user.get("is_premium", False):
        raise HTTPException(
            status_code=403,
            detail={
                "message": "Ajuste exclusivo do Premium — ative o VIP para desbloquear",
                "tweak_key": tweak["key"],
            },
        )

    state = await load_state(user["id"])
    applied = list(state["applied"])
    if tweak["key"] not in applied:
        applied.append(tweak["key"])

    await db.alerts.update_one({"id": alert_id}, {"$set": {"dismissed": True}})
    return await save_and_log(
        user["id"],
        applied,
        state["rip_mode_active"],
        kind="toggle_on",
        label=f'{tweak["name"]} reaplicado',
        detail="Reaplicado a partir de um alerta de queda de desempenho",
    )
