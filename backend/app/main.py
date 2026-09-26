from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tasks, bounties, users, goals, analytics, tasks_cron, timer

app = FastAPI(title="Glazing API", version="1.0.0")

app.include_router(tasks.router)
app.include_router(bounties.router)
app.include_router(users.router)
app.include_router(goals.router)
app.include_router(analytics.router)
app.include_router(tasks_cron.router)
app.include_router(timer.router)

import os
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

# Allow Vite frontend and deployed domains to communicate with FastAPI
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Telemetry recorded."},
    )

@app.get("/")
def health_check():
    return {"status": "online", "message": "Glazing API is running."}
