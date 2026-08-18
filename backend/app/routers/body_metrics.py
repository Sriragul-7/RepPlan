from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.deps import get_current_user_id
from app.repo import get_repo

router = APIRouter(prefix="/api/body-metrics", tags=["body-metrics"])


class BodyMetricIn(BaseModel):
    weight_kg: float = Field(ge=20, le=400)


class BodyMetricOut(BaseModel):
    id: str
    user_id: str
    weight_kg: float | None = None
    logged_at: str


@router.post("", response_model=BodyMetricOut)
def log_body_metric(
    data: BodyMetricIn,
    user_id: str = Depends(get_current_user_id),
) -> dict:
    repo = get_repo()
    return repo.log_body_metric(user_id, data.weight_kg)


@router.get("/latest", response_model=BodyMetricOut | None)
def get_latest_body_metric(
    user_id: str = Depends(get_current_user_id),
) -> dict | None:
    repo = get_repo()
    return repo.get_latest_body_metric(user_id)


@router.get("", response_model=list[BodyMetricOut])
def get_body_metrics_history(
    days: int = 90,
    user_id: str = Depends(get_current_user_id),
) -> list[dict]:
    repo = get_repo()
    return repo.get_body_metrics_history(user_id, days)
