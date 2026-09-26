from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID
from app.auth import get_current_user
from app.database import db
from app.models import BountyBase

router = APIRouter(prefix="/api/bounties", tags=["Bounties"])

IST = timezone(timedelta(hours=5, minutes=30))

class BountyCreate(BaseModel):
    target_task_id: UUID
    points_at_stake: int = Field(..., ge=10, le=10000)

class EligibleTask(BaseModel):
    id: UUID
    title: str
    user_id: UUID
    user_name: str
    estimated_hours: float
    created_at: datetime
    active_bounties_count: int = 0
    total_bounty_points: int = 0

@router.get("/eligible-tasks", response_model=List[EligibleTask])
async def get_eligible_tasks(current_user_id: str = Depends(get_current_user)):
    """Returns pending tasks created by PEERS that the current user can challenge with bounties."""
    # 1. Fetch pending tasks not owned by current user
    tasks_res = db.table("tasks") \
        .select("id, user_id, title, is_private, estimated_hours, created_at, status") \
        .in_("status", ["PENDING", "IN_PROGRESS"]) \
        .neq("user_id", current_user_id) \
        .order("created_at", desc=True) \
        .execute()
    tasks = tasks_res.data or []

    # 2. Map users
    users_res = db.table("users").select("id, display_name").execute()
    user_map = {str(u["id"]): u["display_name"] for u in (users_res.data or [])}

    # 3. Active bounties on these tasks
    bounties_res = db.table("bounties").select("target_task_id, points_at_stake").eq("status", "ACTIVE").execute()
    bounty_stats = {}
    for b in (bounties_res.data or []):
        tid = str(b.get("target_task_id"))
        stats = bounty_stats.setdefault(tid, {"count": 0, "points": 0})
        stats["count"] += 1
        stats["points"] += b.get("points_at_stake", 0)

    eligible = []
    for t in tasks:
        tid = str(t["id"])
        uid = str(t["user_id"])
        stats = bounty_stats.get(tid, {"count": 0, "points": 0})
        # Strict privacy redaction: peer tasks marked private must be masked
        title = "[ CLASSIFIED TASK ]" if t.get("is_private") else t["title"]

        eligible.append({
            "id": t["id"],
            "title": title,
            "user_id": t["user_id"],
            "user_name": user_map.get(uid, "Operative"),
            "estimated_hours": t["estimated_hours"],
            "created_at": t["created_at"],
            "active_bounties_count": stats["count"],
            "total_bounty_points": stats["points"]
        })

    return eligible

@router.get("", response_model=List[BountyBase])
async def get_bounties(current_user_id: str = Depends(get_current_user)):
    """Fetches all bounties enriched with task titles and operative names."""
    res = db.table("bounties").select("*").order("created_at", desc=True).execute()
    bounties = res.data or []

    # Map users
    users_res = db.table("users").select("id, display_name").execute()
    user_map = {str(u["id"]): u["display_name"] for u in (users_res.data or [])}

    # Map tasks
    tasks_res = db.table("tasks").select("id, user_id, title, is_private").execute()
    task_map = {str(t["id"]): t for t in (tasks_res.data or [])}

    enriched = []
    for b in bounties:
        tid = str(b.get("target_task_id"))
        issuer_id = str(b.get("issuer_id"))
        task = task_map.get(tid)

        issuer_name = user_map.get(issuer_id, "Operative")
        target_user_id = task["user_id"] if task else None
        target_user_name = user_map.get(str(target_user_id), "Operative") if target_user_id else "Operative"
        
        if task:
            # Strict Rule 3: Only the task owner can see their private task title
            if task.get("is_private") and str(task.get("user_id")) != current_user_id:
                task_title = "[ CLASSIFIED TASK ]"
            else:
                task_title = task["title"]
        else:
            task_title = "Unknown Task"

        enriched.append({
            **b,
            "issuer_name": issuer_name,
            "target_task_title": task_title,
            "target_user_id": target_user_id,
            "target_user_name": target_user_name
        })

    return enriched

