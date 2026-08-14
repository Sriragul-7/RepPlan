from datetime import date, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.deps import get_current_user_id
from app.repo import get_repo
from app.schemas.models import (
    LogCardioIn,
    LogSetIn,
    SessionOut,
    SessionStartIn,
)

router = APIRouter(prefix="/api/session", tags=["session"])


@router.get("/week", response_model=list[SessionOut])
def sessions_this_week(user_id: str = Depends(get_current_user_id)) -> list[dict]:
    repo = get_repo()
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    return repo.get_sessions_between(user_id, week_start, today)


@router.get("/history", response_model=list[SessionOut])
def session_history(
    start: date = Query(..., description="Start date (YYYY-MM-DD)"),
    end: date = Query(..., description="End date (YYYY-MM-DD)"),
    user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    repo = get_repo()
    return repo.get_sessions_between(user_id, start, end)


@router.post("/start", response_model=SessionOut)
def start_session(
    data: SessionStartIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    return repo.start_session(user_id, data.plan_day_id)


@router.get("/{session_id}", response_model=SessionOut)
def get_session(session_id: str, user_id: str = Depends(get_current_user_id)) -> dict:
    repo = get_repo()
    session = repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


@router.post("/{session_id}/log-set", response_model=dict)
def log_set(
    session_id: str,
    data: LogSetIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    session = repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return repo.log_set(session_id, data.model_dump())


@router.post("/{session_id}/log-cardio", response_model=dict)
def log_cardio(
    session_id: str,
    data: LogCardioIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    session = repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return repo.log_cardio(session_id, data.model_dump())


@router.post("/{session_id}/complete", response_model=SessionOut)
def complete_session(
    session_id: str,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    session = repo.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return repo.complete_session(session_id)
