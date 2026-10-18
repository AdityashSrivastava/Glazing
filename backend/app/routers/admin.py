import os
import json
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.auth import get_current_user, verify_overseer_access
from app.database import db
from app.models import (
    OperativePresenceItem,
    PresenceHeartbeatRequest,
    VerdictBase,
    VerdictRevokeGymRequest,
    VerdictRejectTaskRequest,
    VerdictRewriteTaskRequest,
    VerdictRevertPendingRequest,
    TaskBase,
)
from app.routers.tasks import parse_to_ist, analyze_proof_of_work, get_cached_user_map, get_domain_hourly_rate
from app.routers.timer import get_all_tasks_focus_durations

router = APIRouter(tags=["Covert Overseer"])

IST = timezone(timedelta(hours=5, minutes=30))

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
PRESENCE_FILE = os.path.join(DATA_DIR, "presence.json")
VERDICTS_FILE = os.path.join(DATA_DIR, "verdicts.json")

os.makedirs(DATA_DIR, exist_ok=True)

# -------------------------------------------------------------
# Local JSON Fallback Helpers (for zero-failure durability)
# -------------------------------------------------------------
_in_memory_presence: Dict[str, Dict[str, Any]] = {}
_in_memory_verdicts: List[Dict[str, Any]] = []

def _load_local_data():
    global _in_memory_presence, _in_memory_verdicts
    if os.path.exists(PRESENCE_FILE):
        try:
            with open(PRESENCE_FILE, "r", encoding="utf-8") as f:
                _in_memory_presence = json.load(f)
        except Exception:
            _in_memory_presence = {}
    if os.path.exists(VERDICTS_FILE):
        try:
            with open(VERDICTS_FILE, "r", encoding="utf-8") as f:
                _in_memory_verdicts = json.load(f)
        except Exception:
            _in_memory_verdicts = []

_load_local_data()

def _save_local_presence():
    try:
        with open(PRESENCE_FILE, "w", encoding="utf-8") as f:
            json.dump(_in_memory_presence, f, indent=2, default=str)
    except Exception as e:
        print(f"Failed to save local presence: {e}")

def _save_local_verdicts():
    try:
        with open(VERDICTS_FILE, "w", encoding="utf-8") as f:
            json.dump(_in_memory_verdicts, f, indent=2, default=str)
    except Exception as e:
        print(f"Failed to save local verdicts: {e}")


def _relative_time_str(dt: Optional[datetime], now: datetime) -> str:
    if not dt:
        return "Never"
    diff_sec = max(0, int((now - dt).total_seconds()))
    if diff_sec < 45:
        return "Online now"
    if diff_sec < 120:
        return "1 min ago"
    if diff_sec < 3600:
        return f"{diff_sec // 60} mins ago"
    if diff_sec < 86400:
        return f"{diff_sec // 3600} hours ago"
    return f"{diff_sec // 86400} days ago"


def overseer_deduct_points(user_id: str, amount: int) -> int:
    """Safely deducts points from a user's vault without failing if amount > current points."""
    if amount <= 0:
        return 0
    try:
        user_res = db.table("users").select("total_lifetime_points").eq("id", str(user_id)).execute()
        if user_res.data:
            current = int(user_res.data[0].get("total_lifetime_points") or 0)
            deducted = min(current, amount)
            new_total = max(0, current - amount)
            db.table("users").update({"total_lifetime_points": new_total}).eq("id", str(user_id)).execute()
            return deducted
    except Exception as e:
        print(f"overseer_deduct_points error: {e}")
    return amount


def sync_daily_snapshot_deduction(user_id: str, amount: int):
    """Subtracts deducted points from today's daily snapshot."""
    if amount <= 0:
        return
    now_ist = datetime.now(IST)
    today_str = now_ist.date().isoformat()
    try:
        snap_res = db.table("daily_snapshots").select("points_earned_that_day").eq("user_id", str(user_id)).eq("snapshot_date", today_str).execute()
        if snap_res.data:
            cur = int(snap_res.data[0].get("points_earned_that_day") or 0)
            new_pts = max(0, cur - amount)
            db.table("daily_snapshots").update({"points_earned_that_day": new_pts}).eq("user_id", str(user_id)).eq("snapshot_date", today_str).execute()
    except Exception as e:
        print(f"sync_daily_snapshot_deduction error: {e}")


