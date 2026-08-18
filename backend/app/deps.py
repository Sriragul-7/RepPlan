from fastapi import Header, HTTPException

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
