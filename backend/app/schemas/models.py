"""Pydantic request/response schemas."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ProfileIn(BaseModel):
    full_name: str | None = None
    age: int = Field(ge=13, le=100)
    weight_kg: float | None = Field(default=None, ge=20, le=400)
    height_cm: float | None = Field(default=None, ge=80, le=280)
    sex: str | None = None
    experience_years: float = Field(ge=0, le=50)
    goal: str = "hypertrophy"
    days_per_week: int = Field(ge=2, le=6)
    equipment_access: str = "full gym"
    split_preference: str = "ppl"


class ProfileOut(ProfileIn):
    id: str
    created_at: datetime


class ExerciseOut(BaseModel):
    id: str
    name: str
    category: str | None = None
    body_part: str | None = None
    equipment: str | None = None
    target_muscle: str | None = None
    secondary_muscles: list[str] = Field(default_factory=list)
    instructions_en: str | None = None
    thumbnail_url: str | None = None
    gif_url: str | None = None


class DayExerciseOut(BaseModel):
    id: str
    exercise_id: str
    prescribed_sets: int
    prescribed_reps: str | None = None
    exercise: ExerciseOut | None = None


class DayOut(BaseModel):
    id: str
    day_of_week: int
    label: str
    target_muscles: list[str]
    is_rest_day: bool
    recovery_nudges: list[str] = Field(default_factory=list)
    exercises: list[DayExerciseOut] = Field(default_factory=list)


class PlanOut(BaseModel):
    id: str
    user_id: str
    split_type: str
    generated_at: datetime
    days: list[DayOut] = Field(default_factory=list)


class PlanGenerateOut(BaseModel):
    plan: PlanOut
    split_type: str


class MuscleFocusIn(BaseModel):
    muscle: str
    equipment_access: str = "full gym"
    goal: str = "hypertrophy"


class FocusedExercise(BaseModel):
    exercise_id: str
    name: str
    target_muscle: str
    equipment: str
    prescribed_sets: int
    prescribed_reps: str | None = None
    thumbnail_url: str | None = None
    gif_url: str | None = None
    exercise: ExerciseOut | None = None


class ReplanIn(BaseModel):
    skip_day_id: str
    note: str | None = None


class SessionStartIn(BaseModel):
    plan_day_id: str | None = None


class SessionOut(BaseModel):
    id: str
    user_id: str
    plan_day_id: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
    sets: list[dict[str, Any]] = Field(default_factory=list)
    cardio: list[dict[str, Any]] = Field(default_factory=list)


class LogSetIn(BaseModel):
    exercise_id: str
    set_number: int = Field(ge=1)
    weight_kg: float | None = Field(default=None, ge=0)
    reps: int | None = Field(default=None, ge=0)


class LogCardioIn(BaseModel):
    activity_type: str
    duration_minutes: int | None = Field(default=None, ge=0)
    distance_km: float | None = Field(default=None, ge=0)
    calories: int | None = Field(default=None, ge=0)


class LiftPoint(BaseModel):
    date: datetime
    weight_kg: float | None = None
    reps: int | None = None
    volume: float = 0


class MuscleBalance(BaseModel):
    muscle: str
    sets: int