def save_verdict(verdict_data: Dict[str, Any]):
    """Attempts Supabase write; always mirrors to local JSON store."""
    global _in_memory_verdicts
    _in_memory_verdicts.insert(0, verdict_data)
    if len(_in_memory_verdicts) > 100:
        _in_memory_verdicts = _in_memory_verdicts[:100]
    _save_local_verdicts()

    try:
        db_record = {
            "id": verdict_data.get("id"),
            "target_user_id": verdict_data.get("target_user_id"),
            "task_id": verdict_data.get("task_id"),
            "action_type": verdict_data.get("action_type"),
            "reason": verdict_data.get("reason"),
            "points_deducted": verdict_data.get("points_deducted", 0),
            "old_values": verdict_data.get("old_values"),
            "new_values": verdict_data.get("new_values"),
            "acknowledged": verdict_data.get("acknowledged", False),
        }
        db.table("verdicts").insert(db_record).execute()
    except Exception as e:
        print(f"save_verdict supabase insert warning: {e}")


# -------------------------------------------------------------
# 1. Presence Heartbeat Route (Used by ALL authenticated operatives)
# -------------------------------------------------------------
@router.post("/api/presence/heartbeat")
async def report_heartbeat(
    payload: PresenceHeartbeatRequest,
    current_user_id: str = Depends(get_current_user)
):
    now_ist = datetime.now(IST)
    iso_now = now_ist.isoformat()

    # Update in memory / local store
    entry = _in_memory_presence.get(current_user_id, {})
    entry.update({
        "user_id": current_user_id,
        "is_online": True,
        "current_route": payload.current_route,
        "last_heartbeat": iso_now,
        "updated_at": iso_now
    })
    _in_memory_presence[current_user_id] = entry
    _save_local_presence()

    # Attempt Supabase write if table exists
    try:
        db.table("operative_presence").upsert({
            "user_id": current_user_id,
            "is_online": True,
            "current_route": payload.current_route,
            "last_heartbeat": iso_now,
            "updated_at": iso_now
        }, on_conflict="user_id").execute()
    except Exception:
        pass

    return {"status": "ok", "timestamp": iso_now}


# -------------------------------------------------------------
# 2. Covert Overseer Routes (Protected by verify_overseer_access)
# -------------------------------------------------------------
@router.get("/api/admin/presence", response_model=List[OperativePresenceItem])
async def get_squad_presence(
    _admin_id: str = Depends(verify_overseer_access)
):
    """
    Returns live presence, online state, current active route, and active timer
    for all 5 operatives. Accessible exclusively by Adityash.
    """
    now_ist = datetime.now(IST)
    user_map = get_cached_user_map()

    # Check active focus tasks
    active_tasks_res = db.table("tasks").select("id, user_id, title").eq("status", "IN_PROGRESS").execute()
    active_task_by_user = {}
    for t in (active_tasks_res.data or []):
        active_task_by_user[str(t["user_id"])] = t.get("title", "Focus Session")

    # Check active timer ids
    active_timers = set()

    # Try querying operative_presence table
    db_presence = {}
    try:
        res = db.table("operative_presence").select("*").execute()
        for p in (res.data or []):
            db_presence[str(p["user_id"])] = p
    except Exception:
        pass

    items: List[OperativePresenceItem] = []

    # Iterate over known operatives
    for uid, name in user_map.items():
        # Prefer DB presence, fallback to memory
        data = db_presence.get(uid) or _in_memory_presence.get(uid) or {}
        last_hb_str = data.get("last_heartbeat")
        last_hb_dt = parse_to_ist(last_hb_str)

        is_online = False
        if last_hb_dt:
            diff_sec = (now_ist - last_hb_dt).total_seconds()
            if diff_sec <= 65:  # Consider online if pinged in last ~60s
                is_online = True

        status_label = "OFFLINE"
        if is_online:
            if uid in active_timers or uid in active_task_by_user:
                status_label = "IN FOCUS"
            else:
                status_label = "ACTIVE"
        elif last_hb_dt and (now_ist - last_hb_dt).total_seconds() < 900:
            status_label = "IDLE"

        timer_mode = None
        if uid in active_timers:
            timer_mode = "Pomodoro Running"
        elif uid in active_task_by_user:
            timer_mode = "Deep Work"

        items.append(OperativePresenceItem(
            user_id=uid,
            display_name=name,
            email=f"{name.lower()}@glazing.com",
            is_online=is_online,
            current_route=data.get("current_route", "dashboard"),
            last_heartbeat=last_hb_dt,
            last_seen_relative=_relative_time_str(last_hb_dt, now_ist),
            active_task_title=active_task_by_user.get(uid),
            active_timer_mode=timer_mode,
            status_label=status_label
        ))

    # Sort: Online first, then by name
    items.sort(key=lambda x: (not x.is_online, x.display_name))
    return items


