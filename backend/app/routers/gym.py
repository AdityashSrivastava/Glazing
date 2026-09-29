from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/api/gym", tags=["Gym"])

IST = timezone(timedelta(hours=5, minutes=30))

def parse_to_ist(dt_str: Optional[str]) -> Optional[datetime]:
    if not dt_str:
        return None
    try:
        cleaned = str(dt_str).replace("Z", "+00:00")
        dt = datetime.fromisoformat(cleaned)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(IST)
    except Exception:
        return None

class GymStatusResponse(BaseModel):
    checked_today: bool
    checked_at: Optional[str] = None
    streak_days: int = 0
    points_awarded: int = 5

def is_gym_checkpoint(task_title: Optional[str]) -> bool:
    if not task_title:
        return False
    t = task_title.lower()
    return "[checkpoint] daily gym" in t or "daily gym checkpoint" in t or "[gym] daily check-in" in t or t == "gym checkpoint"

def calculate_gym_streak(checkin_dates: set[str], today_date_str: str) -> int:
    """Calculates consecutive days count ending today or yesterday."""
    today = datetime.fromisoformat(today_date_str).date()
    # Check streak starting from today if checked, or yesterday
    start_date = today if today_date_str in checkin_dates else today - timedelta(days=1)
    
    streak = 0
    curr = start_date
    while curr.isoformat() in checkin_dates:
        streak += 1
        curr -= timedelta(days=1)
    return streak

@router.get("/status", response_model=GymStatusResponse)
async def get_gym_status(current_user_id: str = Depends(get_current_user)):
    now_ist = datetime.now(IST)
    today_str = now_ist.date().isoformat()

    tasks_res = db.table("tasks") \
        .select("title, status, completed_at, points_earned") \
        .eq("user_id", current_user_id) \
        .eq("status", "COMPLETED") \
        .execute()
    tasks = tasks_res.data or []

    checkin_dates = set()
    checked_today = False
    checked_at_str = None

    for t in tasks:
        if is_gym_checkpoint(t.get("title")):
            c_ist = parse_to_ist(t.get("completed_at"))
            if c_ist:
                d_str = c_ist.date().isoformat()
                checkin_dates.add(d_str)
                if d_str == today_str:
                    checked_today = True
                    checked_at_str = c_ist.isoformat()

    streak = calculate_gym_streak(checkin_dates, today_str)

    return GymStatusResponse(
        checked_today=checked_today,
        checked_at=checked_at_str,
        streak_days=streak,
        points_awarded=5
    )

@router.post("/checkin", response_model=GymStatusResponse)
async def checkin_gym(current_user_id: str = Depends(get_current_user)):
    now_ist = datetime.now(IST)
    today_str = now_ist.date().isoformat()

    # 1. Check if already checked in today
    tasks_res = db.table("tasks") \
        .select("id, title, completed_at") \
        .eq("user_id", current_user_id) \
        .eq("status", "COMPLETED") \
        .execute()
    existing_tasks = tasks_res.data or []

    checkin_dates = set()
    for t in existing_tasks:
        if is_gym_checkpoint(t.get("title")):
            c_ist = parse_to_ist(t.get("completed_at"))
            if c_ist:
                d_str = c_ist.date().isoformat()
                checkin_dates.add(d_str)
                if d_str == today_str:
                    # Already checked in today
                    streak = calculate_gym_streak(checkin_dates, today_str)
                    return GymStatusResponse(
                        checked_today=True,
                        checked_at=c_ist.isoformat(),
                        streak_days=streak,
                        points_awarded=5
                    )

    # 2. Record daily gym checkpoint task (+5 points)
    now_iso = now_ist.isoformat()
    new_task = {
        "user_id": current_user_id,
        "title": "🏋️ Daily Gym Checkpoint",
        "is_private": False,
        "estimated_hours": 1.0,
        "actual_hours": 1.0,
        "goal_id": None, # Standalone daily habit checkpoint, not tied to any domain
        "status": "COMPLETED",
        "points_earned": 5,
        "completed_at": now_iso,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    db.table("tasks").insert(new_task).execute()

    # 3. Update user total lifetime points
    user_res = db.table("users").select("total_lifetime_points").eq("id", current_user_id).execute()
    if user_res.data:
        curr_pts = int(user_res.data[0].get("total_lifetime_points") or 0)
        db.table("users").update({"total_lifetime_points": curr_pts + 5}).eq("id", current_user_id).execute()

    # 4. Sync daily snapshot for leaderboard
    try:
        snap_tasks_res = db.table("tasks") \
            .select("points_earned, completed_at") \
            .eq("user_id", current_user_id) \
            .eq("status", "COMPLETED") \
            .execute()
        today_user_pts = 0
        today_user_count = 0
        for st in (snap_tasks_res.data or []):
            c_ist = parse_to_ist(st.get("completed_at"))
            if c_ist and c_ist.date().isoformat() == today_str:
                today_user_pts += int(st.get("points_earned") or 0)
                today_user_count += 1

        snap_payload = {
            "user_id": current_user_id,
            "snapshot_date": today_str,
            "points_earned_that_day": today_user_pts,
            "tasks_completed_count": today_user_count
        }
        db.table("daily_snapshots").upsert(snap_payload, on_conflict="user_id,snapshot_date").execute()
    except Exception as e:
        print("Gym checkin snapshot sync error:", e)

    checkin_dates.add(today_str)
    streak = calculate_gym_streak(checkin_dates, today_str)

    return GymStatusResponse(
        checked_today=True,
        checked_at=now_iso,
        streak_days=streak,
        points_awarded=5
    )
