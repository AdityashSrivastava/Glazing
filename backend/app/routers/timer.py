import os
import json
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/api/timer", tags=["Pomodoro Timer"])

IST = timezone(timedelta(hours=5, minutes=30))

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "focus_sessions.json")

class FocusSessionCreate(BaseModel):
    task_id: Optional[str] = None
    task_title: str = "General Deep Work"
    duration_minutes: int = Field(..., gt=0, le=720)
    mode: str = "pomo" # "pomo" or "stopwatch"
    started_at: datetime
    completed_at: datetime

class FocusSessionItem(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str] = None
    task_title: str
    duration_minutes: int
    mode: str
    started_at: str
    completed_at: str
    created_at: str

class TimerOverviewStats(BaseModel):
    todays_pomos: int
    todays_focus_duration_minutes: int
    total_pomos: int
    total_focus_duration_minutes: int

def _load_all_sessions() -> dict:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DATA_FILE):
        return {}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def _save_all_sessions(data: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def _get_user_sessions(user_id: str) -> List[dict]:
    # 1. Try Supabase cloud table first
    try:
        res = db.table("focus_sessions").select("*").eq("user_id", user_id).order("completed_at", desc=True).execute()
        if res.data:
            return res.data
    except Exception:
        pass

    # 2. Fallback to local storage
    all_data = _load_all_sessions()
    sessions = all_data.get(user_id, [])
    # Sort descending by completed_at
    sessions.sort(key=lambda s: s.get("completed_at", ""), reverse=True)
    return sessions

def get_tasks_focus_durations(user_id: str) -> dict:
    """Returns a dictionary mapping task_id -> total_duration_minutes for the user."""
    sessions = _get_user_sessions(user_id)
    durations = {}
    for s in sessions:
        tid = s.get("task_id")
        if tid:
            durations[str(tid)] = durations.get(str(tid), 0) + int(s.get("duration_minutes", 0))
    return durations

def get_all_tasks_focus_durations() -> dict:
    """Returns a dictionary mapping task_id -> total_duration_minutes across all users."""
    durations = {}
    try:
        res = db.table("focus_sessions").select("task_id, duration_minutes").not_.is_("task_id", "null").execute()
        if res.data:
            for s in res.data:
                tid = s.get("task_id")
                if tid:
                    durations[str(tid)] = durations.get(str(tid), 0) + int(s.get("duration_minutes", 0))
            if durations:
                return durations
    except Exception:
        pass

    all_data = _load_all_sessions()
    for u_sessions in all_data.values():
        if isinstance(u_sessions, list):
            for s in u_sessions:
                tid = s.get("task_id")
                if tid:
                    durations[str(tid)] = durations.get(str(tid), 0) + int(s.get("duration_minutes", 0))
    return durations

@router.get("/stats", response_model=TimerOverviewStats)
async def get_timer_stats(current_user_id: str = Depends(get_current_user)):
    """Computes today's and lifetime pomodoro stats for the operative in IST."""
    sessions = _get_user_sessions(current_user_id)
    now_ist = datetime.now(IST)
    today_ist_str = now_ist.date().isoformat()

    todays_pomos = 0
    todays_focus_duration = 0
    total_pomos = 0
    total_focus_duration = 0

    for s in sessions:
        dur = int(s.get("duration_minutes", 0))
        mode = s.get("mode", "pomo")
        c_at = str(s.get("completed_at", ""))

        # Check if completed today in IST
        is_today = c_at.startswith(today_ist_str)

        if mode == "pomo":
            total_pomos += 1
            if is_today:
                todays_pomos += 1

        total_focus_duration += dur
        if is_today:
            todays_focus_duration += dur

    return TimerOverviewStats(
        todays_pomos=todays_pomos,
        todays_focus_duration_minutes=todays_focus_duration,
        total_pomos=total_pomos,
        total_focus_duration_minutes=total_focus_duration
    )

@router.get("/records", response_model=List[FocusSessionItem])
async def get_focus_records(current_user_id: str = Depends(get_current_user)):
    """Fetches user focus records sorted chronologically for the timeline view."""
    sessions = _get_user_sessions(current_user_id)
    return [FocusSessionItem(**s) for s in sessions]

@router.post("/session", response_model=FocusSessionItem)
async def record_focus_session(payload: FocusSessionCreate, current_user_id: str = Depends(get_current_user)):
    """Logs a completed Pomodoro or Stopwatch focus interval."""
    all_data = _load_all_sessions()
    user_sessions = all_data.setdefault(current_user_id, [])

    now_ist = datetime.now(IST).isoformat()
    session_id = str(uuid.uuid4())

    new_session = {
        "id": session_id,
        "user_id": current_user_id,
        "task_id": payload.task_id if payload.task_id else None,
        "task_title": payload.task_title.strip() if payload.task_title else "General Deep Work",
        "duration_minutes": payload.duration_minutes,
        "mode": payload.mode,
        "started_at": payload.started_at.isoformat(),
        "completed_at": payload.completed_at.isoformat(),
        "created_at": now_ist
    }

    # 1. Local backup
    user_sessions.append(new_session)
    _save_all_sessions(all_data)

    # 2. Supabase cloud sync
    try:
        db.table("focus_sessions").insert(new_session).execute()
    except Exception:
        pass

    return FocusSessionItem(**new_session)

@router.delete("/session/{session_id}")
async def delete_focus_session(session_id: str, current_user_id: str = Depends(get_current_user)):
    """Deletes a focus session entry from user timeline."""
    all_data = _load_all_sessions()
    user_sessions = all_data.get(current_user_id, [])

    initial_len = len(user_sessions)
    all_data[current_user_id] = [s for s in user_sessions if s.get("id") != session_id]

    if len(all_data[current_user_id]) == initial_len:
        # Check cloud database
        deleted_cloud = False
        try:
            del_res = db.table("focus_sessions").delete().eq("id", session_id).eq("user_id", current_user_id).execute()
            if del_res.data:
                deleted_cloud = True
        except Exception:
            pass
        if not deleted_cloud:
            raise HTTPException(status_code=404, detail="Focus session not found")

    _save_all_sessions(all_data)

    # Delete from Supabase cloud
    try:
        db.table("focus_sessions").delete().eq("id", session_id).eq("user_id", current_user_id).execute()
    except Exception:
        pass

    return {"message": "Focus record removed", "session_id": session_id}

@router.get("/task/{task_id}/duration")
async def get_task_focus_duration(task_id: str, current_user_id: str = Depends(get_current_user)):
    """Returns accumulated focus minutes and hours spent on a specific task."""
    durations = get_tasks_focus_durations(current_user_id)
    total_mins = durations.get(str(task_id), 0)
    total_hours = round(total_mins / 60.0, 1) if total_mins > 0 else 0.0
    return {
        "task_id": str(task_id),
        "total_focus_minutes": total_mins,
        "total_focus_hours": total_hours
    }