@router.get("/api/admin/tasks", response_model=List[TaskBase])
async def get_unmasked_tasks(
    _admin_id: str = Depends(verify_overseer_access)
):
    """
    Returns ALL tasks completely UNMASKED for the Overseer ("One Above All").
    Classified tasks reveal their true title, linked goals, and proof screenshots.
    """
    res = db.table("tasks").select("*").order("created_at", desc=True).limit(150).execute()
    tasks = res.data or []

    user_map = get_cached_user_map()

    # Map goals
    goals_res = db.table("goals").select("id, title, category").execute()
    goal_map = {str(g["id"]): g for g in (goals_res.data or [])}

    focus_durations = get_all_tasks_focus_durations()

    unmasked_list: List[TaskBase] = []
    for t in tasks:
        uid = str(t.get("user_id"))
        gid = str(t.get("goal_id")) if t.get("goal_id") else None
        t["user_name"] = user_map.get(uid, "Operative")

        if gid and gid in goal_map:
            t["goal_title"] = goal_map[gid].get("title")
            t["category"] = goal_map[gid].get("category")
        else:
            t["goal_title"] = None
            t["category"] = None

        is_completed = t.get("status") == "COMPLETED"
        if is_completed and t.get("proof_url"):
            verified, feedback = analyze_proof_of_work(
                t.get("title", ""),
                t.get("category"),
                t.get("proof_url")
            )
            t["is_proof_verified"] = verified
            t["proof_feedback"] = feedback
        else:
            t["is_proof_verified"] = False
            t["proof_feedback"] = None

        tid = str(t.get("id"))
        t["tracked_timer_minutes"] = focus_durations.get(tid, 0)
        t["tracked_timer_hours"] = round(focus_durations.get(tid, 0) / 60.0, 1)

        # Do NOT mask! Output raw unmasked TaskBase
        unmasked_list.append(TaskBase(**t))

    return unmasked_list


@router.post("/api/admin/verdict/revoke-gym", response_model=VerdictBase)
async def revoke_gym_verdict(
    payload: VerdictRevokeGymRequest,
    _admin_id: str = Depends(verify_overseer_access)
):
    """
    Revokes an operative's daily gym checkpoint.
    Deducts 5 points atomically, wipes today's checkin task, and logs the verdict.
    """
    now_ist = datetime.now(IST)
    today_str = now_ist.date().isoformat()
    target_uid = str(payload.target_user_id)
    user_map = get_cached_user_map()
    target_name = user_map.get(target_uid, "Operative")

    # Find today's gym task for this operative
    tasks_res = db.table("tasks") \
        .select("id, title, points_earned, completed_at, status") \
        .eq("user_id", target_uid) \
        .eq("status", "COMPLETED") \
        .execute()

    gym_task = None
    for t in (tasks_res.data or []):
        title = (t.get("title") or "").lower()
        if "gym" in title:
            c_ist = parse_to_ist(t.get("completed_at"))
            if c_ist and c_ist.date().isoformat() == today_str:
                gym_task = t
                break

    pts_deducted = 5
    task_id_str = None
    if gym_task:
        task_id_str = str(gym_task["id"])
        pts_deducted = int(gym_task.get("points_earned") or 5)
        # Expire false gym check-in task and wipe points (preserves foreign key for verdicts)
        try:
            db.table("tasks").update({
                "status": "EXPIRED",
                "points_earned": 0,
                "title": f"❌ REVOKED: {gym_task.get('title')}"
            }).eq("id", task_id_str).execute()
        except Exception as e:
            print(f"gym task update warning: {e}")

    # Deduct points atomically
    overseer_deduct_points(target_uid, pts_deducted)
    sync_daily_snapshot_deduction(target_uid, pts_deducted)

    verdict_id = str(uuid.uuid4())
    verdict = {
        "id": verdict_id,
        "target_user_id": target_uid,
        "target_user_name": target_name,
        "task_id": task_id_str,
        "task_title": "Daily Gym Checkpoint",
        "action_type": "REVOKE_GYM",
        "reason": payload.reason.strip(),
        "points_deducted": pts_deducted,
        "old_values": {"status": "COMPLETED", "points": pts_deducted},
        "new_values": {"status": "EXPIRED", "points": 0},
        "acknowledged": False,
        "created_at": now_ist.isoformat()
    }
    save_verdict(verdict)

    return VerdictBase(**verdict)


