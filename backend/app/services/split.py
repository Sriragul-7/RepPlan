"""Deterministic, rule-based weekly split generation.

No ML — every decision is explainable from the profile inputs.

Split matrix (from the product spec):

    Days/week | Experience            | Split
    ----------|-----------------------|----------------------------
    2-3       | Any                   | Full Body
    4         | Beginner-Intermediate | Upper / Lower
    5         | Intermediate+         | Push / Pull / Legs + 2
    6         | Advanced              | PPL x2, or user-selected Bro
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

# Muscle names align with the dataset's `target` field values.
MUSCLE_ALIASES: dict[str, list[str]] = {
    "chest": ["pectorals"],
    "back": ["upper back", "lats"],
    "shoulders": ["delts"],
    "quads": ["quads"],
    "hamstrings": ["hamstrings"],
    "glutes": ["glutes"],
    "biceps": ["biceps"],
    "triceps": ["triceps"],
    "abs": ["abs"],
    "calves": ["calves"],
    "forearms": ["forearms"],
    "traps": ["traps"],
}

DAY_LABELS = {
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
    7: "Sunday",
}

COMPOUND_KEYWORDS = re.compile(
    r"(squat|bench|deadlift|row|press|pull-up|chin-up|push-up|dip|lunge|"
    r"clean|snatch|thruster|overhead|bulgarian|hip thrust|good morning|"
    r"dumbbell curl|farmer|carry)"
)


@dataclass
class PlanDay:
    day_of_week: int
    label: str
    target_muscles: list[str]
    is_rest_day: bool = False

    def to_dict(self) -> dict:
        return {
            "day_of_week": self.day_of_week,
            "label": self.label,
            "target_muscles": self.target_muscles,
            "is_rest_day": self.is_rest_day,
        }


@dataclass
class Split:
    split_type: str
    days: list[PlanDay] = field(default_factory=list)


FULL_BODY_A = ["chest", "back", "quads", "hamstrings", "abs"]
FULL_BODY_B = ["shoulders", "back", "glutes", "biceps", "triceps"]
FULL_BODY_C = ["chest", "back", "legs", "arms", "abs"]

UPPER = ["chest", "back", "shoulders", "biceps", "triceps"]
LOWER = ["quads", "hamstrings", "glutes", "calves", "abs"]

PUSH = ["chest", "shoulders", "triceps"]
PULL = ["back", "biceps", "traps", "forearms"]
LEGS = ["quads", "hamstrings", "glutes", "calves"]

BRO_CHEST = ["chest", "triceps"]
BRO_BACK = ["back", "biceps"]
BRO_SHOULDERS = ["shoulders"]
BRO_ARMS = ["biceps", "triceps", "forearms"]
BRO_LEGS = ["quads", "hamstrings", "glutes", "calves"]


def experience_level(experience_years: float) -> str:
    """beginner < 1.5yr, intermediate 1.5-3.5yr, advanced > 3.5yr."""
    if experience_years < 1.5:
        return "beginner"
    if experience_years <= 3.5:
        return "intermediate"
    return "advanced"


def split_for(
    days_per_week: int,
    experience_years: float,
    split_preference: str = "ppl",
) -> Split:
    """Generate a weekly split from profile inputs."""
    level = experience_level(experience_years)

    if days_per_week <= 3:
        return _full_body(days_per_week)

    if days_per_week == 4 and level != "advanced":
        return _upper_lower()

    if days_per_week == 5:
        return _ppl_plus_two()

    if days_per_week == 6 and level == "advanced":
        if split_preference.strip().lower() == "bro":
            return _bro_split()
        return _ppl_x2()

    # Fallbacks for edge combos (4d advanced, 6d non-advanced, etc.)
    if days_per_week == 4:
        return _ppl_plus_one()
    if days_per_week == 5:
        return _ppl_plus_two()
    return _ppl_x2()


def _full_body(days: int) -> Split:
    order = [FULL_BODY_A, FULL_BODY_B, FULL_BODY_C]
    return Split(
        split_type="Full Body",
        days=[
            PlanDay(day_of_week=i + 1, label=DAY_LABELS[i + 1], target_muscles=order[i % len(order)])
            for i in range(days)
        ],
    )


def _upper_lower() -> Split:
    return Split(
        split_type="Upper / Lower",
        days=[
            PlanDay(1, "Monday", UPPER),
            PlanDay(2, "Tuesday", LOWER),
            PlanDay(4, "Thursday", UPPER),
            PlanDay(5, "Friday", LOWER),
        ],
    )


def _ppl_plus_two() -> Split:
    return Split(
        split_type="Push / Pull / Legs + 2",
        days=[
            PlanDay(1, "Monday", PUSH),
            PlanDay(2, "Tuesday", PULL),
            PlanDay(3, "Wednesday", LEGS),
            PlanDay(5, "Friday", UPPER),
            PlanDay(6, "Saturday", LOWER),
        ],
    )


def _ppl_plus_one() -> Split:
    return Split(
        split_type="Push / Pull / Legs + 1",
        days=[
            PlanDay(1, "Monday", PUSH),
            PlanDay(2, "Tuesday", PULL),
            PlanDay(4, "Thursday", LEGS),
            PlanDay(6, "Saturday", UPPER),
        ],
    )


def _ppl_x2() -> Split:
    return Split(
        split_type="Push / Pull / Legs x2",
        days=[
            PlanDay(1, "Monday", PUSH),
            PlanDay(2, "Tuesday", PULL),
            PlanDay(3, "Wednesday", LEGS),
            PlanDay(4, "Thursday", PUSH),
            PlanDay(5, "Friday", PULL),
            PlanDay(6, "Saturday", LEGS),
        ],
    )


def _bro_split() -> Split:
    return Split(
        split_type="Bro Split",
        days=[
            PlanDay(1, "Monday", BRO_CHEST),
            PlanDay(2, "Tuesday", BRO_BACK),
            PlanDay(3, "Wednesday", BRO_SHOULDERS),
            PlanDay(4, "Thursday", BRO_ARMS),
            PlanDay(5, "Friday", BRO_LEGS),
            PlanDay(6, "Saturday", BRO_LEGS),
        ],
    )


def redistribute_day(day_muscles: list[str], remaining_days: list[PlanDay]) -> list[PlanDay]:
    """Re-distribute a skipped day's muscle targets across remaining training days.

    Returns new remaining days (mutates copies, not the inputs). Rest days are skipped.
    """
    trainable = [d for d in remaining_days if not d.is_rest_day]
    if not trainable:
        return [PlanDay(**{**d.to_dict()}) for d in remaining_days]

    updated = {id(d): PlanDay(**{**d.to_dict()}) for d in remaining_days}
    idx = 0
    for muscle in day_muscles:
        if idx >= len(trainable):
            idx = 0
        target = trainable[idx]
        copy = updated[id(target)]
        if muscle not in copy.target_muscles:
            copy.target_muscles.append(muscle)
        idx += 1

    return [updated[id(d)] for d in remaining_days]
