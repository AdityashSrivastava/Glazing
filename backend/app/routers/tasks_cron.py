from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone, timedelta
from app.auth import verify_cron_secret_or_user
from app.database import db

router = APIRouter(prefix="/api/tasks/cron", tags=["Cron"])

IST = timezone(timedelta(hours=5, minutes=30))

@router.post("/resolve-abandoned")
async def resolve_abandoned_tasks(caller: str = Depends(verify_cron_secret_or_user)):
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
                
                # Fetch the creator's current total points to calculate the 10% penalty
                creator_res = db.table("users").select("total_lifetime_points").eq("id", creator_id).execute()
                if creator_res.data:
                    creator_pts = creator_res.data[0].get("total_lifetime_points", 0) or 0
                    penalty = int(creator_pts * 0.10)
                    
                    # Apply the penalty to the creator
                    new_creator_pts = creator_pts - penalty
                    db.table("users").update({"total_lifetime_points": new_creator_pts}).eq("id", creator_id).execute()
                    
                    # Reward the winner (refund their bounty + the penalty stolen from creator)
                    winner_res = db.table("users").select("total_lifetime_points").eq("id", winner_id).execute()
                    if winner_res.data:
                        winner_pts = winner_res.data[0].get("total_lifetime_points", 0) or 0
                        reward = bounty_amount + penalty
                        db.table("users").update({"total_lifetime_points": winner_pts + reward}).eq("id", winner_id).execute()

                # Mark winning bounty as RESOLVED_ISSUER_WON
                db.table("bounties").update({"status": "RESOLVED_ISSUER_WON", "resolved_at": now_ist}).eq("id", highest_bounty["id"]).execute()

                # For any other active bounties on this task, refund their staked points to issuers
                for other_b in active_bounties:
                    if other_b["id"] != highest_bounty["id"]:
                        o_issuer = other_b["issuer_id"]
                        o_pts = int(other_b.get("points_at_stake", 0))
                        o_res = db.table("users").select("total_lifetime_points").eq("id", o_issuer).execute()
                        if o_res.data:
                            curr_pts = o_res.data[0].get("total_lifetime_points", 0) or 0
                            db.table("users").update({"total_lifetime_points": curr_pts + o_pts}).eq("id", o_issuer).execute()
                        db.table("bounties").update({"status": "RESOLVED_ISSUER_WON", "resolved_at": now_ist}).eq("id", other_b["id"]).execute()
        
        resolved_count += 1
        
    return {"message": f"Successfully resolved {resolved_count} abandoned tasks."}
