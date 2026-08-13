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
from app.db import get_db
from app.services.exercise_data import load_from_file
from app.services.split import DAY_LABELS

DATA_DIR = Path(__file__).resolve().parents[1] / "data"
LOCAL_STORE = Path(os.environ.get("REPPLAN_STORE_PATH", str(DATA_DIR / "local_store.json")))


def _now_iso() -> str:
    return datetime.now(tz=timezone.utc).isoformat()


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

    def start_session(self, user_id: str, plan_day_id: str | None) -> dict: ...
    def get_session(self, session_id: str) -> dict | None: ...
    def log_set(self, session_id: str, data: dict) -> dict: ...
    def log_cardio(self, session_id: str, data: dict) -> dict: ...
    def complete_session(self, session_id: str) -> dict: ...

    def get_sessions_between(self, user_id: str, start: date, end: date) -> list[dict]: ...
    def progress_for_exercise(self, user_id: str, exercise_id: str) -> list[dict]: ...
    def muscle_balance(self, user_id: str, week_start: date, week_end: date) -> list[dict]: ...


# ---------------------------------------------------------------- Supabase


class SupabaseRepo:
    def save_profile(self, user_id: str, data: dict) -> dict:
        db = get_db()
        row = {"id": user_id, **data, "created_at": _now_iso()}
        db.table("users").upsert(row, on_conflict="id").execute()
        return row

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
                "target_muscles": json.dumps(day["target_muscles"]),
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
                {"target_muscles": json.dumps(day["target_muscles"]), "is_rest_day": day.get("is_rest_day", False)}
            ).eq("id", day["id"]).execute()

    def list_exercises(self, filters: dict) -> list[dict]:
        db = get_db()
        query = db.table("exercises").select("*")
        for field, value in filters.items():
            if value is not None and value != "":
                query = query.eq(field, value)
        resp = query.limit(100).execute()
        return resp.data or []

    def get_exercise(self, exercise_id: str) -> dict | None:
        db = get_db()
        resp = db.table("exercises").select("*").eq("id", exercise_id).limit(1).execute()
        rows = resp.data or []
        return rows[0] if rows else None

    def get_all_exercises(self) -> list[dict]:
        db = get_db()
        resp = db.table("exercises").select("*").execute()
        return resp.data or []

    def start_session(self, user_id: str, plan_day_id: str | None) -> dict:
        db = get_db()
        row = db.table("workout_sessions").insert(
            {"user_id": user_id, "plan_day_id": plan_day_id, "started_at": _now_iso()}
        ).execute().data[0]
        row["sets"] = []
        row["cardio"] = []
        return row

    def get_session(self, session_id: str) -> dict | None:
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

    def log_set(self, session_id: str, data: dict) -> dict:
        db = get_db()
        return db.table("logged_sets").insert({"session_id": session_id, **data, "logged_at": _now_iso()}).execute().data[0]

    def log_cardio(self, session_id: str, data: dict) -> dict:
        db = get_db()
        return db.table("cardio_logs").insert({"session_id": session_id, **data}).execute().data[0]

    def complete_session(self, session_id: str) -> dict:
        db = get_db()
        db.table("workout_sessions").update({"completed_at": _now_iso()}).eq("id", session_id).execute()
        return self.get_session(session_id)

    def get_sessions_between(self, user_id: str, start: date, end: date) -> list[dict]:
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
            self._data = {"users": {}, "plans": {}, "sessions": {}}
        if self._exercises is None:
            seeded = DATA_DIR / "exercises.json"
            self._exercises = load_from_file(seeded) if seeded.exists() else []

    def _save(self) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self.path.write_text(json.dumps(self._data, indent=2))

    def save_profile(self, user_id: str, data: dict) -> dict:
        row = {"id": user_id, **data, "created_at": _now_iso()}
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
        if filters.get("body_part"):
            result = [e for e in result if e.get("body_part") == filters["body_part"]]
        if filters.get("equipment"):
            result = [e for e in result if e.get("equipment") == filters["equipment"]]
        if filters.get("target_muscle"):
            result = [e for e in result if e.get("target_muscle") == filters["target_muscle"]]
        return result[:100]

    def get_exercise(self, exercise_id: str) -> dict | None:
        for e in self._exercises:
            if e["id"] == exercise_id:
                return e
        return None

    def get_all_exercises(self) -> list[dict]:
        return self._exercises

    def start_session(self, user_id: str, plan_day_id: str | None) -> dict:
        session = {
            "id": uuid.uuid4().hex,
            "user_id": user_id,
            "plan_day_id": plan_day_id,
            "started_at": _now_iso(),
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
        row = {"id": uuid.uuid4().hex, "session_id": session_id, **data, "logged_at": _now_iso()}
        session["sets"].append(row)
        self._save()
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
        start_ts = datetime.combine(start, datetime.min.time())
        end_ts = datetime.combine(end, datetime.max.time())
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


def get_repo() -> Repo:
    if settings.supabase_url and settings.supabase_service_key:
        return SupabaseRepo()
    return LocalRepo()
