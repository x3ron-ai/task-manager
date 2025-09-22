from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.routers import tasks
from app.views import home

app = FastAPI(
    title="Task Manager",
    description="Local Task Manager Server",
)
app.mount("/static", StaticFiles(directory="app/static"), name="static")

app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
app.include_router(home.router, prefix="", tags=["UI"])


@app.get("/ping")
async def ping():
    return {"msg": "pong"}
