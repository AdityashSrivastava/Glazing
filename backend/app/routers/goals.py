from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID
from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/api/goals", tags=["Goals"])

IST = timezone(timedelta(hours=5, minutes=30))

class GoalBase(BaseModel):
    id: str
    user_id: str
    title: str
    category: str
    status: str = 'ACTIVE'
    is_private: bool = False
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    tasks_count: int = 0
    completed_tasks_count: int = 0
    points_earned: int = 0
    hours_logged: float = 0.0

from pydantic import BaseModel, Field

class GoalCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    category: str
    is_private: bool = False

class GoalUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    is_private: Optional[bool] = None

class GoalTaskItem(BaseModel):
    id: UUID
    title: str
    status: str
    estimated_hours: float
    actual_hours: Optional[float] = None
    points_earned: int = 0
    created_at: datetime
    completed_at: Optional[datetime] = None

def unpack_goal_title(raw_title: str) -> tuple[str, bool]:
    """Extracts user title and privacy flag from stored database title."""
    if raw_title.startswith("[PRIVATE] "):
        return raw_title[10:], True
    return raw_title, False

def pack_goal_title(title: str, is_private: bool) -> str:
    """Encodes privacy flag safely into the database title field without schema breaking."""
    clean = title[10:] if title.startswith("[PRIVATE] ") else title
    if is_private:
        return f"[PRIVATE] {clean}"
    return clean

@router.get("", response_model=List[GoalBase])
async def get_goals(current_user_id: str = Depends(get_current_user)):
    """Fetches user goals enriched with live progress metrics, points accumulated, and privacy status."""
    goals_res = db.table("goals").select("*").eq("user_id", current_user_id).order("created_at", desc=True).execute()
    goals = goals_res.data or []

    # Fetch user's tasks linked to any goal
    tasks_res = db.table("tasks") \
        .select("id, goal_id, status, points_earned, actual_hours") \
        .eq("user_id", current_user_id) \
        .not_.is_("goal_id", "null") \
        .execute()
    tasks = tasks_res.data or []

    # Aggregate stats per goal
    stats_map = {}
    for t in tasks:
        gid = str(t.get("goal_id"))
        s = stats_map.setdefault(gid, {
            "tasks_count": 0,
            "completed_tasks_count": 0,
            "points_earned": 0,
            "hours_logged": 0.0
        })
        s["tasks_count"] += 1
        if t.get("status") == "COMPLETED":
            s["completed_tasks_count"] += 1
            s["points_earned"] += t.get("points_earned", 0) or 0
            s["hours_logged"] += float(t.get("actual_hours", 0) or 0)

    enriched = []
    for g in goals:
        gid = str(g["id"])
        s = stats_map.get(gid, {
            "tasks_count": 0,
            "completed_tasks_count": 0,
            "points_earned": 0,
            "hours_logged": 0.0
        })
        clean_title, is_priv = unpack_goal_title(g.get("title", ""))
        enriched.append({
            **g,
            "title": clean_title,
            "is_private": is_priv,
            "tasks_count": s["tasks_count"],
            "completed_tasks_count": s["completed_tasks_count"],
            "points_earned": s["points_earned"],
            "hours_logged": round(s["hours_logged"], 2)
        })

    return enriched

@router.get("/{goal_id}/tasks", response_model=List[GoalTaskItem])
async def get_goal_tasks(goal_id: UUID, current_user_id: str = Depends(get_current_user)):
    """Fetches tasks linked to a specific objective."""
    goal_res = db.table("goals").select("id").eq("id", str(goal_id)).eq("user_id", current_user_id).execute()
    if not goal_res.data:
        raise HTTPException(status_code=404, detail="Goal not found or not yours")

    tasks_res = db.table("tasks") \
        .select("id, title, status, estimated_hours, actual_hours, points_earned, created_at, completed_at") \
        .eq("goal_id", str(goal_id)) \
        .eq("user_id", current_user_id) \
        .order("created_at", desc=True) \
        .execute()
    return tasks_res.data or []

VALID_CATEGORIES = ['Development', 'DSA', 'College Work']
LEGACY_CATEGORIES = {
    'Coding': 'Development',
    'Career': 'Development',
    'Learning': 'College Work',
    'College Studies': 'College Work',
}

def normalize_category(cat: str) -> str:
    if not cat:
        return 'Development'
    cat = cat.strip()
    if cat in VALID_CATEGORIES:
        return cat
    if cat in LEGACY_CATEGORIES:
        return LEGACY_CATEGORIES[cat]
    for vc in VALID_CATEGORIES:
        if vc.lower() == cat.lower():
            return vc
    if cat.lower() in ['college studies', 'studies', 'academics']:
        return 'College Work'
    if cat.lower() in ['dev', 'coding', 'systems']:
        return 'Development'
    if cat.lower() in ['algo', 'dsa']:
        return 'DSA'
    return 'Development'

