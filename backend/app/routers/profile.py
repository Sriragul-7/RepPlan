from fastapi import APIRouter, Depends

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import ProfileIn, ProfileOut

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.post("", response_model=ProfileOut)
def create_or_update_profile(
    data: ProfileIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    return repo.save_profile(user_id, data.model_dump())
