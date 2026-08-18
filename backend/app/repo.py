"""Storage abstraction.

Two implementations behind one interface:
  - SupabaseRepo: Postgres via Supabase (production)
  - LocalRepo: JSON files (local dev / tests without a provisioned Supabase)
"""

from __future__ import annotations

import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Protocol

from app.config.settings import settings
from app.db import get_db, reset_db
from app.services.exercise_data import load_from_file
from app.services.split import DAY_LABELS

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
LOCAL_STORE = Path(os.environ.get("REPPLAN_STORE_PATH", str(DATA_DIR / "local_store.json")))


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


def _retry(fn, retries=2):
    """Run fn(), retrying once on connection errors by resetting the DB client."""
    for attempt in range(retries + 1):
        try:
            return fn()
        except Exception:
            if attempt < retries:
                reset_db()
                continue
            raise


class Repo(Protocol):
    def save_profile(self, user_id: str, data: dict) -> dict: ...
    def get_profile(self, user_id: str) -> dict | None: ...

    def create_plan(self, user_id: str, split_type: str, days: list[dict]) -> dict: ...
    def get_current_plan(self, user_id: str) -> dict | None: ...
    def get_plan_day(self, day_id: str) -> dict | None: ...
    def find_plan_by_day(self, day_id: str) -> dict | None: ...
    def update_plan_days(self, plan_id: str, days: list[dict]) -> None: ...

    def list_exercises(self, filters: dict) -> list[dict]: ...
    def get_all_exercises(self) -> list[dict]: ...
    def get_exercise(self, exercise_id: str) -> dict | None: ...

    def start_session(self, user_id: str, plan_day_id: str | None, started_at: str | None = None) -> dict: ...
    def get_session(self, session_id: str) -> dict | None: ...
    def log_set(self, session_id: str, data: dict) -> dict: ...
    def log_cardio(self, session_id: str, data: dict) -> dict: ...
    def complete_session(self, session_id: str) -> dict: ...

    def get_sessions_between(self, user_id: str, start: date, end: date) -> list[dict]: ...
    def progress_for_exercise(self, user_id: str, exercise_id: str) -> list[dict]: ...
    def logged_lifts(self, user_id: str) -> list[dict]: ...
    def muscle_balance(self, user_id: str, week_start: date, week_end: date) -> list[dict]: ...
    def progress_overview(self, user_id: str) -> dict: ...

    def create_coach_conversation(self, user_id: str, title: str | None = None) -> dict: ...
    def get_coach_conversations(self, user_id: str) -> list[dict]: ...
    def get_coach_messages(self, conversation_id: str) -> list[dict]: ...
    def add_coach_message(self, conversation_id: str, role: str, content: str) -> dict: ...

    def log_body_metric(self, user_id: str, weight_kg: float) -> dict: ...
    def get_latest_body_metric(self, user_id: str) -> dict | None: ...
    def get_body_metrics_history(self, user_id: str, days: int = 90) -> list[dict]: ...
    def claim_data(self, guest_id: str, auth_id: str, tables: list[str]) -> None: ...