@router.post("/api/admin/verdict/reject-task", response_model=VerdictBase)
async def reject_task_verdict(
    payload: VerdictRejectTaskRequest,
    _admin_id: str = Depends(verify_overseer_access)
):
    """
    Invalidates a fraudulent or unverified task, wiping all awarded points.
    """
    now_ist = datetime.now(IST)
    task_res = db.table("tasks").select("*").eq("id", payload.task_id).execute()
    if not task_res.data:
        raise HTTPException(status_code=404, detail="Target task not found")

    task = task_res.data[0]
    target_uid = str(task["user_id"])
    user_map = get_cached_user_map()
    target_name = user_map.get(target_uid, "Operative")
    points_to_deduct = int(task.get("points_earned") or 0)

    # Invalidate task (use EXPIRED to respect PostgreSQL tasks_status_check constraint)
    db.table("tasks").update({
        "status": "EXPIRED",
        "points_earned": 0,
        "title": f"❌ VOIDED: {task.get('title')}"
    }).eq("id", payload.task_id).execute()

    if points_to_deduct > 0:
        overseer_deduct_points(target_uid, points_to_deduct)
        sync_daily_snapshot_deduction(target_uid, points_to_deduct)

    verdict_id = str(uuid.uuid4())
    verdict = {
        "id": verdict_id,
        "target_user_id": target_uid,
        "target_user_name": target_name,
        "task_id": payload.task_id,
        "task_title": task.get("title"),
        "action_type": "REJECT_TASK",
        "reason": payload.reason.strip(),
        "points_deducted": points_to_deduct,
        "old_values": {"status": task.get("status"), "points": points_to_deduct},
        "new_values": {"status": "EXPIRED", "points": 0},
        "acknowledged": False,
        "created_at": now_ist.isoformat()
    }
    save_verdict(verdict)

    return VerdictBase(**verdict)


@router.post("/api/admin/verdict/rewrite-task", response_model=VerdictBase)
async def rewrite_task_verdict(
    payload: VerdictRewriteTaskRequest,
    _admin_id: str = Depends(verify_overseer_access)
):
    """
    Rewrites a task title and actual hours, recalculating and docking points appropriately.
    """
    now_ist = datetime.now(IST)
    task_res = db.table("tasks").select("*").eq("id", payload.task_id).execute()
    if not task_res.data:
        raise HTTPException(status_code=404, detail="Target task not found")

    task = task_res.data[0]
    target_uid = str(task["user_id"])
    user_map = get_cached_user_map()
    target_name = user_map.get(target_uid, "Operative")

    old_points = int(task.get("points_earned") or 0)
    old_title = task.get("title", "")
    old_hours = float(task.get("actual_hours") or 0)

    # Calculate new points with new hours
    new_hours = round(float(payload.new_actual_hours), 2)
    category = None
    if task.get("goal_id"):
        g_res = db.table("goals").select("category").eq("id", task["goal_id"]).execute()
        if g_res.data:
            category = g_res.data[0].get("category")
    
    rate = get_domain_hourly_rate(category)
    new_points = int(round(new_hours * rate))
    if task.get("status") == "COMPLETED":
        new_points += 5 # completion bonus

    point_delta = max(0, old_points - new_points)
    if point_delta > 0:
        overseer_deduct_points(target_uid, point_delta)
        sync_daily_snapshot_deduction(target_uid, point_delta)

    new_title = payload.new_title.strip()
    db.table("tasks").update({
        "title": new_title,
        "actual_hours": new_hours,
        "points_earned": new_points
    }).eq("id", payload.task_id).execute()

    verdict_id = str(uuid.uuid4())
    verdict = {
        "id": verdict_id,
        "target_user_id": target_uid,
        "target_user_name": target_name,
        "task_id": payload.task_id,
        "task_title": new_title,
        "action_type": "REWRITE_TASK",
        "reason": payload.reason.strip(),
        "points_deducted": point_delta,
        "old_values": {"title": old_title, "hours": old_hours, "points": old_points},
        "new_values": {"title": new_title, "hours": new_hours, "points": new_points},
        "acknowledged": False,
        "created_at": now_ist.isoformat()
    }
    save_verdict(verdict)

    return VerdictBase(**verdict)


