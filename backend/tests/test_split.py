from app.services.split import (
    Split,
    experience_level,
    redistribute_day,
    split_for,
)


def test_experience_level_thresholds() -> None:
    assert experience_level(0.5) == "beginner"
    assert experience_level(1.4) == "beginner"
    assert experience_level(1.5) == "intermediate"
    assert experience_level(3.5) == "intermediate"
    assert experience_level(3.6) == "advanced"


def test_full_body_2_days() -> None:
    split = split_for(2, 1.0)
    assert split.split_type == "Full Body"
    assert len(split.days) == 2
    assert all(d.target_muscles for d in split.days)


def test_full_body_3_days() -> None:
    split = split_for(3, 0.5)
    assert split.split_type == "Full Body"
    assert len(split.days) == 3


def test_upper_lower_4_days() -> None:
    split = split_for(4, 2.0)
    assert split.split_type == "Upper / Lower"
    assert len(split.days) == 4
    targets = [d.target_muscles for d in split.days]
    assert "chest" in targets[0] and "quads" in targets[1]
    assert "chest" in targets[2] and "quads" in targets[3]


def test_ppl_plus_two_5_days() -> None:
    split = split_for(5, 2.0)
    assert split.split_type == "Push / Pull / Legs + 2"
    assert len(split.days) == 5


def test_ppl_x2_6_days() -> None:
    split = split_for(6, 4.0)
    assert split.split_type == "Push / Pull / Legs x2"
    assert len(split.days) == 6


def test_bro_split_6_days() -> None:
    split = split_for(6, 5.0, split_preference="bro")
    assert split.split_type == "Bro Split"
    assert len(split.days) == 6


def test_all_days_unique_weekdays() -> None:
    split = split_for(6, 4.0)
    weekdays = [d.day_of_week for d in split.days]
    assert len(weekdays) == len(set(weekdays))


def test_deterministic() -> None:
    a = split_for(5, 3.0)
    b = split_for(5, 3.0)
    assert [d.target_muscles for d in a.days] == [d.target_muscles for d in b.days]


def test_redistribute_day_skips_rest_days() -> None:
    split = split_for(4, 2.0)
    remaining = split.days
    day_to_skip = remaining[0]
    updated = redistribute_day(day_to_skip.target_muscles, remaining)
    skipped = next(d for d in updated if d.day_of_week == day_to_skip.day_of_week)
    assert skipped.target_muscles == day_to_skip.target_muscles
    trained = [d for d in updated if not d.is_rest_day and d.day_of_week != day_to_skip.day_of_week]
    assert len(trained) == 3
    merged = {m for d in trained for m in d.target_muscles}
    for m in day_to_skip.target_muscles:
        assert m in merged


def test_redistribute_is_pure() -> None:
    split = split_for(4, 2.0)
    original = [d.to_dict() for d in split.days]
    redistribute_day(split.days[0].target_muscles, split.days)
    assert [d.to_dict() for d in split.days] == original


def test_split_is_dataclass() -> None:
    split = split_for(2, 0.5)
    assert isinstance(split, Split)