def _build_overview(sessions: list[dict], get_exercise) -> dict:
    """Derive a progress overview from sessions that already carry their sets."""
    completed = [s for s in sessions if s.get("completed_at")]
    total_sets = sum(len(s.get("sets", [])) for s in sessions)
    total_volume = round(
        sum((x.get("weight_kg") or 0) * (x.get("reps") or 0) for s in sessions for x in s.get("sets", [])),
        1,
    )

    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    def iso_week(d: date) -> date:
        return d - timedelta(days=d.weekday())

    completed_dates = {iso_week(datetime.fromisoformat(s["completed_at"]).date()) for s in completed}
    weekly = []
    for i in range(7, -1, -1):
        ws = week_start - timedelta(weeks=i)
        count = sum(1 for d in completed_dates if d == ws)
        weekly.append({"week": ws.strftime("%b %d"), "workouts": count})

    streak = 0
    i = 0
    while True:
        ws = week_start - timedelta(weeks=i)
        if ws in completed_dates:
            streak += 1
            i += 1
        elif i == 0:
            break
        else:
            break

    recent = []
    for s in sorted(completed, key=lambda s: s["completed_at"], reverse=True)[:8]:
        sets = s.get("sets", [])
        recent.append(
            {
                "id": s["id"],
                "started_at": s["started_at"],
                "sets": len(sets),
                "volume": round(sum((x.get("weight_kg") or 0) * (x.get("reps") or 0) for x in sets), 1),
            }
        )

    by_ex: dict[str, dict] = {}
    for s in sessions:
        for set_row in s.get("sets", []):
            ex_id = set_row["exercise_id"]
            entry = by_ex.setdefault(ex_id, {"best": 0, "last": None, "last_ts": "", "sets": 0})
            w = set_row.get("weight_kg") or 0
            if w > entry["best"]:
                entry["best"] = w
            ts = set_row.get("logged_at") or ""
            if ts > entry["last_ts"]:
                entry["last_ts"] = ts
                entry["last"] = w
            entry["sets"] += 1

    best = []
    for ex_id, e in by_ex.items():
        ex = get_exercise(ex_id)
        best.append(
            {
                "exercise_id": ex_id,
                "name": (ex or {}).get("name", ex_id),
                "best_weight": e["best"],
                "last_weight": e["last"],
                "sets": e["sets"],
            }
        )
    best.sort(key=lambda b: -b["best_weight"])

    return {
        "total_workouts": len(completed),
        "total_sets": total_sets,
        "total_volume": total_volume,
        "streak_weeks": streak,
        "weekly": weekly,
        "recent": recent,
        "best": best[:6],
    }


def _as_list(value) -> list:
    """jsonb columns may contain a JSON-encoded string from older writes."""
    if isinstance(value, list):
        return value
    if isinstance(value, str):
        try:
            parsed = json.loads(value)
            return parsed if isinstance(parsed, list) else []
        except (ValueError, TypeError):
            return []
    return []


# ---------------------------------------------------------------- Supabase


