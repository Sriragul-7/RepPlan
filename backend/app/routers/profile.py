from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import ProfileIn, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


class ClaimIn(BaseModel):
    guest_user_id: str


@router.post("/claim")
def claim_guest_profile(
    data: ClaimIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    guest_id = data.guest_user_id
    if not guest_id or guest_id == user_id:
        return {"claimed": False}

    # Check if authenticated user already has data — skip claim to avoid overwrite
    existing_profile = repo.get_profile(user_id)
    if existing_profile:
        return {"claimed": False}

    # Re-key all data tables from guest_user_id to authenticated user_id
    tables_to_migrate = [
        "users",
        "weekly_plans",
        "workout_sessions",
        "logged_sets",
        "cardio_logs",
        "body_metrics",
        "coach_conversations",
    ]

    try:
        repo.claim_data(guest_id, user_id, tables_to_migrate)
        return {"claimed": True}
    except Exception:
        return {"claimed": False}


def _profile_dict(data: ProfileIn) -> dict:
    """Strip computed fields before writing to DB."""
    d = data.model_dump(exclude_unset=True)
    computed_age = d.pop("computed_age", None)
    if d.get("date_of_birth"):
        # date_of_birth is the source of truth for age — keep them in sync
        d["age"] = computed_age
    return d


@router.post("", response_model=ProfileOut)
def create_or_update_profile(
    data: ProfileIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    return repo.save_profile(user_id, _profile_dict(data))


@router.patch("", response_model=ProfileOut)
def patch_profile(
    data: ProfileIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    existing = repo.get_profile(user_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Profile not found. Use POST to create.")
    updates = {k: v for k, v in _profile_dict(data).items() if v is not None}
    merged = {**existing, **updates}
    return repo.save_profile(user_id, merged)


@router.get("", response_model=ProfileOut)
def get_profile(user_id: str = Depends(get_current_user_id)) -> dict:
    repo = get_repo()
    profile = repo.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
