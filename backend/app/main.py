from fastapi import FastAPI

from app.routers import exercises, plan, profile, progress, session

app = FastAPI(title="RepPlan API", version="0.1.0")

app.include_router(profile.router)
app.include_router(plan.router)
app.include_router(exercises.router)
app.include_router(session.router)
app.include_router(progress.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