class SupabaseRepo:
    def save_profile(self, user_id: str, data: dict) -> dict:
        db = get_db()
        defaults = {
            "full_name": "",
            "age": 25,
            "weight_kg": 70,
            "height_cm": 170,
            "sex": "other",
            "experience_years": 1,
            "goal": "hypertrophy",
            "days_per_week": 4,
            "equipment_access": "full gym",
            "split_preference": "ppl",
        }
        merged = {**defaults, **data, "id": user_id, "created_at": _now_iso()}
        merged.pop("computed_age", None)
        # Strip None values so NOT NULL columns keep their defaults
        merged = {k: v for k, v in merged.items() if v is not None}
        # Convert date objects to ISO strings for JSON serialization
        for k, v in list(merged.items()):
            if isinstance(v, date):
                merged[k] = v.isoformat()
        # Columns that may not exist in older DB schemas — drop on first error
        _OPTIONAL = {"date_of_birth"}
        try:
            db.table("users").upsert(merged, on_conflict="id").execute()
        except Exception as exc:
            msg = str(exc).lower()
            if "column" in msg and ("not found" in msg or "does not exist" in msg or "could not find" in msg):
                for col in _OPTIONAL:
                    merged.pop(col, None)
                db.table("users").upsert(merged, on_conflict="id").execute()
            else:
                raise
        return merged

    def get_profile(self, user_id: str) -> dict | None:
        db = get_db()
        resp = db.table("users").select("*").eq("id", user_id).limit(1).execute()
        rows = resp.data or []
        return rows[0] if rows else None

    def create_plan(self, user_id: str, split_type: str, days: list[dict]) -> dict:
        db = get_db()
        plan = {"user_id": user_id, "split_type": split_type, "generated_at": _now_iso()}
        plan_row = db.table("weekly_plans").insert(plan).execute().data[0]
        plan_id = plan_row["id"]

        for day in days:
            day_row = {
                "weekly_plan_id": plan_id,
                "day_of_week": day["day_of_week"],
                "target_muscles": day["target_muscles"],
                "is_rest_day": day["is_rest_day"],
            }
            created = db.table("plan_days").insert(day_row).execute().data[0]
            for ex in day.get("exercises", []):
                db.table("plan_day_exercises").insert(
                    {
                        "plan_day_id": created["id"],
                        "exercise_id": ex["exercise_id"],
                        "prescribed_sets": ex["prescribed_sets"],
                        "prescribed_reps": ex.get("prescribed_reps"),
                    }
                ).execute()

        return {"id": plan_id}

    def get_current_plan(self, user_id: str) -> dict | None:
        db = get_db()
        resp = (
            db.table("weekly_plans")
            .select("*")
            .eq("user_id", user_id)
            .order("generated_at", desc=True)
            .limit(1)
            .execute()
        )
        rows = resp.data or []
        if not rows:
            return None
        plan = rows[0]
        plan["days"] = self._load_days(plan["id"])
        plan["user_id"] = user_id
        return plan

    def _load_days(self, plan_id: str) -> list[dict]:
        db = get_db()
        days = db.table("plan_days").select("*").eq("weekly_plan_id", plan_id).execute().data or []
        days.sort(key=lambda d: d["day_of_week"])
        for day in days:
            exercises = (
                db.table("plan_day_exercises")
                .select("*, exercise:exercises(*)")
                .eq("plan_day_id", day["id"])
                .execute()
                .data
                or []
            )
            day["exercises"] = exercises
            day["target_muscles"] = _as_list(day.get("target_muscles"))
            day["label"] = DAY_LABELS.get(day["day_of_week"], "")
        return days

    def get_plan_day(self, day_id: str) -> dict | None:
        db = get_db()
        resp = db.table("plan_days").select("*").eq("id", day_id).limit(1).execute()
        rows = resp.data or []
        if not rows:
            return None
        day = rows[0]
        day["exercises"] = (
            db.table("plan_day_exercises")
            .select("*, exercise:exercises(*)")
            .eq("plan_day_id", day_id)
            .execute()
            .data
            or []
        )
        day["target_muscles"] = _as_list(day.get("target_muscles"))
        day["label"] = DAY_LABELS.get(day["day_of_week"], "")
        return day

    def find_plan_by_day(self, day_id: str) -> dict | None:
        db = get_db()
        resp = db.table("plan_days").select("weekly_plan_id").eq("id", day_id).limit(1).execute()
        rows = resp.data or []
        if not rows:
            return None
        plan_id = rows[0]["weekly_plan_id"]
        plan_resp = db.table("weekly_plans").select("*").eq("id", plan_id).limit(1).execute()
        plans = plan_resp.data or []
        if not plans:
            return None
        plan = plans[0]
        plan["days"] = self._load_days(plan_id)
        return plan

    def update_plan_days(self, plan_id: str, days: list[dict]) -> None:
        db = get_db()
        for day in days:
            db.table("plan_days").update(
                {"target_muscles": day["target_muscles"], "is_rest_day": day.get("is_rest_day", False)}
            ).eq("id", day["id"]).execute()

    def list_exercises(self, filters: dict) -> list[dict]:
        db = get_db()
        query = db.table("exercises").select("*")
        has_filters = False
        for field, value in filters.items():
            if value is not None and value != "":
                query = query.eq(field, value)
                has_filters = True
        if has_filters:
            query = query.limit(100)
        resp = query.execute()
        return resp.data or []

    def get_exercise(self, exercise_id: str) -> dict | None:
        def _query():
            db = get_db()
            resp = db.table("exercises").select("*").eq("id", exercise_id).limit(1).execute()
            rows = resp.data or []
            return rows[0] if rows else None
        return _retry(_query)

    def get_all_exercises(self) -> list[dict]:
        db = get_db()
        resp = db.table("exercises").select("*").execute()
        return resp.data or []

    def start_session(self, user_id: str, plan_day_id: str | None, started_at: str | None = None) -> dict:
        def _query():
            db = get_db()
            timestamp = started_at + "T12:00:00Z" if started_at else _now_iso()
            row = db.table("workout_sessions").insert(
                {"user_id": user_id, "plan_day_id": plan_day_id, "started_at": timestamp}
            ).execute().data[0]
            row["sets"] = []
            row["cardio"] = []
            return row
        return _retry(_query)

    def get_session(self, session_id: str) -> dict | None:
        def _query():
            db = get_db()
            resp = db.table("workout_sessions").select("*").eq("id", session_id).limit(1).execute()
            rows = resp.data or []
            if not rows:
                return None
            session = rows[0]
            session["sets"] = (
                db.table("logged_sets").select("*").eq("session_id", session_id).order("set_number").execute().data or []
            )
            session["cardio"] = db.table("cardio_logs").select("*").eq("session_id", session_id).execute().data or []
            return session
        return _retry(_query)

    def log_set(self, session_id: str, data: dict) -> dict:
        db = get_db()
        exercise_id = data["exercise_id"]
        set_number = data["set_number"]
        existing = (
            db.table("logged_sets")
            .select("id")
            .eq("session_id", session_id)
            .eq("exercise_id", exercise_id)
            .eq("set_number", set_number)
            .limit(1)
            .execute()
            .data
        )
        if existing:
            return (
                db.table("logged_sets")
                .update({**data, "logged_at": _now_iso()})
                .eq("id", existing[0]["id"])
                .execute()
                .data[0]
            )
        return db.table("logged_sets").insert({"session_id": session_id, **data, "logged_at": _now_iso()}).execute().data[0]

    def log_cardio(self, session_id: str, data: dict) -> dict:
        db = get_db()
        return db.table("cardio_logs").insert({"session_id": session_id, **data}).execute().data[0]

    def complete_session(self, session_id: str) -> dict:
        db = get_db()
        db.table("workout_sessions").update({"completed_at": _now_iso()}).eq("id", session_id).execute()
        return self.get_session(session_id)

    def get_sessions_between(self, user_id: str, start: date, end: date) -> list[dict]:
        def _query():
            db = get_db()
            resp = (
                db.table("workout_sessions")
                .select("*")
                .eq("user_id", user_id)
                .gte("started_at", start.isoformat() + "T00:00:00")
                .lte("started_at", end.isoformat() + "T23:59:59")
                .execute()
            )
            sessions = resp.data or []
            for s in sessions:
                s["sets"] = (
                    db.table("logged_sets").select("*").eq("session_id", s["id"]).execute().data or []
                )
            return sessions
        return _retry(_query)

    def progress_for_exercise(self, user_id: str, exercise_id: str) -> list[dict]:
        db = get_db()
        sessions = (
            db.table("workout_sessions").select("id").eq("user_id", user_id).execute().data or []
        )
        ids = [s["id"] for s in sessions]
        if not ids:
            return []
        sets = (
            db.table("logged_sets")
            .select("logged_at, weight_kg, reps")
            .in_("session_id", ids)
            .eq("exercise_id", exercise_id)
            .order("logged_at")
            .execute()
            .data
            or []
        )
        return [
            {"date": s["logged_at"], "weight_kg": s["weight_kg"], "reps": s["reps"]} for s in sets
        ]

    def muscle_balance(self, user_id: str, week_start: date, week_end: date) -> list[dict]:
        sessions = self.get_sessions_between(user_id, week_start, week_end)
        counts: dict[str, int] = {}
        for s in sessions:
            for set_row in s.get("sets", []):
                ex = self.get_exercise(set_row["exercise_id"])
                target = (ex or {}).get("target_muscle", "unknown")
                counts[target] = counts.get(target, 0) + 1
        return [{"muscle": m, "sets": c} for m, c in sorted(counts.items(), key=lambda kv: -kv[1])]

    def logged_lifts(self, user_id: str) -> list[dict]:
        db = get_db()
        sessions = db.table("workout_sessions").select("id").eq("user_id", user_id).execute().data or []
        ids = [s["id"] for s in sessions]
        if not ids:
            return []
        sets = (
            db.table("logged_sets")
            .select("exercise_id")
            .in_("session_id", ids)
            .execute()
            .data
            or []
        )
        counts: dict[str, int] = {}
        for set_row in sets:
            counts[set_row["exercise_id"]] = counts.get(set_row["exercise_id"], 0) + 1
        lifts = []
        for exercise_id, count in counts.items():
            ex = self.get_exercise(exercise_id)
            if ex:
                lifts.append({"exercise_id": exercise_id, "name": ex["name"], "sets": count})
        return sorted(lifts, key=lambda l: -l["sets"])

    def progress_overview(self, user_id: str) -> dict:
        db = get_db()
        sessions = (
            db.table("workout_sessions")
            .select("*")
            .eq("user_id", user_id)
            .order("started_at", desc=True)
            .execute()
            .data
            or []
        )
        for s in sessions:
            s["sets"] = (
                db.table("logged_sets").select("*").eq("session_id", s["id"]).execute().data or []
            )
        return _build_overview(sessions, self.get_exercise)

    def create_coach_conversation(self, user_id: str, title: str | None = None) -> dict:
        db = get_db()
        row = {"user_id": user_id, "title": title, "created_at": _now_iso(), "updated_at": _now_iso()}
        try:
            return db.table("coach_conversations").insert(row).execute().data[0]
        except Exception:
            return {"id": uuid.uuid4().hex, **row}

    def get_coach_conversations(self, user_id: str) -> list[dict]:
        db = get_db()
        try:
            return (
                db.table("coach_conversations")
                .select("*")
                .eq("user_id", user_id)
                .order("updated_at", desc=True)
                .limit(50)
                .execute()
                .data
                or []
            )
        except Exception:
            return []

    def get_coach_messages(self, conversation_id: str) -> list[dict]:
        db = get_db()
        try:
            return (
                db.table("coach_messages")
                .select("*")
                .eq("conversation_id", conversation_id)
                .order("created_at")
                .execute()
                .data
                or []
            )
        except Exception:
            return []

    def add_coach_message(self, conversation_id: str, role: str, content: str) -> dict:
        db = get_db()
        now = _now_iso()
        row = {"conversation_id": conversation_id, "role": role, "content": content, "created_at": now}
        try:
            msg = db.table("coach_messages").insert(row).execute().data[0]
            db.table("coach_conversations").update({"updated_at": now}).eq("id", conversation_id).execute()
            return msg
        except Exception:
            row["id"] = uuid.uuid4().hex
            return row

    def log_body_metric(self, user_id: str, weight_kg: float) -> dict:
        db = get_db()
        row = {"user_id": user_id, "weight_kg": weight_kg, "logged_at": _now_iso()}
        try:
            return db.table("body_metrics").insert(row).execute().data[0]
        except Exception:
            row["id"] = uuid.uuid4().hex
            return row

    def get_latest_body_metric(self, user_id: str) -> dict | None:
        db = get_db()
        try:
            resp = (
                db.table("body_metrics")
                .select("*")
                .eq("user_id", user_id)
                .order("logged_at", desc=True)
                .limit(1)
                .execute()
            )
            rows = resp.data or []
            return rows[0] if rows else None
        except Exception:
            return None

    def get_body_metrics_history(self, user_id: str, days: int = 90) -> list[dict]:
        db = get_db()
        try:
            from datetime import timedelta
            cutoff = (datetime.now(tz=timezone.utc) - timedelta(days=days)).isoformat()
            resp = (
                db.table("body_metrics")
                .select("*")
                .eq("user_id", user_id)
                .gte("logged_at", cutoff)
                .order("logged_at", desc=True)
                .execute()
            )
            return resp.data or []
        except Exception:
            return []

    def claim_data(self, guest_id: str, auth_id: str, tables: list[str]) -> None:
        db = get_db()
        for table in tables:
            # For user-owned tables, re-key user_id column
            if table in ("users", "weekly_plans", "workout_sessions", "body_metrics", "coach_conversations"):
                db.table(table).update({"user_id": auth_id}).eq("user_id", guest_id).execute()
            # logged_sets and cardio_logs reference sessions by session_id FK.
            # The session IDs don't change during claim — only workout_sessions.user_id
            # is re-keyed — so no update is needed for these child tables.


