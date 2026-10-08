"""Integração opcional com Supabase via REST, mantendo o app executável localmente."""
import os
import logging
from typing import Any
import httpx

logger = logging.getLogger(__name__)


def enabled() -> bool:
    return bool(os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")) and bool(os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY"))


def _headers() -> dict[str, str]:
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("SUPABASE_ANON_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
    return {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json", "Prefer": "resolution=merge-duplicates,return=minimal"}


async def upsert(table: str, payload: dict[str, Any], on_conflict: str = "id") -> None:
    if not enabled():
        return
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            base = os.getenv("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
            response = await client.post(f"{base.rstrip('/')}/rest/v1/{table}?on_conflict={on_conflict}", headers=_headers(), json=payload)
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Supabase sync failed for %s: %s", table, exc)


async def select(table: str, params: dict[str, str] | None = None) -> list[dict[str, Any]]:
    if not enabled():
        return []
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            base = os.getenv("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
            response = await client.get(f"{base.rstrip('/')}/rest/v1/{table}", headers=_headers(), params=params or {})
            response.raise_for_status()
            return response.json()
    except Exception as exc:
        logger.warning("Supabase read failed for %s: %s", table, exc)
        return []


async def update(table: str, filters: dict[str, str], payload: dict[str, Any]) -> None:
    if not enabled():
        return
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            base = os.getenv("SUPABASE_URL") or os.environ["NEXT_PUBLIC_SUPABASE_URL"]
            response = await client.patch(f"{base.rstrip('/')}/rest/v1/{table}", headers=_headers(), params=filters, json=payload)
            response.raise_for_status()
    except Exception as exc:
        logger.warning("Supabase update failed for %s: %s", table, exc)