@router.post("", response_model=BountyBase)
async def create_bounty(bounty_in: BountyCreate, current_user_id: str = Depends(get_current_user)):
    if bounty_in.points_at_stake < 10:
        raise HTTPException(status_code=400, detail="Minimum bounty is 10 points.")
        
    # Check if target task exists and is pending
    task_res = db.table("tasks").select("id, user_id, title, status, is_private").eq("id", str(bounty_in.target_task_id)).execute()
    if not task_res.data:
        raise HTTPException(status_code=404, detail="Target task not found.")
    
    target_task = task_res.data[0]
    if target_task["status"] not in ["PENDING", "IN_PROGRESS"]:
        raise HTTPException(status_code=400, detail="Can only place bounties on pending or active focus tasks.")
        
    if str(target_task["user_id"]) == str(current_user_id):
        raise HTTPException(status_code=400, detail="Cannot place a bounty on your own task.")

    # Check if issuer has enough points
    user_res = db.table("users").select("display_name, total_lifetime_points").eq("id", current_user_id).execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="User profile not found.")
        
    current_points = user_res.data[0].get("total_lifetime_points", 0)
    if current_points < bounty_in.points_at_stake:
        raise HTTPException(status_code=400, detail=f"Insufficient points ({current_points} available) to stake {bounty_in.points_at_stake} pts.")

    # Deduct points (Escrow)
    new_total = current_points - bounty_in.points_at_stake
    db.table("users").update({"total_lifetime_points": new_total}).eq("id", current_user_id).execute()

    # Create Bounty
    now_ist = datetime.now(IST).isoformat()
    new_bounty = {
        "issuer_id": current_user_id,
        "target_task_id": str(bounty_in.target_task_id),
        "points_at_stake": bounty_in.points_at_stake,
        "status": "ACTIVE",
        "created_at": now_ist
    }
    
    res = db.table("bounties").insert(new_bounty).execute()
    import uuid as _uuid
    created = res.data[0] if (res.data and len(res.data) > 0) else {**new_bounty, "id": str(_uuid.uuid4())}

    # Resolve target user name
    target_user_res = db.table("users").select("display_name").eq("id", str(target_task["user_id"])).execute()
    target_name = target_user_res.data[0].get("display_name", "Operative") if target_user_res.data else "Operative"

    # Strict Rule 3: Redact private task title for the issuer
    task_title = "[ CLASSIFIED TASK ]" if target_task.get("is_private") and str(target_task.get("user_id")) != current_user_id else target_task["title"]

    return {
        **created,
        "issuer_name": user_res.data[0].get("display_name", "Operative"),
        "target_task_title": task_title,
        "target_user_id": target_task["user_id"],
        "target_user_name": target_name
    }

@router.delete("/{bounty_id}")
async def retract_bounty(bounty_id: UUID, current_user_id: str = Depends(get_current_user)):
    """Allows an issuer to cancel an ACTIVE bounty and refund their staked escrow points."""
    # 1. Fetch bounty
    res = db.table("bounties").select("*").eq("id", str(bounty_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Bounty contract not found.")
    
    bounty = res.data[0]
    if str(bounty["issuer_id"]) != current_user_id:
        raise HTTPException(status_code=403, detail="You can only retract bounties you issued.")
        
    if bounty["status"] != "ACTIVE":
        raise HTTPException(status_code=400, detail="Cannot retract a resolved bounty contract.")

    # 2. Refund points to issuer
    user_res = db.table("users").select("total_lifetime_points").eq("id", current_user_id).execute()
    if user_res.data:
        curr_pts = user_res.data[0].get("total_lifetime_points", 0)
        refund_pts = bounty["points_at_stake"]
        db.table("users").update({"total_lifetime_points": curr_pts + refund_pts}).eq("id", current_user_id).execute()

    # 3. Delete the bounty row
    db.table("bounties").delete().eq("id", str(bounty_id)).execute()

    return {
        "message": f"Bounty retracted. {bounty['points_at_stake']} points refunded to your vault.",
        "id": str(bounty_id)
    }