@router.post("/api/admin/verdict/revert-pending", response_model=VerdictBase)
async def revert_pending_verdict(
    payload: VerdictRevertPendingRequest,
    _admin_id: str = Depends(verify_overseer_access)
):
    """
    Reverts a completed task back to PENDING status, stripping points and clearing proof.
    """
    now_ist = datetime.now(IST)
    task_res = db.table("tasks").select("*").eq("id", payload.task_id).execute()
    if not task_res.data:
        raise HTTPException(status_code=404, detail="Target task not found")

    task = task_res.data[0]
    target_uid = str(task["user_id"])
    user_map = get_cached_user_map()
    target_name = user_map.get(target_uid, "Operative")
    points_to_deduct = int(task.get("points_earned") or 0)

    db.table("tasks").update({
        "status": "PENDING",
        "points_earned": 0,
        "completed_at": None,
        "proof_url": None
    }).eq("id", payload.task_id).execute()

    if points_to_deduct > 0:
        overseer_deduct_points(target_uid, points_to_deduct)
        sync_daily_snapshot_deduction(target_uid, points_to_deduct)

    verdict_id = str(uuid.uuid4())
    verdict = {
        "id": verdict_id,
        "target_user_id": target_uid,
        "target_user_name": target_name,
        "task_id": payload.task_id,
        "task_title": task.get("title"),
        "action_type": "REVERT_PENDING",
        "reason": payload.reason.strip(),
        "points_deducted": points_to_deduct,
        "old_values": {"status": "COMPLETED", "points": points_to_deduct},
        "new_values": {"status": "PENDING", "points": 0},
        "acknowledged": False,
        "created_at": now_ist.isoformat()
    }
    save_verdict(verdict)

    return VerdictBase(**verdict)


@router.get("/api/admin/verdicts", response_model=List[VerdictBase])
async def get_all_verdicts_admin(
    _admin_id: str = Depends(verify_overseer_access)
):
    """Fetches all judgments ever recorded."""
    # Check DB first
    try:
        res = db.table("verdicts").select("*").order("created_at", desc=True).limit(50).execute()
        if res.data:
            return [VerdictBase(**v) for v in res.data]
    except Exception:
        pass
    return [VerdictBase(**v) for v in _in_memory_verdicts]


# -------------------------------------------------------------
# 3. Operative-Facing Verdict Routes (Public / Non-Admin)
# -------------------------------------------------------------
@router.get("/api/verdicts/pending", response_model=List[VerdictBase])
async def get_my_pending_verdicts(
    current_user_id: str = Depends(get_current_user)
):
    """
    Returns unacknowledged verdicts for the currently logged in operative
    so the UI can pop up the MISTERBOMBASTIC VERDICT modal.
    """
    try:
        res = db.table("verdicts").select("*") \
            .eq("target_user_id", current_user_id) \
            .eq("acknowledged", False) \
            .order("created_at", desc=True) \
            .execute()
        if res.data:
            return [VerdictBase(**v) for v in res.data]
    except Exception:
        pass

    # Fallback to local memory
    matching = [
        v for v in _in_memory_verdicts
        if str(v.get("target_user_id")) == current_user_id and not v.get("acknowledged")
    ]
    return [VerdictBase(**v) for v in matching]


@router.post("/api/verdicts/{verdict_id}/acknowledge")
async def acknowledge_verdict(
    verdict_id: str,
    current_user_id: str = Depends(get_current_user)
):
    """
    Target operative acknowledges the verdict, dismissing the modal.
    """
    # Update local memory
    for v in _in_memory_verdicts:
        if str(v.get("id")) == verdict_id:
            v["acknowledged"] = True
    _save_local_verdicts()

    try:
        db.table("verdicts").update({"acknowledged": True}).eq("id", verdict_id).eq("target_user_id", current_user_id).execute()
    except Exception:
        pass

    return {"status": "acknowledged", "id": verdict_id}


@router.get("/api/verdicts/feed", response_model=List[VerdictBase])
async def get_verdicts_feed(
    _current_user_id: str = Depends(get_current_user)
):
    """
    Returns recent unacknowledged verdicts for the public activity feed.
    Once acknowledged by the penalized operative, the notification is removed from the feed.
    """
    try:
        res = db.table("verdicts").select("*").eq("acknowledged", False).order("created_at", desc=True).limit(20).execute()
        if res.data:
            return [VerdictBase(**v) for v in res.data]
    except Exception:
        pass
    unack = [v for v in _in_memory_verdicts if not v.get("acknowledged")]
    return [VerdictBase(**v) for v in unack[:20]]