@router.post("", response_model=GoalBase)
async def create_goal(goal_in: GoalCreate, current_user_id: str = Depends(get_current_user)):
    category = normalize_category(goal_in.category)
    if category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"Category must be one of {VALID_CATEGORIES}")

    now_ist = datetime.now(IST).isoformat()
    packed_title = pack_goal_title(goal_in.title.strip(), goal_in.is_private)
    new_goal = {
        "user_id": current_user_id,
        "title": packed_title,
        "category": category,
        "status": "ACTIVE",
        "created_at": now_ist,
        "updated_at": now_ist
    }
    res = db.table("goals").insert(new_goal).execute()
    import uuid as _uuid
    created = res.data[0] if (res.data and len(res.data) > 0) else {**new_goal, "id": str(_uuid.uuid4())}
    clean_title, is_priv = unpack_goal_title(created["title"])
    return {
        **created,
        "title": clean_title,
        "is_private": is_priv,
        "tasks_count": 0,
        "completed_tasks_count": 0,
        "points_earned": 0,
        "hours_logged": 0.0
    }

@router.patch("/{goal_id}", response_model=GoalBase)
async def update_goal(goal_id: UUID, payload: GoalUpdate, current_user_id: str = Depends(get_current_user)):
    """Updates goal status (ACTIVE / COMPLETED), title, category, or privacy."""
    goal_res = db.table("goals").select("*").eq("id", str(goal_id)).eq("user_id", current_user_id).execute()
    if not goal_res.data:
        raise HTTPException(status_code=404, detail="Goal not found or not yours")

    current_record = goal_res.data[0]
    current_clean_title, current_is_priv = unpack_goal_title(current_record.get("title", ""))

    updates = {}
    
    # Title / Privacy packing
    new_title = payload.title.strip() if payload.title is not None and payload.title.strip() else current_clean_title
    new_is_priv = payload.is_private if payload.is_private is not None else current_is_priv

    if payload.title is not None or payload.is_private is not None:
        updates["title"] = pack_goal_title(new_title, new_is_priv)

    if payload.category is not None:
        cat = normalize_category(payload.category)
        if cat not in VALID_CATEGORIES:
            raise HTTPException(status_code=400, detail=f"Category must be one of {VALID_CATEGORIES}")
        updates["category"] = cat

    if payload.status is not None:
        valid_statuses = ['ACTIVE', 'COMPLETED', 'ARCHIVED']
        if payload.status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Status must be one of {valid_statuses}")
        updates["status"] = payload.status

    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    now_ist = datetime.now(IST).isoformat()
    updates["updated_at"] = now_ist

    update_res = db.table("goals").update(updates).eq("id", str(goal_id)).execute()
    updated = update_res.data[0] if (update_res.data and len(update_res.data) > 0) else {**current_record, **updates}

    # Re-aggregate stats
    tasks_res = db.table("tasks") \
        .select("id, status, points_earned, actual_hours") \
        .eq("goal_id", str(goal_id)) \
        .execute()
    tasks = tasks_res.data or []

    completed_count = sum(1 for t in tasks if t.get("status") == "COMPLETED")
    points = sum(t.get("points_earned", 0) or 0 for t in tasks if t.get("status") == "COMPLETED")
    hours = sum(float(t.get("actual_hours", 0) or 0) for t in tasks if t.get("status") == "COMPLETED")

    clean_title, is_priv = unpack_goal_title(updated["title"])
    return {
        **updated,
        "title": clean_title,
        "is_private": is_priv,
        "tasks_count": len(tasks),
        "completed_tasks_count": completed_count,
        "points_earned": points,
        "hours_logged": round(hours, 2)
    }

@router.delete("/{goal_id}")
async def delete_goal(goal_id: UUID, current_user_id: str = Depends(get_current_user)):
    # 1. Verify goal exists and belongs to current user
    res = db.table("goals").select("id").eq("id", str(goal_id)).eq("user_id", current_user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Goal not found or not yours")
    
    # 2. Unlink any tasks linked to this goal
    try:
        db.table("tasks").update({"goal_id": None}).eq("goal_id", str(goal_id)).execute()
    except Exception as e:
        print("Note unlinking tasks:", e)
        
    # 3. Delete the goal
    db.table("goals").delete().eq("id", str(goal_id)).eq("user_id", current_user_id).execute()
    return {"message": "Goal deleted successfully", "id": str(goal_id)}
