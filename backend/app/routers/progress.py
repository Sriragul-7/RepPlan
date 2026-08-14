from datetime import date, timedelta

from fastapi import APIRouter, Depends

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import LiftPoint, MuscleBalance

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("/overview", response_model=dict)
def progress_overview(user_id: str = Depends(get_current_user_id)) -> dict:
    repo = get_repo()
    return repo.progress_overview(user_id)


@router.get("/lifts", response_model=list[dict])
def logged_lifts(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    repo = get_repo()
    return repo.logged_lifts(user_id)


@router.get("/muscle-balance", response_model=list[MuscleBalance])
def muscle_balance(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    repo = get_repo()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    return repo.muscle_balance(user_id, week_start, today)


@router.get("/{exercise_id}", response_model=list[LiftPoint])
def progress_for_exercise(
    exercise_id: str,
    user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    repo = get_repo()
    points = repo.progress_for_exercise(user_id, exercise_id)
    return [
        {
            "date": p["date"],
            "weight_kg": p["weight_kg"],
            "reps": p["reps"],
            "volume": (p["weight_kg"] or 0) * (p["reps"] or 0),
        }
        for p in points
    ]
