from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import ExerciseOut
from app.services.exercise_data import equipment_compatible
from app.services.planner import find_swap

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


@router.get("", response_model=list[ExerciseOut])
def list_exercises(
    body_part: str | None = Query(default=None),
    equipment: str | None = Query(default=None),
    target: str | None = Query(default=None),
    user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    repo = get_repo()
    return repo.list_exercises(
        {"body_part": body_part, "equipment": equipment, "target_muscle": target}
    )


@router.get("/{exercise_id}/swap", response_model=ExerciseOut)
def swap_exercise(
    exercise_id: str,
    equipment_access: str = Query(default="full gym"),
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    exercise = repo.get_exercise(exercise_id)
    if not exercise:
        raise HTTPException(status_code=404, detail="Exercise not found")

    swap = find_swap(exercise, repo.get_all_exercises(), equipment_access)
    if not swap:
        raise HTTPException(status_code=404, detail="No compatible substitute found")
    return swap
