from fastapi import APIRouter, Depends
from typing import List, Dict, Any
from app.auth import get_current_user
from app.database import db

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])

@router.get("/radar")
async def get_radar_data(current_user_id: str = Depends(get_current_user)):
    # 1. Fetch all goals for the user
    goals_res = db.table("goals").select("*").eq("user_id", current_user_id).execute()
    goals = goals_res.data or []

    # 2. Fetch all COMPLETED tasks for the user
    tasks_res = db.table("tasks") \
        .select("goal_id, points_earned") \
        .eq("user_id", current_user_id) \
        .eq("status", "COMPLETED") \
        .execute()
        
    tasks = tasks_res.data or []
    
    # 3. Standard competency domains from schema
    DOMAINS = ["DSA", "Development", "College Studies", "Gym", "Life"]
    domain_points = {d: 0 for d in DOMAINS}
    
    LEGACY_MAP = {
        "Coding": "Development",
        "Fitness": "Gym",
        "Learning": "College Studies",
        "Career": "Development",
    }
    
    # Map goal_id -> category
    goal_category_map = {str(g["id"]): g.get("category", "Life") for g in goals}
    
    for t in tasks:
        gid = str(t.get("goal_id")) if t.get("goal_id") else None
        cat = goal_category_map.get(gid)
        pts = t.get("points_earned", 0) or 0
        if cat and cat in domain_points:
            domain_points[cat] += pts
        elif cat and cat in LEGACY_MAP:
            domain_points[LEGACY_MAP[cat]] += pts
        elif cat:
            domain_points["Life"] += pts
        else:
            # Standalone task without linked goal
            domain_points["Life"] += pts

    return [{"domain": d, "total_points": domain_points[d]} for d in DOMAINS]
