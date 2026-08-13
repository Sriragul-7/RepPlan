from fastapi import Depends, Header, HTTPException

from app.config.settings import settings
from app.db import get_db

DEV_HEADER = "x-user-id"


def get_current_user_id(x_user_id: str | None = Header(default=None)) -> str:
    """Resolve the acting user.

    Production: the caller validates a Supabase JWT and passes the user id via
    X-User-Id (or we validate the JWT here once Supabase Auth is wired).
    Dev: X-User-Id is passed directly.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    return x_user_id


def _supabase_guard() -> None:
    if not settings.supabase_url:
        raise HTTPException(status_code=503, detail="Supabase not configured")


def require_supabase(_: str = Depends(get_current_user_id)) -> None:
    return _supabase_guard()
