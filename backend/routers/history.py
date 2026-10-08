"""Action timeline with point-in-time restore. Each entry carries the full post-action
snapshot, so restoring an entry puts the machine back exactly as it was then."""

import logging
from datetime import timezone

from fastapi import APIRouter, Depends, HTTPException

from lib.catalog import TWEAK_BY_KEY
from lib.db import db
from lib.state import save_and_log
from models.profile import HistoryEntry, HistoryList
from models.tweaks import StateOut
from routers.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/history", tags=["history"])


def _iso(dt) -> str:
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


@router.get("", response_model=HistoryList)
async def list_history(user: dict = Depends(get_current_user)):
    docs = await db.history.find({"user_id": user["id"]}).sort("created_at", -1).to_list(200)
    return HistoryList(
        entries=[
            HistoryEntry(
                id=d["id"],
                kind=d["kind"],
                label=d["label"],
                detail=d.get("detail", ""),
                applied_count=d["applied_count"],
                optimization_pct=d["optimization_pct"],
                created_at=_iso(d["created_at"]),
            )
            for d in docs
        ]
    )


@router.post("/restore/{entry_id}", response_model=StateOut)
async def restore_to_entry(entry_id: str, user: dict = Depends(get_current_user)):
    entry = await db.history.find_one({"id": entry_id, "user_id": user["id"]})
    if entry is None:
        raise HTTPException(status_code=404, detail="Ponto do histórico não encontrado")

    snapshot = list(entry.get("applied_after") or [])
    # The paywall holds everywhere: a snapshot taken while the account had VIP must not
    # smuggle premium tweaks back into a free account.
    if user.get("is_premium", False):
        applied = snapshot
        dropped = 0
    else:
        applied = [k for k in snapshot if not (TWEAK_BY_KEY.get(k) or {}).get("premium")]
        dropped = len(snapshot) - len(applied)

    rip = bool(entry.get("rip_after", False))
    detail = f'Estado restaurado: {entry["label"]} ({len(applied)} ajustes ativos)'
    if dropped:
        detail += f" · {dropped} ajuste(s) Premium não reaplicados"

    return await save_and_log(
        user["id"],
        applied,
        rip,
        kind="history_restore",
        label="Voltou a um ponto do histórico",
        detail=detail,
    )
