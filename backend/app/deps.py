from fastapi import Depends, Header, HTTPException

from app.config.settings import settings


def get_current_user_id(
    x_user_id: str | None = Header(default=None),
    authorization: str | None = Header(default=None),
) -> str:
    if authorization and authorization.startswith("Bearer ") and settings.supabase_jwt_secret:
        import jwt

        token = authorization.removeprefix("Bearer ")
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience="authenticated",
            )
            return payload["sub"]
        except jwt.PyJWTError:
            raise HTTPException(status_code=401, detail="Invalid token")
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing X-User-Id header")
    return x_user_id


def _supabase_guard() -> None:
    if not settings.supabase_url:
        raise HTTPException(status_code=503, detail="Supabase not configured")


def require_supabase(_: str = Depends(get_current_user_id)) -> None:
    return _supabase_guard()
