from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import tasks, bounties, users, goals, analytics, tasks_cron, timer, gym, admin

app = FastAPI(title="Glazing API", version="1.0.0")

app.include_router(tasks.router)
app.include_router(bounties.router)
app.include_router(users.router)
app.include_router(goals.router)
app.include_router(analytics.router)
app.include_router(tasks_cron.router)
app.include_router(timer.router)
app.include_router(gym.router)
app.include_router(admin.router)


import os
import traceback
from fastapi import Request
from fastapi.responses import JSONResponse

# Allow Vite frontend and deployed domains to communicate with FastAPI
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [o.strip() for o in allowed_origins_env.split(",") if o.strip()]
if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://glazing-lac.vercel.app"
    ]
elif "https://glazing-lac.vercel.app" not in allowed_origins:
    allowed_origins.append("https://glazing-lac.vercel.app")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://glazing(-[a-z0-9-]+)?\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MAX_GENERAL_BODY_SIZE = 2 * 1024 * 1024   # 2MB for standard JSON API payloads
MAX_UPLOAD_BODY_SIZE = 10 * 1024 * 1024   # 10MB for proof screenshot uploads

@app.middleware("http")
async def enforce_payload_limits(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            length = int(content_length)
            is_upload = request.url.path.endswith("/upload-proof")
            max_limit = MAX_UPLOAD_BODY_SIZE if is_upload else MAX_GENERAL_BODY_SIZE
            if length > max_limit:
                return JSONResponse(
                    status_code=413,
                    content={"detail": f"Payload Too Large. Maximum allowed size is {max_limit // (1024 * 1024)}MB."}
                )
        except ValueError:
            pass
    return await call_next(request)

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
    return response

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    req_origin = request.headers.get("origin", "")
    # Strict defense: Only reflect whitelisted CORS origins, never wildcard with credentials
    cors_origin = req_origin if req_origin in allowed_origins else (allowed_origins[0] if allowed_origins else "")
    headers = {
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Methods": "*"
    }
    if cors_origin:
        headers["Access-Control-Allow-Origin"] = cors_origin

    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred. Telemetry logged."},
        headers=headers
    )

@app.get("/")
@app.get("/health")
@app.get("/api")
@app.get("/api/health")
def health_check():
    return {"status": "online", "message": "Glazing API is running."}

@app.get("/api/midterm-status")
def midterm_status():
    from app.midterm import is_midterm_freeze_active, get_midterm_remaining_seconds, MIDTERM_RESUME_DATE
    return {
        "active": is_midterm_freeze_active(),
        "resume_date": MIDTERM_RESUME_DATE.isoformat(),
        "seconds_remaining": get_midterm_remaining_seconds(),
        "message": "We're sorry midterms are approaching and because of that glazing has stopped validating any action whatsoever until 6 november"
    }

