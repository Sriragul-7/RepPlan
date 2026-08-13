import os
import tempfile

import pytest
from fastapi.testclient import TestClient

os.environ["REPPLAN_STORE_PATH"] = os.path.join(tempfile.mkdtemp(), "store.json")

from app.main import app  # noqa: E402

client = TestClient(app)
HEADERS = {"X-User-Id": "test-user"}


def profile_payload(**overrides) -> dict:
    data = {
        "age": 28,
        "weight_kg": 78,
        "height_cm": 180,
        "sex": "male",
        "experience_years": 3.0,
        "goal": "hypertrophy",
        "days_per_week": 4,
        "equipment_access": "full gym",
        "split_preference": "ppl",
    }
    data.update(overrides)
    return data


def test_health() -> None:
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_profile_roundtrip() -> None:
    resp = client.post("/api/profile", headers=HEADERS, json=profile_payload())
    assert resp.status_code == 200
    body = resp.json()
    assert body["age"] == 28
    assert body["id"] == "test-user"


def test_generate_plan() -> None:
    client.post("/api/profile", headers=HEADERS, json=profile_payload())
    resp = client.post("/api/plan/generate", headers=HEADERS)
    assert resp.status_code == 200
    plan = resp.json()
    assert plan["split_type"] == "Upper / Lower"
    assert len(plan["days"]) == 4
    day = plan["days"][0]
    assert day["target_muscles"]
    assert len(day["exercises"]) >= 4
    assert day["exercises"][0]["exercise_id"]
    assert day["recovery_nudges"] == []


def test_current_plan() -> None:
    resp = client.get("/api/plan/current", headers=HEADERS)
    assert resp.status_code == 200
    assert resp.json()["split_type"] == "Upper / Lower"


def test_plan_day_detail() -> None:
    plan = client.get("/api/plan/current", headers=HEADERS).json()
    day_id = plan["days"][0]["id"]
    resp = client.get(f"/api/plan/day/{day_id}", headers=HEADERS)
    assert resp.status_code == 200
    assert resp.json()["exercises"]


def test_replan_skipped_day() -> None:
    plan = client.get("/api/plan/current", headers=HEADERS).json()
    day = plan["days"][0]
    resp = client.post(f"/api/plan/day/{day['id']}/replan", headers=HEADERS)
    assert resp.status_code == 200
    updated = resp.json()
    skipped = next(d for d in updated["days"] if d["id"] == day["id"])
    assert skipped["is_rest_day"] is True
    others = [d for d in updated["days"] if d["id"] != day["id"]]
    merged = {m for d in others for m in d["target_muscles"]}
    for m in day["target_muscles"]:
        assert m in merged


def test_exercise_search_and_swap() -> None:
    resp = client.get("/api/exercises?target=pectorals&equipment=barbell", headers=HEADERS)
    assert resp.status_code == 200
    exercises = resp.json()
    assert exercises
    first = exercises[0]
    assert first["target_muscle"] == "pectorals"
    swap = client.get(f"/api/exercises/{first['id']}/swap?equipment_access=home dumbbells", headers=HEADERS)
    assert swap.status_code == 200
    assert swap.json()["target_muscle"] == "pectorals"


def test_full_session_flow() -> None:
    plan = client.get("/api/plan/current", headers=HEADERS).json()
    day = plan["days"][1]
    start = client.post("/api/session/start", headers=HEADERS, json={"plan_day_id": day["id"]})
    assert start.status_code == 200
    session_id = start.json()["id"]

    exercise_id = day["exercises"][0]["exercise_id"]
    for i in range(1, 4):
        resp = client.post(
            f"/api/session/{session_id}/log-set",
            headers=HEADERS,
            json={"exercise_id": exercise_id, "set_number": i, "weight_kg": 60 + i, "reps": 10},
        )
        assert resp.status_code == 200

    cardio = client.post(
        f"/api/session/{session_id}/log-cardio",
        headers=HEADERS,
        json={"activity_type": "running", "duration_minutes": 20, "distance_km": 3.2, "calories": 180},
    )
    assert cardio.status_code == 200

    complete = client.post(f"/api/session/{session_id}/complete", headers=HEADERS)
    assert complete.status_code == 200
    body = complete.json()
    assert body["completed_at"] is not None
    assert len(body["sets"]) == 3
    assert len(body["cardio"]) == 1


def test_progress_and_muscle_balance() -> None:
    progress = client.get(f"/api/progress/{"0001"}", headers=HEADERS)
    assert progress.status_code == 200
    balance = client.get("/api/progress/muscle-balance", headers=HEADERS)
    assert balance.status_code == 200
    assert isinstance(balance.json(), list)


def test_sessions_this_week() -> None:
    resp = client.get("/api/session/week", headers=HEADERS)
    assert resp.status_code == 200
    sessions = resp.json()
    assert isinstance(sessions, list)
    assert len(sessions) >= 1  # created in test_full_session_flow


def test_muscle_focus() -> None:
    resp = client.post(
        "/api/plan/muscle-focus",
        headers=HEADERS,
        json={"muscle": "shoulders", "equipment_access": "home dumbbells"},
    )
    assert resp.status_code == 200
    exercises = resp.json()
    assert 4 <= len(exercises) <= 6
    for ex in exercises:
        assert ex["exercise_id"]
        assert ex["exercise"]["target_muscle"] == "delts"


def test_unauthorized() -> None:
    resp = client.get("/api/plan/current")
    assert resp.status_code == 401