# ---------------------------------------------------------------- Local (JSON)


class LocalRepo:
    def __init__(self, store_path: str | Path = LOCAL_STORE) -> None:
        self.path = Path(store_path)
        self._exercises = None
        self._load()

    def _load(self) -> None:
        if self.path.exists():
            self._data = json.loads(self.path.read_text())
        else:
            self._data = {"users": {}, "plans": {}, "sessions": {}, "coach_conversations": {}, "coach_messages": {}}
        self._data.setdefault("coach_conversations", {})
        self._data.setdefault("coach_messages", {})
        self._data.setdefault("body_metrics", {})
        if self._exercises is None:
            seeded = DATA_DIR / "exercises.json"
            self._exercises = load_from_file(seeded) if seeded.exists() else []

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self._data, indent=2))

    def save_profile(self, user_id: str, data: dict) -> dict:
        row = {"id": user_id, **data, "created_at": _now_iso()}
        row.pop("computed_age", None)
        # Convert date/datetime objects to ISO strings for JSON serialization
        for k, v in list(row.items()):
            if isinstance(v, (date, datetime)):
                row[k] = v.isoformat()
        self._data["users"][user_id] = row
        self._save()
        return row

    def get_profile(self, user_id: str) -> dict | None:
        return self._data["users"].get(user_id)

    def create_plan(self, user_id: str, split_type: str, days: list[dict]) -> dict:
        plan_id = uuid.uuid4().hex
        record = {
            "id": plan_id,
            "user_id": user_id,
            "split_type": split_type,
            "generated_at": _now_iso(),
            "days": [],
        }
        for day in days:
            day_id = uuid.uuid4().hex
            record["days"].append(
                {
                    "id": day_id,
                    "day_of_week": day["day_of_week"],
                    "target_muscles": day["target_muscles"],
                    "is_rest_day": day["is_rest_day"],
                    "label": DAY_LABELS.get(day["day_of_week"], ""),
                    "exercises": [
                        {
                            "id": uuid.uuid4().hex,
                            "exercise_id": ex["exercise_id"],
                            "prescribed_sets": ex["prescribed_sets"],
                            "prescribed_reps": ex.get("prescribed_reps"),
                        }
                        for ex in day.get("exercises", [])
                    ],
                }
            )
        self._data["plans"][user_id] = record
        self._save()
        return {"id": plan_id}

    def _hydrate_days(self, days: list[dict]) -> list[dict]:
        by_id = {e["id"]: e for e in self._exercises}
        for day in days:
            for item in day["exercises"]:
                item["exercise"] = by_id.get(item["exercise_id"])
        return days

    def get_current_plan(self, user_id: str) -> dict | None:
        record = self._data["plans"].get(user_id)
        if not record:
            return None
        record["days"] = self._hydrate_days(record["days"])
        return record

    def get_plan_day(self, day_id: str) -> dict | None:
        for record in self._data["plans"].values():
            for day in record["days"]:
                if day["id"] == day_id:
                    return self._hydrate_days([day])[0]
        return None

    def find_plan_by_day(self, day_id: str) -> dict | None:
        for record in self._data["plans"].values():
            for day in record["days"]:
                if day["id"] == day_id:
                    record["days"] = self._hydrate_days(record["days"])
                    return record
        return None

    def update_plan_days(self, plan_id: str, days: list[dict]) -> None:
        for record in self._data["plans"].values():
            if record["id"] != plan_id:
                continue
            by_id = {d["id"]: d for d in record["days"]}
            for day in days:
                if day["id"] in by_id:
                    by_id[day["id"]]["target_muscles"] = day["target_muscles"]
                    by_id[day["id"]]["is_rest_day"] = day.get("is_rest_day", by_id[day["id"]]["is_rest_day"])
        self._save()

    def list_exercises(self, filters: dict) -> list[dict]:
        result = self._exercises
        has_filters = False
        if filters.get("body_part"):
            result = [e for e in result if e.get("body_part") == filters["body_part"]]
            has_filters = True
        if filters.get("equipment"):
            result = [e for e in result if e.get("equipment") == filters["equipment"]]
            has_filters = True
        if filters.get("target_muscle"):
            result = [e for e in result if e.get("target_muscle") == filters["target_muscle"]]
            has_filters = True
        if has_filters:
            return result[:100]
        return result

    def get_exercise(self, exercise_id: str) -> dict | None:
        for e in self._exercises:
            if e["id"] == exercise_id:
                return e
        return None

    def get_all_exercises(self) -> list[dict]:
        return self._exercises

    def start_session(self, user_id: str, plan_day_id: str | None, started_at: str | None = None) -> dict:
        timestamp = started_at + "T12:00:00Z" if started_at else _now_iso()
        session = {
            "id": uuid.uuid4().hex,
            "user_id": user_id,
            "plan_day_id": plan_day_id,
            "started_at": timestamp,
            "completed_at": None,
            "sets": [],
            "cardio": [],
        }
        self._data["sessions"][session["id"]] = session
        self._save()
        return session

    def get_session(self, session_id: str) -> dict | None:
        return self._data["sessions"].get(session_id)

    def log_set(self, session_id: str, data: dict) -> dict:
        session = self._data["sessions"][session_id]
        exercise_id = data["exercise_id"]
        set_number = data["set_number"]
        for i, existing in enumerate(session["sets"]):
            if existing["exercise_id"] == exercise_id and existing["set_number"] == set_number:
                session["sets"][i] = {**existing, **data, "logged_at": _now_iso()}
                self._save()
                return session["sets"][i]
        row = {"id": uuid.uuid4().hex, "session_id": session_id, **data, "logged_at": _now_iso()}
        session["sets"].append(row)
        self._save()
        return row
        return row

    def log_cardio(self, session_id: str, data: dict) -> dict:
        session = self._data["sessions"][session_id]
        row = {"id": uuid.uuid4().hex, "session_id": session_id, **data}
        session["cardio"].append(row)
        self._save()
        return row

    def complete_session(self, session_id: str) -> dict:
        session = self._data["sessions"][session_id]
        session["completed_at"] = _now_iso()
        self._save()
        return session

    def get_sessions_between(self, user_id: str, start: date, end: date) -> list[dict]:
        start_ts = datetime.combine(start, datetime.min.time(), tzinfo=timezone.utc)
        end_ts = datetime.combine(end, datetime.max.time(), tzinfo=timezone.utc)
        sessions = []
        for s in self._data["sessions"].values():
            if s["user_id"] != user_id:
                continue
            started = datetime.fromisoformat(s["started_at"])
            if start_ts <= started <= end_ts:
                sessions.append(s)
        return sessions

    def progress_for_exercise(self, user_id: str, exercise_id: str) -> list[dict]:
        points = []
        for s in self._data["sessions"].values():
            if s["user_id"] != user_id:
                continue
            for set_row in s["sets"]:
                if set_row["exercise_id"] != exercise_id:
                    continue
                points.append(
                    {"date": set_row["logged_at"], "weight_kg": set_row["weight_kg"], "reps": set_row["reps"]}
                )
        points.sort(key=lambda p: p["date"])
        return points

    def muscle_balance(self, user_id: str, week_start: date, week_end: date) -> list[dict]:
        sessions = self.get_sessions_between(user_id, week_start, week_end)
        counts: dict[str, int] = {}
        for s in sessions:
            for set_row in s["sets"]:
                ex = self.get_exercise(set_row["exercise_id"])
                target = (ex or {}).get("target_muscle", "unknown")
                counts[target] = counts.get(target, 0) + 1
        return [{"muscle": m, "sets": c} for m, c in sorted(counts.items(), key=lambda kv: -kv[1])]

    def logged_lifts(self, user_id: str) -> list[dict]:
        lifts: dict[str, dict] = {}
        for s in self._data["sessions"].values():
            if s["user_id"] != user_id:
                continue
            for set_row in s["sets"]:
                ex = self.get_exercise(set_row["exercise_id"])
                if not ex:
                    continue
                entry = lifts.setdefault(ex["id"], {"exercise_id": ex["id"], "name": ex["name"], "sets": 0})
                entry["sets"] += 1
        return sorted(lifts.values(), key=lambda l: -l["sets"])

    def progress_overview(self, user_id: str) -> dict:
        sessions = [s for s in self._data["sessions"].values() if s["user_id"] == user_id]
        return _build_overview(sessions, self.get_exercise)

    def create_coach_conversation(self, user_id: str, title: str | None = None) -> dict:
        conv_id = uuid.uuid4().hex
        now = _now_iso()
        row = {"id": conv_id, "user_id": user_id, "title": title, "created_at": now, "updated_at": now}
        self._data["coach_conversations"][conv_id] = row
        self._save()
        return row

    def get_coach_conversations(self, user_id: str) -> list[dict]:
        convs = [c for c in self._data["coach_conversations"].values() if c["user_id"] == user_id]
        convs.sort(key=lambda c: c.get("updated_at", ""), reverse=True)
        return convs[:50]

    def get_coach_messages(self, conversation_id: str) -> list[dict]:
        msgs = [m for m in self._data["coach_messages"].values() if m["conversation_id"] == conversation_id]
        msgs.sort(key=lambda m: m.get("created_at", ""))
        return msgs

    def add_coach_message(self, conversation_id: str, role: str, content: str) -> dict:
        msg_id = uuid.uuid4().hex
        now = _now_iso()
        row = {"id": msg_id, "conversation_id": conversation_id, "role": role, "content": content, "created_at": now}
        self._data["coach_messages"][msg_id] = row
        if conversation_id in self._data["coach_conversations"]:
            self._data["coach_conversations"][conversation_id]["updated_at"] = now
        self._save()
        return row

    def log_body_metric(self, user_id: str, weight_kg: float) -> dict:
        metric_id = uuid.uuid4().hex
        row = {"id": metric_id, "user_id": user_id, "weight_kg": weight_kg, "logged_at": _now_iso()}
        self._data["body_metrics"][metric_id] = row
        self._save()
        return row

    def get_latest_body_metric(self, user_id: str) -> dict | None:
        user_metrics = [m for m in self._data["body_metrics"].values() if m["user_id"] == user_id]
        if not user_metrics:
            return None
        user_metrics.sort(key=lambda m: m["logged_at"], reverse=True)
        return user_metrics[0]

    def get_body_metrics_history(self, user_id: str, days: int = 90) -> list[dict]:
        from datetime import timedelta
        cutoff = (datetime.now(tz=timezone.utc) - timedelta(days=days)).isoformat()
        user_metrics = [
            m for m in self._data["body_metrics"].values()
            if m["user_id"] == user_id and m["logged_at"] >= cutoff
        ]
        user_metrics.sort(key=lambda m: m["logged_at"], reverse=True)
        return user_metrics

    def claim_data(self, guest_id: str, auth_id: str, tables: list[str]) -> None:
        # Re-key users table (profile)
        if "users" in tables and guest_id in self._data.get("users", {}):
            self._data["users"][auth_id] = self._data["users"].pop(guest_id)

        # Re-key plans
        if "weekly_plans" in tables and guest_id in self._data.get("plans", {}):
            self._data["plans"][auth_id] = self._data["plans"].pop(guest_id)

        # Re-key sessions
        if "workout_sessions" in tables:
            guest_sessions = [sid for sid, s in self._data.get("sessions", {}).items() if s.get("user_id") == guest_id]
            for sid in guest_sessions:
                self._data["sessions"][sid]["user_id"] = auth_id

        # Re-key body metrics
        if "body_metrics" in tables:
            for m in self._data.get("body_metrics", {}).values():
                if m.get("user_id") == guest_id:
                    m["user_id"] = auth_id

        # Re-key coach conversations
        if "coach_conversations" in tables:
            for c in self._data.get("coach_conversations", {}).values():
                if c.get("user_id") == guest_id:
                    c["user_id"] = auth_id

        self._save()


def get_repo() -> Repo:
    if settings.supabase_url and settings.supabase_service_key:
        return SupabaseRepo()
    return LocalRepo()
