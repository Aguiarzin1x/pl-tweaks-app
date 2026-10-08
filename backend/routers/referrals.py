import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from lib.db import db
from lib.supabase import upsert as supabase_upsert, update as supabase_update
from routers.auth import get_current_user

router = APIRouter(tags=["referrals-admin"])
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "plfca11@gmail.com").strip().lower()

class ReferralOut(BaseModel):
    code: str
    link: str
    count: int
class AdminUserOut(BaseModel):
    id: str
    email: str
    is_premium: bool
    referral_count: int
    created_at: str
class AdminToggleIn(BaseModel):
    active: bool

def _code(user: dict) -> str:
    return user.get("referral_code") or user["id"].replace("-", "")[:10]
def _is_admin(user: dict) -> bool:
    return user.get("email", "").lower() == ADMIN_EMAIL
async def _require_admin(user: dict = Depends(get_current_user)) -> dict:
    if not _is_admin(user):
        raise HTTPException(status_code=403, detail="Acesso restrito ao administrador")
    return user

@router.get("/referrals/me", response_model=ReferralOut)
async def my_referral(user: dict = Depends(get_current_user)):
    code = _code(user)
    await db.users.update_one({"id": user["id"]}, {"$set": {"referral_code": code}})
    count = await db.referrals.count_documents({"referrer_id": user["id"], "status": {"$in": ["registered", "qualified"]}})
    base = os.getenv("APP_URL", "http://localhost:3000").rstrip("/")
    return ReferralOut(code=code, link=f"{base}/ref/{code}", count=count)

@router.get("/ref/{code}")
async def track_referral(code: str):
    owner = await db.users.find_one({"referral_code": code})
    if owner:
        await db.referrals.insert_one({"id": str(uuid.uuid4()), "referrer_id": owner["id"], "referral_code": code, "status": "clicked", "created_at": datetime.now(timezone.utc)})
    return {"ok": True, "referral_code": code}

@router.post("/referrals/claim/{code}")
async def claim_referral(code: str, user: dict = Depends(get_current_user)):
    owner = await db.users.find_one({"referral_code": code})
    if not owner or owner["id"] == user["id"] or await db.referrals.find_one({"referred_user_id": user["id"]}):
        return {"claimed": False}
    referral = {"id": str(uuid.uuid4()), "referrer_id": owner["id"], "referred_user_id": user["id"], "referral_code": code, "status": "registered", "created_at": datetime.now(timezone.utc)}
    await db.referrals.insert_one(referral)
    await supabase_upsert("referrals", {**{k: v for k, v in referral.items() if k != "created_at"}, "created_at": referral["created_at"].isoformat()})
    return {"claimed": True}

@router.get("/admin/users", response_model=list[AdminUserOut])
async def admin_users(_: dict = Depends(_require_admin)):
    users = await db.users.find({"guest": {"$ne": True}}).to_list(1000)
    out = []
    for user in users:
        count = await db.referrals.count_documents({"referrer_id": user["id"], "status": {"$in": ["registered", "qualified"]}})
        created = user.get("created_at")
        out.append(AdminUserOut(id=user["id"], email=user["email"], is_premium=bool(user.get("is_premium")), referral_count=count, created_at=created.isoformat() if hasattr(created, "isoformat") else str(created or "")))
    return sorted(out, key=lambda item: item.referral_count, reverse=True)

@router.patch("/admin/users/{user_id}/subscription")
async def admin_subscription(user_id: str, body: AdminToggleIn, _: dict = Depends(_require_admin)):
    target = await db.users.find_one({"id": user_id})
    if target is None:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    await db.users.update_one({"id": user_id}, {"$set": {"is_premium": body.active}})
    await supabase_upsert("subscriptions", {"user_id": user_id, "plan": "vip" if body.active else "free", "active": body.active}, "user_id")
    await supabase_update("users", {"id": f"eq.{user_id}"}, {"is_premium": body.active})
    return {"user_id": user_id, "is_premium": body.active}

@router.get("/admin/leaderboard", response_model=list[AdminUserOut])
async def leaderboard(user: dict = Depends(_require_admin)):
    return await admin_users(user)
