"""Recovery flag — a lightweight heuristic, deliberately not a science engine.

If a muscle group is trained twice within 48 hours, flag the later day so the
UI can surface a non-blocking "consider lighter volume" nudge.
"""

from __future__ import annotations

from datetime import date, timedelta

RECOVERY_WINDOW_DAYS = 2
RECOVERY_THRESHOLD = 2


def flagged_muscles(
    day_muscles: list[str],
    recent_days: list[tuple[date, list[str]]],
    target_day: date,
    window_days: int = RECOVERY_WINDOW_DAYS,
) -> list[str]:
    """Given a target day's muscles and the (date, muscles) of recently trained
    days, return which target-day muscles were already trained twice in the
    window before target_day."""
    cutoff = target_day - timedelta(days=window_days)
    counts: dict[str, int] = {}
    for trained_day, muscles in recent_days:
        if cutoff <= trained_day < target_day:
            for m in muscles:
                counts[m] = counts.get(m, 0) + 1
    return [m for m in day_muscles if counts.get(m, 0) >= RECOVERY_THRESHOLD]


def to_nudge(flagged: list[str]) -> str | None:
    """One human line for the flagged muscles, or None if nothing to say."""
    if not flagged:
        return None
    joined = " / ".join(flagged[:2])
    if len(flagged) > 2:
        joined += " and more"
    return f"{joined} trained recently — consider lighter volume today."
