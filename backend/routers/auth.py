"""Auth boundary — the single swap point for Clerk.

Today (user's choice): /app opens the dashboard with zero clicks — `get_current_user`
auto-provisions a guest account + httpOnly cookie session on first visit instead of
returning 401. Email/password signup and login remain available on /login, plus a demo
account.

When Clerk lands: replace `get_current_user` with Clerk's session verification (e.g.
`clerk-backend` SDK / JWKS check) returning the same `{"id", "email", "is_premium"}` dict
and delete the guest/demo helpers below — no other module reads users or sessions.
"""

import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from passlib.context import CryptContext

from lib.db import db
from models.auth import UserCreate, UserLogin, UserOut

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SESSION_COOKIE = "rip_session"
SESSION_TTL = timedelta(days=30)

DEMO_EMAIL = "demo@riptweaks.app"
DEMO_PASSWORD = "ripdemo123"
# Free network/debloat starters pre-applied for the demo account.
DEMO_SEED_KEYS = [
    "game-bar-dvr-off",
    "background-apps-off",
    "telemetry-disable",
    "tcp-nodelay",
    "network-throttling-off",
    "timer-resolution-0-5ms",
    "pointer-accel-off",
    "usb-polling-1000",
]


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _serialize(user: dict) -> UserOut:
    return UserOut(id=user["id"], email=user["email"], is_premium=user.get("is_premium", False))


async def _open_session(response: Response, user_id: str) -> None:
    token = secrets.token_urlsafe(32)
    expires_at = _now() + SESSION_TTL
    # Aware UTC on write so the expiry comparison never mixes naive/aware datetimes.
    await db.sessions.insert_one({"token": token, "user_id": user_id, "expires_at": expires_at})
    response.set_cookie(
        SESSION_COOKIE,
        token,
        httponly=True,
        samesite="lax",
        max_age=int(SESSION_TTL.total_seconds()),
        path="/",
    )


async def _load_user(request: Request) -> dict | None:
    """Resolve the session cookie to a user, if it is live."""
    token = request.cookies.get(SESSION_COOKIE)
    if not token:
        return None
    session = await db.sessions.find_one({"token": token})
    if session is None:
        return None
    expires_at = session["expires_at"]
    if getattr(expires_at, "tzinfo", None) is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < _now():
        return None
    return await db.users.find_one({"id": session["user_id"]})


# --- BEGIN Clerk swap zone -------------------------------------------------
async def get_current_user(request: Request, response: Response) -> dict:
    """Session dependency. No/invalid session => auto-provision a guest so /app opens the
    panel directly, no login wall. The cookie rides this same response, so the next
    request already carries the identity."""
    user = await _load_user(request)
    if user:
        return user

    tag = uuid.uuid4().hex[:8]
    user = {
        "id": str(uuid.uuid4()),
        "email": f"convidado-{tag}@riptweaks.app",
        "password": None,
        "is_premium": False,
        "guest": True,
        "created_at": _now(),
    }
    await db.users.insert_one(user)
    await _open_session(response, user["id"])
    logger.info("guest session provisioned for %s", user["email"])
    return user
# --- END Clerk swap zone ---------------------------------------------------


async def _ensure_demo_user() -> dict:
    demo = await db.users.find_one({"email": DEMO_EMAIL})
    if demo is None:
        demo = {
            "id": str(uuid.uuid4()),
            "email": DEMO_EMAIL,
            "password": pwd_context.hash(DEMO_PASSWORD),
            "is_premium": False,
            "guest": False,
            "created_at": _now(),
        }
        await db.users.insert_one(demo)
        await db.user_states.update_one(
            {"user_id": demo["id"]},
            {
                "$set": {
                    "applied": list(DEMO_SEED_KEYS),
                    "rip_mode_active": False,
                    "updated_at": _now(),
                },
                "$setOnInsert": {"created_at": _now()},
            },
            upsert=True,
        )
    return demo


@router.post("/signup", response_model=UserOut, status_code=201)
async def signup(body: UserCreate, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=409, detail="Este e-mail já está cadastrado")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password": pwd_context.hash(body.password),
        "is_premium": False,
        "guest": False,
        "created_at": _now(),
    }
    await db.users.insert_one(user)
    await _open_session(response, user["id"])
    return _serialize(user)


@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, response: Response):
    email = body.email.lower()
    if email == DEMO_EMAIL:
        await _ensure_demo_user()
    user = await db.users.find_one({"email": email})
    stored = user.get("password") if user else None
    if not user or not stored or not pwd_context.verify(body.password, stored):
        raise HTTPException(status_code=401, detail="E-mail ou senha incorretos")
    await _open_session(response, user["id"])
    return _serialize(user)


@router.get("/me", response_model=UserOut)
async def me(user: dict = Depends(get_current_user)):
    return _serialize(user)


@router.post("/logout", status_code=204)
async def logout(request: Request):
    token = request.cookies.get(SESSION_COOKIE)
    if token:
        await db.sessions.delete_one({"token": token})
    response = Response(status_code=204)
    response.delete_cookie(SESSION_COOKIE, path="/")
    return response
