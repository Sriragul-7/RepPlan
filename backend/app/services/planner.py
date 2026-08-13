"""Daily target-muscle planner.

Turns a plan day's target muscles into concrete exercises pulled from the
dataset, filtered by the user's equipment access. Primary target-muscle
matches are preferred; secondary-muscle matches are used as a fallback so
small muscles (calves, abs) still get covered on restricted equipment.
"""

from __future__ import annotations

import random
from dataclasses import dataclass

from .exercise_data import equipment_compatible
from .split import COMPOUND_KEYWORDS, MUSCLE_ALIASES

MIN_EXERCISES_PER_DAY = 4
MAX_EXERCISES_PER_DAY = 6
MAX_PER_MUSCLE = 2

REP_SCHEMES: dict[str, dict[str, tuple[int, str]]] = {
    "hypertrophy": {"compound": (4, "8-12"), "isolation": (3, "10-15")},
    "strength": {"compound": (5, "4-6"), "isolation": (4, "8-10")},
    "general fitness": {"compound": (3, "8-12"), "isolation": (3, "10-15")},
}


@dataclass
class PlannedExercise:
    exercise_id: str
    name: str
    target_muscle: str
    equipment: str
    prescribed_sets: int
    prescribed_reps: str
    thumbnail_url: str | None = None
    gif_url: str | None = None

    def to_dict(self) -> dict:
        return {
            "exercise_id": self.exercise_id,
            "name": self.name,
            "target_muscle": self.target_muscle,
            "equipment": self.equipment,
            "prescribed_sets": self.prescribed_sets,
            "prescribed_reps": self.prescribed_reps,
            "thumbnail_url": self.thumbnail_url,
            "gif_url": self.gif_url,
        }


def _matches_target(exercise: dict, canonical_muscle: str) -> bool:
    return exercise.get("target_muscle", "") in MUSCLE_ALIASES.get(canonical_muscle, [])


def _matches_secondary(exercise: dict, canonical_muscle: str) -> bool:
    aliases = MUSCLE_ALIASES.get(canonical_muscle, [])
    secondary = exercise.get("secondary_muscles") or []
    return bool(aliases) and any(s in aliases for s in secondary)


def _is_compound(exercise: dict) -> bool:
    return bool(COMPOUND_KEYWORDS.search(exercise.get("name", "")))


def _prescribe(exercise: dict, goal: str) -> tuple[int, str]:
    scheme = REP_SCHEMES.get(goal, REP_SCHEMES["hypertrophy"])
    compound = _is_compound(exercise)
    return scheme["compound" if compound else "isolation"]


def candidates_for_muscle(
    exercises: list[dict],
    canonical_muscle: str,
    equipment_access: str,
) -> list[dict]:
    """Exercises whose primary target matches the muscle and fit the equipment."""
    return [
        e
        for e in exercises
        if _matches_target(e, canonical_muscle)
        and equipment_compatible(equipment_access, e.get("equipment", ""))
    ]


def pick_exercises_for_day(
    muscles: list[str],
    equipment_access: str,
    exercises: list[dict],
    goal: str = "hypertrophy",
    rng: random.Random | None = None,
) -> list[PlannedExercise]:
    """Select 4-6 exercises covering the day's target muscles."""
    rng = rng or random.Random()
    used: set[str] = set()
    chosen: list[PlannedExercise] = []

    primary_by_muscle: dict[str, list[dict]] = {}
    secondary_by_muscle: dict[str, list[dict]] = {}

    for muscle in muscles:
        primary = candidates_for_muscle(exercises, muscle, equipment_access)
        rng.shuffle(primary)
        primary_by_muscle[muscle] = primary

        secondary = [
            e
            for e in exercises
            if _matches_secondary(e, muscle)
            and not _matches_target(e, muscle)
            and equipment_compatible(equipment_access, e.get("equipment", ""))
        ]
        rng.shuffle(secondary)
        secondary_by_muscle[muscle] = secondary

    counts: dict[str, int] = {}

    def take(muscle: str) -> bool:
        if counts.get(muscle, 0) >= MAX_PER_MUSCLE:
            return False
        pool = primary_by_muscle[muscle] + secondary_by_muscle[muscle]
        for ex in pool:
            if ex["id"] in used:
                continue
            sets, reps = _prescribe(ex, goal)
            chosen.append(
                PlannedExercise(
                    exercise_id=ex["id"],
                    name=ex["name"],
                    target_muscle=ex["target_muscle"],
                    equipment=ex["equipment"],
                    prescribed_sets=sets,
                    prescribed_reps=reps,
                    thumbnail_url=ex["thumbnail_url"],
                    gif_url=ex["gif_url"],
                )
            )
            used.add(ex["id"])
            counts[muscle] = counts.get(muscle, 0) + 1
            return True
        return False

    # Round-robin: every muscle gets a first pick before any second pick.
    for _round in range(MAX_PER_MUSCLE):
        if len(chosen) >= MAX_EXERCISES_PER_DAY:
            break
        progressed = False
        for muscle in muscles:
            if len(chosen) >= MAX_EXERCISES_PER_DAY:
                break
            if take(muscle):
                progressed = True
        if not progressed:
            break

    # If we're short of the minimum (rare on restricted equipment), allow
    # second passes over muscles that still have candidates.
    while len(chosen) < MIN_EXERCISES_PER_DAY:
        progressed = False
        for muscle in muscles:
            if len(chosen) >= MIN_EXERCISES_PER_DAY:
                break
            if take(muscle):
                progressed = True
        if not progressed:
            break

    return chosen


def find_swap(
    exercise: dict,
    exercises: list[dict],
    equipment_access: str,
) -> dict | None:
    """Closest substitute: same target muscle, different equipment."""
    target = exercise.get("target_muscle")
    if not target:
        return None
    candidates = [
        e
        for e in exercises
        if e["target_muscle"] == target
        and e["id"] != exercise.get("id")
        and equipment_compatible(equipment_access, e.get("equipment", ""))
    ]
    if not candidates:
        return None
    candidates.sort(key=lambda e: e["name"])
    return candidates[0]
