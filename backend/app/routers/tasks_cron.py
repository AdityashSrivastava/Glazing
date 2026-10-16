from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from app.auth import verify_cron_secret
from app.database import db
from app.points import atomic_add_points, atomic_deduct_points

router = APIRouter(prefix="/api/tasks/cron", tags=["Cron"])

IST = timezone(timedelta(hours=5, minutes=30))

@router.post("/resolve-abandoned")
async def resolve_abandoned_tasks(caller: str = Depends(verify_cron_secret)):
    # 1. Calculate the cutoff date (exactly 7 days ago)
    cutoff_date = (datetime.now(IST) - timedelta(days=7)).isoformat()
    
    # 2. Fetch all pending or in-progress tasks created before the cutoff date
    res = db.table("tasks") \
        .select("*") \
        .in_("status", ["PENDING", "IN_PROGRESS"]) \
        .lt("created_at", cutoff_date) \
        .execute()
        
    abandoned_tasks = res.data
    resolved_count = 0
    
    for task in abandoned_tasks:
        task_id = task["id"]
        creator_id = task["user_id"]
        
        # 3. Mark the task as ABANDONED
        db.table("tasks").update({"status": "ABANDONED"}).eq("id", task_id).execute()
        
        # 4. Check for bounties placed on this task
        bounties_res = db.table("bounties").select("*").eq("target_task_id", task_id).execute()
        bounties = bounties_res.data
        
        now_ist = datetime.now(IST).isoformat()
        if bounties:
            active_bounties = [b for b in bounties if b.get("status") == "ACTIVE"]
            if active_bounties:
                # Find the bounty with the highest points
                highest_bounty = max(active_bounties, key=lambda x: x["points_at_stake"])
                winner_id = highest_bounty["issuer_id"]
                bounty_amount = highest_bounty["points_at_stake"]
                
                # Calculate 10% penalty based on creator's points
                creator_res = db.table("users").select("total_lifetime_points").eq("id", creator_id).execute()
                penalty = 0
                if creator_res.data:
                    creator_pts = creator_res.data[0].get("total_lifetime_points", 0) or 0
                    penalty = max(0, int(creator_pts * 0.10))
                    if penalty > 0:
                        atomic_deduct_points(creator_id, penalty)

                # Reward the winner (refund staked bounty + penalty) atomically
                reward = bounty_amount + penalty
                atomic_add_points(winner_id, reward)

                # Mark winning bounty as RESOLVED_ISSUER_WON
                db.table("bounties").update({"status": "RESOLVED_ISSUER_WON", "resolved_at": now_ist}).eq("id", highest_bounty["id"]).execute()

                # For any other active bounties on this task, refund their staked points to issuers atomically
                for other_b in active_bounties:
                    if other_b["id"] != highest_bounty["id"]:
                        o_issuer = other_b["issuer_id"]
                        o_pts = int(other_b.get("points_at_stake", 0))
                        if o_pts > 0:
                            atomic_add_points(o_issuer, o_pts)
                        db.table("bounties").update({"status": "RESOLVED_ISSUER_WON", "resolved_at": now_ist}).eq("id", other_b["id"]).execute()
        
        resolved_count += 1
        
    return {"message": f"Successfully resolved {resolved_count} abandoned tasks."}
