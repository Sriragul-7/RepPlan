from datetime import date

from app.services.recovery import flagged_muscles, to_nudge


def test_no_flag_within_threshold() -> None:
    day = date(2026, 8, 10)
    recent = [(date(2026, 8, 9), ["chest"])]
    assert flagged_muscles(["chest"], recent, day) == []


def test_flag_when_trained_twice_in_window() -> None:
    day = date(2026, 8, 10)
    recent = [(date(2026, 8, 8), ["chest"]), (date(2026, 8, 9), ["chest"])]
    assert flagged_muscles(["chest", "back"], recent, day) == ["chest"]


def test_outside_window_not_counted() -> None:
    day = date(2026, 8, 10)
    recent = [(date(2026, 8, 5), ["chest"]), (date(2026, 8, 7), ["chest"])]
    assert flagged_muscles(["chest"], recent, day) == []


def test_same_day_does_not_count() -> None:
    day = date(2026, 8, 10)
    recent = [(date(2026, 8, 10), ["chest"]), (date(2026, 8, 9), ["chest"])]
    assert flagged_muscles(["chest"], recent, day) == []


def test_nudge_message() -> None:
    assert to_nudge(["chest"]) == "chest trained recently — consider lighter volume today."
    assert to_nudge(["chest", "back"]).startswith("chest / back trained recently")
    assert to_nudge(["chest", "back", "quads"]).startswith("chest / back and more trained recently")
    assert to_nudge([]) is None
