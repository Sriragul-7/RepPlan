import random
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import DayOut, FocusedExercise, MuscleFocusIn, PlanOut
from app.services.planner import pick_exercises_for_day
from app.services.recovery import flagged_muscles, to_nudge
from app.services.split import split_for

router = APIRouter(prefix="/api/plan", tags=["plan"])


def _attach_recovery_nudges(repo, user_id: str, day: dict) -> None:
    today = date.today()
    recent = repo.get_sessions_between(user_id, today - timedelta(days=2), today)
    recent_days: list[tuple[date, list[str]]] = []
    for s in recent:
        muscles: set[str] = set()
        for set_row in s.get("sets", []):
            try:
                exercise = repo.get_exercise(set_row["exercise_id"])
                muscles.add((exercise or {}).get("target_muscle", "unknown"))
            except Exception:
                muscles.add("unknown")
        started = date.fromisoformat(s["started_at"][:10])
        recent_days.append((started, sorted(m for m in muscles if m)))
    flagged = flagged_muscles(day.get("target_muscles", []), recent_days, today)
    day["recovery_nudges"] = [to_nudge(flagged)] if to_nudge(flagged) else []


@router.post("/generate", response_model=PlanOut)
def generate_plan(user_id: str = Depends(get_current_user_id)) -> dict:
    repo = get_repo()
    profile = repo.get_profile(user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    missing = [f for f in ("days_per_week", "experience_years", "goal", "equipment_access") if not profile.get(f)]
    if missing:
        raise HTTPException(status_code=422, detail=f"Profile incomplete, missing: {', '.join(missing)}")

    split = split_for(
        profile["days_per_week"],
        profile["experience_years"],
        profile.get("split_preference", "ppl"),
    )
    exercises = repo.get_all_exercises()
    rng = random.Random(f"{user_id}:{split.split_type}")

    days = []
    for day in split.days:
        picks = pick_exercises_for_day(
            day.target_muscles,
            profile["equipment_access"],
            exercises,
            goal=profile.get("goal", "hypertrophy"),
            rng=rng,
        )
        days.append(
            {
                "day_of_week": day.day_of_week,
                "target_muscles": day.target_muscles,
                "is_rest_day": day.is_rest_day,
                "exercises": [p.to_dict() for p in picks],
            }
        )

    repo.create_plan(user_id, split.split_type, days)
    plan = repo.get_current_plan(user_id)
    for day in plan["days"]:
        _attach_recovery_nudges(repo, user_id, day)
    return plan


@router.get("/current", response_model=PlanOut)
def current_plan(
    skip_recovery: bool = False,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    plan = repo.get_current_plan(user_id)
    if not plan:
        raise HTTPException(status_code=404, detail="No plan yet")
    if not skip_recovery:
        for day in plan["days"]:
            _attach_recovery_nudges(repo, user_id, day)
    return plan


@router.post("/muscle-focus", response_model=list[FocusedExercise])
def muscle_focus(data: MuscleFocusIn, user_id: str = Depends(get_current_user_id)) -> list[dict]:
    repo = get_repo()
    profile = repo.get_profile(user_id)
    equipment = data.equipment_access or (profile or {}).get("equipment_access", "full gym")
    goal = data.goal or (profile or {}).get("goal", "hypertrophy")

    exercises = repo.get_all_exercises()
    rng = random.Random(f"focus:{data.muscle}")
    picks = pick_exercises_for_day([data.muscle], equipment, exercises, goal=goal, rng=rng)
    by_id = {e["id"]: e for e in exercises}
    return [
        {
            **p.to_dict(),
            "exercise": by_id.get(p.exercise_id),
        }
        for p in picks
    ]


@router.get("/day/{day_id}", response_model=DayOut)
def plan_day(
    day_id: str,
    skip_recovery: bool = False,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    day = repo.get_plan_day(day_id)
    if not day:
        raise HTTPException(status_code=404, detail="Day not found")
    if not skip_recovery:
        _attach_recovery_nudges(repo, user_id, day)
    return day


@router.post("/day/{day_id}/replan", response_model=PlanOut)
def replan_skipped_day(day_id: str, user_id: str = Depends(get_current_user_id)) -> dict:
    from app.services.split import PlanDay, redistribute_day

    repo = get_repo()
    plan = repo.find_plan_by_day(day_id)
    if not plan:
        raise HTTPException(status_code=404, detail="Day not found")

    skipped = next((d for d in plan["days"] if d["id"] == day_id), None)
    if not skipped:
        raise HTTPException(status_code=404, detail="Day not found")

    remaining = [d for d in plan["days"] if d["id"] != day_id]
    remaining_days = [
        PlanDay(
            day_of_week=d["day_of_week"],
            label=d.get("label", ""),
            target_muscles=d["target_muscles"],
            is_rest_day=d["is_rest_day"],
        )
        for d in remaining
    ]
    updated = redistribute_day(skipped["target_muscles"], remaining_days)

    payload = [
        {
            "id": remaining[i]["id"],
            "day_of_week": u.day_of_week,
            "target_muscles": u.target_muscles,
            "is_rest_day": u.is_rest_day,
        }
        for i, u in enumerate(updated)
    ]

    repo.update_plan_days(plan["id"], payload)
    repo.update_plan_days(plan["id"], [{"id": day_id, "target_muscles": [], "is_rest_day": True}])

    refreshed = repo.get_current_plan(plan["user_id"])
    for day in refreshed["days"]:
        _attach_recovery_nudges(repo, plan["user_id"], day)
    return refreshed
