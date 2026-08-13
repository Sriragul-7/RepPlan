import random
from pathlib import Path

import pytest

from app.services.exercise_data import load_from_file
from app.services.planner import (
    MAX_EXERCISES_PER_DAY,
    MIN_EXERCISES_PER_DAY,
    _matches_secondary,
    _matches_target,
    find_swap,
    pick_exercises_for_day,
)
from app.services.split import split_for

DATASET = load_from_file(Path(__file__).resolve().parents[1] / "data" / "exercises.json")


@pytest.fixture(scope="module")
def exercises() -> list[dict]:
    return DATASET


def test_full_gym_day_covers_all_muscles(exercises: list[dict]) -> None:
    split = split_for(4, 2.0)
    for day in split.days:
        picks = pick_exercises_for_day(day.target_muscles, "full gym", exercises, rng=random.Random(1))
        assert MIN_EXERCISES_PER_DAY <= len(picks) <= MAX_EXERCISES_PER_DAY
        for muscle in day.target_muscles:
            assert any(
                _matches_target({"target_muscle": p.target_muscle}, muscle)
                or _matches_secondary({"secondary_muscles": [p.target_muscle]}, muscle)
                for p in picks
            )


def test_no_duplicate_exercises_in_day(exercises: list[dict]) -> None:
    day = split_for(4, 2.0).days[0]
    picks = pick_exercises_for_day(day.target_muscles, "full gym", exercises, rng=random.Random(2))
    ids = [p.exercise_id for p in picks]
    assert len(ids) == len(set(ids))


def test_home_dumbbells_respects_equipment(exercises: list[dict]) -> None:
    day = split_for(4, 2.0).days[1]
    picks = pick_exercises_for_day(day.target_muscles, "home dumbbells", exercises, rng=random.Random(3))
    allowed = {"body weight", "dumbbell", "band", "resistance band", "kettlebell", "stability ball",
               "medicine ball", "roller", "ez barbell", "barbell", "trap bar", "hammer", "bosu ball",
               "wheel roller", "rope", "weighted"}
    for p in picks:
        assert p.equipment in allowed
    assert len(picks) >= 1


def test_bodyweight_only_respects_equipment(exercises: list[dict]) -> None:
    day = split_for(4, 2.0).days[0]
    picks = pick_exercises_for_day(day.target_muscles, "bodyweight only", exercises, rng=random.Random(4))
    allowed = {"body weight", "band", "resistance band", "rope", "wheel roller", "stability ball", "medicine ball"}
    for p in picks:
        assert p.equipment in allowed


def test_prescribed_reps_follow_goal(exercises: list[dict]) -> None:
    day = split_for(4, 2.0).days[0]
    strength = pick_exercises_for_day(day.target_muscles, "full gym", exercises, goal="strength", rng=random.Random(5))
    hypertrophy = pick_exercises_for_day(day.target_muscles, "full gym", exercises, goal="hypertrophy", rng=random.Random(6))
    assert all(p.prescribed_reps == "4-6" or p.prescribed_reps == "8-10" for p in strength)
    assert all(p.prescribed_reps == "8-12" or p.prescribed_reps == "10-15" for p in hypertrophy)


def test_find_swap_same_target_different_equipment(exercises: list[dict]) -> None:
    day = split_for(4, 2.0).days[0]
    picks = pick_exercises_for_day(day.target_muscles, "full gym", exercises, rng=random.Random(7))
    assert picks
    original = next(e for e in exercises if e["id"] == picks[0].exercise_id)
    swap = find_swap(original, exercises, "home dumbbells")
    assert swap is None or swap["target_muscle"] == original["target_muscle"]


def test_picks_are_deterministic_given_seed(exercises: list[dict]) -> None:
    day = split_for(4, 2.0).days[0]
    a = pick_exercises_for_day(day.target_muscles, "full gym", exercises, rng=random.Random(42))
    b = pick_exercises_for_day(day.target_muscles, "full gym", exercises, rng=random.Random(42))
    assert [p.exercise_id for p in a] == [p.exercise_id for p in b]
