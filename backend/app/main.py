from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import body_metrics, coach, exercises, plan, profile, progress, session

app = FastAPI(title="RepPlan API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(plan.router)
app.include_router(exercises.router)
app.include_router(session.router)
app.include_router(progress.router)
app.include_router(coach.router)
app.include_router(body_metrics.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
