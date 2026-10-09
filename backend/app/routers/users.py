from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.auth import get_current_user, verify_cron_secret_or_user
from app.database import db
from app.models import UserBase

router = APIRouter(prefix="/api/users", tags=["Users"])

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

class OperativeRanking(BaseModel):
    rank: int
    id: str
    display_name: str
    avatar_url: Optional[str] = None
    points: int
    tasks_completed: int
    hours_logged: float
    first_blood: bool = False
    is_in_progress: bool = False
    current_streak: int = 0
    tier: str = "Operative"
    is_me: bool = False

class LeaderboardMeta(BaseModel):
    ist_today: str
    seconds_until_midnight_ist: int
    first_blood_operative: Optional[str] = None
    squad_total_points_today: int
    squad_total_tasks_today: int
    my_rank: Optional[int] = None
    my_points: Optional[int] = None

class LeaderboardResponse(BaseModel):
    timeframe: str
    operatives: List[OperativeRanking]
    meta: LeaderboardMeta

@router.get("/me", response_model=UserBase)
async def get_me(current_user_id: str = Depends(get_current_user)):
    res = db.table("users").select("*").eq("id", current_user_id).execute()
    if not res.data:
        # Auto-provision user record if not found in users table
        display_name = "Operative"
        try:
            auth_user = db.auth.admin.get_user_by_id(current_user_id)
            if auth_user and auth_user.user:
                email = auth_user.user.email or ""
                display_name = (auth_user.user.user_metadata or {}).get("display_name") or (email.split("@")[0].capitalize() if email else "Operative")
        except Exception:
            pass
        
        new_user = {
            "id": current_user_id,
            "display_name": display_name,
            "total_lifetime_points": 0
        }
        try:
            ins_res = db.table("users").insert(new_user).execute()
            if ins_res.data:
                return ins_res.data[0]
        except Exception:
            pass
        return new_user
    return res.data[0]

def calculate_tier(points: int) -> str:
    if points >= 200:
        return "Apex Legend"
    elif points >= 100:
        return "Elite Operative"
    elif points >= 50:
        return "Veteran"
    elif points >= 20:
        return "Specialist"
    elif points > 0:
        return "Apprentice"
    return "Recruit"

@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    timeframe: str = Query("daily", pattern="^(daily|weekly|all_time)$"),
    current_user_id: str = Depends(get_current_user)
):
    """
    Returns live squad leaderboard rankings with daily, weekly, or all-time timeframes,
    ticking midnight IST countdown, and First Blood bonus telemetry.
    """
    now_ist = datetime.now(IST)
    today_date = now_ist.date().isoformat()
    today_start_ist = f"{today_date}T00:00:00+05:30"

    # Monday 00:00 IST of current week
    monday_ist = now_ist - timedelta(days=now_ist.weekday())
    week_start_date = monday_ist.date().isoformat()
    week_start_ist = f"{week_start_date}T00:00:00+05:30"

    # Seconds until midnight IST reset
    tomorrow_midnight_ist = datetime(now_ist.year, now_ist.month, now_ist.day, tzinfo=IST) + timedelta(days=1)
    seconds_until_midnight = max(0, int((tomorrow_midnight_ist - now_ist).total_seconds()))

    # 1. Fetch all seeded squad users
    users_res = db.table("users").select("id, display_name, avatar_url, total_lifetime_points, current_streak").execute()
    users = users_res.data or []

    # 2. Fetch all completed tasks
    all_completed_res = db.table("tasks") \
        .select("id, user_id, points_earned, actual_hours, completed_at") \
        .eq("status", "COMPLETED") \
        .order("completed_at", desc=False) \
        .execute()
    all_completed = all_completed_res.data or []

    today_tasks = []
    week_tasks = []
    for t in all_completed:
        c_ist = parse_to_ist(t.get("completed_at"))
        if c_ist:
            if c_ist.date().isoformat() == today_date:
                today_tasks.append((c_ist, t))
            if c_ist.date() >= monday_ist.date():
                week_tasks.append(t)

    # Sort today tasks by earliest completion
    today_tasks.sort(key=lambda x: x[0])
    today_tasks_list = [item[1] for item in today_tasks]

    # First Blood detection
    first_blood_uid = today_tasks_list[0]["user_id"] if today_tasks_list else None
    first_blood_name = None

    # Squad totals today
    squad_total_points_today = sum(t.get("points_earned", 0) or 0 for t in today_tasks_list)
    squad_total_tasks_today = len(today_tasks_list)

    # 3. Select active dataset
    if timeframe == "weekly":
        active_dataset = week_tasks
    elif timeframe == "daily":
        active_dataset = today_tasks_list
    else: # all_time
        active_dataset = all_completed

    # 4. Check active in-progress tasks right now (strictly IN_PROGRESS)
    active_now_res = db.table("tasks").select("user_id").eq("status", "IN_PROGRESS").execute()
    users_in_focus = set(str(t["user_id"]) for t in (active_now_res.data or []))

    # 5. Aggregate stats by user
    user_agg = {}
    for t in active_dataset:
        uid = str(t.get("user_id"))
        stats = user_agg.setdefault(uid, {"points": 0, "count": 0, "hours": 0.0})
        stats["points"] += t.get("points_earned", 0) or 0
        stats["count"] += 1
        stats["hours"] += float(t.get("actual_hours", 0) or 0)

    # Compile operative rankings
    operatives_list = []
    for u in users:
        uid = str(u["id"])
        stats = user_agg.get(uid, {"points": 0, "count": 0, "hours": 0.0})
        
        if timeframe == "all_time":
            pts = u.get("total_lifetime_points", 0)
        else:
            pts = stats["points"]

        is_fb = (uid == str(first_blood_uid))
        if is_fb:
            first_blood_name = u["display_name"]

        operatives_list.append({
            "id": uid,
            "display_name": u["display_name"],
            "avatar_url": u.get("avatar_url"),
            "points": pts,
            "tasks_completed": stats["count"],
            "hours_logged": round(stats["hours"], 1),
            "first_blood": is_fb,
            "is_in_progress": uid in users_in_focus,
            "current_streak": u.get("current_streak", 0),
            "tier": calculate_tier(u.get("total_lifetime_points", 0)),
            "is_me": (uid == str(current_user_id))
        })

    # Sort operatives by points descending, tie-breaker: tasks completed
    operatives_list.sort(key=lambda x: (x["points"], x["tasks_completed"]), reverse=True)

    # Assign sequential ranks
    my_rank = None
    my_points = None
    for idx, op in enumerate(operatives_list):
        op["rank"] = idx + 1
        if op["is_me"]:
            my_rank = op["rank"]
            my_points = op["points"]

    return {
        "timeframe": timeframe,
        "operatives": [OperativeRanking(**op) for op in operatives_list],
        "meta": LeaderboardMeta(
            ist_today=today_date,
            seconds_until_midnight_ist=seconds_until_midnight,
            first_blood_operative=first_blood_name,
            squad_total_points_today=squad_total_points_today,
            squad_total_tasks_today=squad_total_tasks_today,
            my_rank=my_rank,
            my_points=my_points
        )
    }

@router.post("/snapshots/generate")
async def generate_daily_snapshots(caller: str = Depends(verify_cron_secret_or_user)):
    """
    Administrative endpoint to generate daily snapshots.
    Triggered by a cron job at 11:59 PM IST.
    """
    now_ist = datetime.now(IST)
    today_date = now_ist.date().isoformat()
    
    # 1. Fetch all completed tasks for today
    tasks_res = db.table("tasks") \
        .select("user_id, points_earned") \
        .eq("status", "COMPLETED") \
        .gte("completed_at", f"{today_date}T00:00:00+05:30") \
        .execute()
    tasks = tasks_res.data or []
    
    # 2. Aggregate points and count by user_id
    user_stats = {}
    for task in tasks:
        uid = task["user_id"]
        if uid not in user_stats:
            user_stats[uid] = {"points": 0, "count": 0}
        user_stats[uid]["points"] += task["points_earned"]
        user_stats[uid]["count"] += 1
        
    # 3. Fetch all users to ensure everyone gets a snapshot
    users_res = db.table("users").select("id").execute()
    all_users = users_res.data or []
    
    snapshots_to_insert = []
    for u in all_users:
        uid = u["id"]
        stats = user_stats.get(uid, {"points": 0, "count": 0})
        snapshots_to_insert.append({
            "user_id": uid,
            "snapshot_date": today_date,
            "points_earned_that_day": stats["points"],
            "tasks_completed_count": stats["count"],
            "created_at": now_ist.isoformat()
        })
        
    res = db.table("daily_snapshots").upsert(snapshots_to_insert, on_conflict="user_id,snapshot_date").execute()
    return {"message": f"Generated {len(snapshots_to_insert)} snapshots for {today_date}", "data": res.data or []}

@router.get("/{user_id}/radar")
async def get_user_radar(user_id: str, current_user_id: str = Depends(get_current_user)):
    """Grouping lifetime points across 5 core competency domains per tracker.md Section 5."""
    goals_res = db.table("goals").select("id, category").eq("user_id", user_id).execute()
    goals = goals_res.data or []
    goal_category_map = {str(g["id"]): g.get("category", "Life") for g in goals}

    tasks_res = db.table("tasks") \
        .select("goal_id, points_earned") \
        .eq("user_id", user_id) \
        .eq("status", "COMPLETED") \
        .execute()
    tasks = tasks_res.data or []

    DOMAINS = ["Development", "DSA", "College Work"]
    domain_points = {d: 0 for d in DOMAINS}

    LEGACY_MAP = {
        "Coding": "Development",
        "Career": "Development",
        "Learning": "College Work",
        "College Studies": "College Work",
    }

    for t in tasks:
        gid = str(t.get("goal_id")) if t.get("goal_id") else None
        cat = goal_category_map.get(gid)
        pts = t.get("points_earned", 0) or 0
        if cat and cat in domain_points:
            domain_points[cat] += pts
        elif cat and cat in LEGACY_MAP and LEGACY_MAP[cat] in domain_points:
            domain_points[LEGACY_MAP[cat]] += pts

    return [{"domain": d, "total_points": domain_points[d]} for d in DOMAINS]

class WeeklyRankItem(BaseModel):
    rank: int
    id: str
    display_name: str
    avatar_url: Optional[str] = None
    points: int
    tasks_completed: int
    hours_logged: float
    party_duty: bool = False
    status_label: str
    is_me: bool = False

class WeekSummary(BaseModel):
    week_id: str
    week_label: str
    start_date: str
    end_date: str
    is_completed: bool
    winner: Optional[WeeklyRankItem] = None
    rankings: List[WeeklyRankItem] = []
    party_sponsors: List[str] = []
    party_resolved: bool = False
    party_resolved_at: Optional[str] = None
    party_resolved_by: Optional[str] = None

class WeeklyAchieversResponse(BaseModel):
    current_week_id: str
    current_week_label: str
    is_sunday_night: bool
    seconds_until_midnight_ist: int
    latest_completed_week: Optional[WeekSummary] = None
    past_weeks: List[WeekSummary] = []
    current_week_preview: Optional[WeekSummary] = None

import time

_weekly_cache_time: float = 0.0
_cached_weekly_data: Optional[tuple] = None

def compute_weekly_summaries(current_user_id: str):
    global _weekly_cache_time, _cached_weekly_data
    now_ts = time.time()

    now_ist = datetime.now(IST)
    today_date = now_ist.date()

    # Current week Monday and Sunday in IST
    current_monday = today_date - timedelta(days=now_ist.weekday())
    current_sunday = current_monday + timedelta(days=6)
    current_week_num = current_monday.isocalendar()[1]
    current_week_id = f"{current_monday.year}-W{current_week_num:02d}"
    current_week_label = f"Week {current_week_num} ({current_monday.strftime('%b %d')} - {current_sunday.strftime('%b %d, %Y')})"

    tomorrow_midnight_ist = datetime(now_ist.year, now_ist.month, now_ist.day, tzinfo=IST) + timedelta(days=1)
    seconds_until_midnight = max(0, int((tomorrow_midnight_ist - now_ist).total_seconds()))
    is_sunday = (now_ist.weekday() == 6)

    if _cached_weekly_data and (now_ts - _weekly_cache_time < 15.0):
        users, resolved_map, weeks_dict = _cached_weekly_data
    else:
        # 1. Fetch all seeded squad users
        users_res = db.table("users").select("id, display_name, avatar_url, total_lifetime_points").execute()
        users = users_res.data or []

        # 2. Fetch all completed tasks
        tasks_res = db.table("tasks") \
            .select("id, user_id, points_earned, actual_hours, completed_at") \
            .eq("status", "COMPLETED") \
            .execute()
        all_completed = tasks_res.data or []

        # 2b. Fetch party mandate resolutions
        resolutions_res = db.table("tasks") \
            .select("id, user_id, title, completed_at") \
            .like("title", "%[PANEER_PATTIES_RESOLVED]%") \
            .execute()
        resolutions = resolutions_res.data or []
        resolved_map = {}
        for r in resolutions:
            t_str = r.get("title", "")
            for part in t_str.split():
                clean_part = part.strip("[]:, -")
                if "-W" in clean_part and len(clean_part) >= 7:
                    resolved_map[clean_part] = r

        # 3. Group tasks by ISO calendar week in IST
        weeks_dict = {}

        for t in all_completed:
            c_ist = parse_to_ist(t.get("completed_at"))
            if not c_ist:
                continue
            t_monday = c_ist.date() - timedelta(days=c_ist.weekday())
            w_id = f"{t_monday.year}-W{t_monday.isocalendar()[1]:02d}"
            
            if w_id not in weeks_dict:
                t_sunday = t_monday + timedelta(days=6)
                w_num = t_monday.isocalendar()[1]
                weeks_dict[w_id] = {
                    "monday": t_monday,
                    "sunday": t_sunday,
                    "label": f"Week {w_num} ({t_monday.strftime('%b %d')} - {t_sunday.strftime('%b %d, %Y')})",
                    "user_agg": {str(u["id"]): {"points": 0, "count": 0, "hours": 0.0} for u in users}
                }
            
            uid = str(t.get("user_id"))
            if uid in weeks_dict[w_id]["user_agg"]:
                weeks_dict[w_id]["user_agg"][uid]["points"] += (t.get("points_earned") or 0)
                weeks_dict[w_id]["user_agg"][uid]["count"] += 1
                weeks_dict[w_id]["user_agg"][uid]["hours"] += float(t.get("actual_hours") or 0)

        # Ensure current week is represented
        if current_week_id not in weeks_dict:
            weeks_dict[current_week_id] = {
                "monday": current_monday,
                "sunday": current_sunday,
                "label": current_week_label,
                "user_agg": {str(u["id"]): {"points": 0, "count": 0, "hours": 0.0} for u in users}
            }
        _cached_weekly_data = (users, resolved_map, weeks_dict)
        _weekly_cache_time = now_ts

    # 4. Build WeekSummary for each week
    summaries = []
    for w_id, w_info in weeks_dict.items():
        w_monday = w_info["monday"]
        w_sunday = w_info["sunday"]
        is_completed = (w_monday < current_monday)

        ranking_list = []
        for u in users:
            uid = str(u["id"])
            st = w_info["user_agg"].get(uid, {"points": 0, "count": 0, "hours": 0.0})
            ranking_list.append({
                "id": uid,
                "display_name": u.get("display_name", "Operative"),
                "avatar_url": u.get("avatar_url"),
                "points": st["points"],
                "tasks_completed": st["count"],
                "hours_logged": round(st["hours"], 1),
                "is_me": (uid == str(current_user_id))
            })

        ranking_list.sort(key=lambda x: (x["points"], x["tasks_completed"], x["hours_logged"]), reverse=True)

        ranked_items: List[WeeklyRankItem] = []
        party_sponsors: List[str] = []

        for idx, item in enumerate(ranking_list):
            rank = idx + 1
            is_duty = False
            status_label = "Operative"

            if rank == 1:
                status_label = "👑 Weekly Champion (Patties Guest of Honor)"
            elif rank == 2:
                status_label = "🥈 2nd Place (Safe)"
            elif rank == 3:
                status_label = "🥉 3rd Place (Safe)"
            elif rank == 4:
                is_duty = True
                status_label = "🍔 Patties Sponsor Duty #1"
                party_sponsors.append(item["display_name"])
            elif rank == 5:
                is_duty = True
                status_label = "🍔 Patties Sponsor Duty #2"
                party_sponsors.append(item["display_name"])

            ranked_items.append(WeeklyRankItem(
                rank=rank,
                id=item["id"],
                display_name=item["display_name"],
                avatar_url=item["avatar_url"],
                points=item["points"],
                tasks_completed=item["tasks_completed"],
                hours_logged=item["hours_logged"],
                party_duty=is_duty,
                status_label=status_label,
                is_me=item["is_me"]
            ))

        winner = ranked_items[0] if ranked_items else None

        res_entry = resolved_map.get(w_id)
        is_party_resolved = (res_entry is not None)
        party_resolved_at = res_entry.get("completed_at") if res_entry else None
        resolved_uid = res_entry.get("user_id") if res_entry else None
        resolved_by_name = next((u["display_name"] for u in users if str(u["id"]) == str(resolved_uid)), None) if resolved_uid else None

        summaries.append(WeekSummary(
            week_id=w_id,
            week_label=w_info["label"],
            start_date=w_monday.isoformat(),
            end_date=w_sunday.isoformat(),
            is_completed=is_completed,
            winner=winner,
            rankings=ranked_items,
            party_sponsors=party_sponsors,
            party_resolved=is_party_resolved,
            party_resolved_at=party_resolved_at,
            party_resolved_by=resolved_by_name
        ))

    # Sort weeks descending by start_date
    summaries.sort(key=lambda x: x.start_date, reverse=True)
    return summaries, current_week_id, current_week_label, is_sunday, seconds_until_midnight

@router.get("/weekly-achievers", response_model=WeeklyAchieversResponse)
async def get_weekly_achievers(current_user_id: str = Depends(get_current_user)):
    """
    Returns past weekly champions, current sprint standings,
    and identifies the 4th and 5th placed operatives tasked with sponsoring
    the Paneer Patties Party for the champion.
    """
    summaries, current_week_id, current_week_label, is_sunday, seconds_until_midnight = compute_weekly_summaries(current_user_id)

    past_weeks = [s for s in summaries if s.is_completed]
    current_week_preview = next((s for s in summaries if s.week_id == current_week_id), None)

    # Latest completed week (only weeks that have concluded after Sunday 23:59:59 IST)
    latest_completed_week = past_weeks[0] if past_weeks else None

    return WeeklyAchieversResponse(
        current_week_id=current_week_id,
        current_week_label=current_week_label,
        is_sunday_night=is_sunday,
        seconds_until_midnight_ist=seconds_until_midnight,
        latest_completed_week=latest_completed_week,
        past_weeks=past_weeks,
        current_week_preview=current_week_preview
    )

class ResolvePartyResponse(BaseModel):
    message: str
    week_id: str
    party_resolved: bool
    resolved_by: str
    resolved_at: str

@router.post("/weekly-achievers/{week_id}/resolve-party", response_model=ResolvePartyResponse)
async def resolve_weekly_party(week_id: str, current_user_id: str = Depends(get_current_user)):
    """
    Allows the champion who won the week (or admin) to resolve the Paneer Patties Party Mandate,
    confirming 'I got the party!' and archiving the mandate.
    """
    summaries, _, _, _, _ = compute_weekly_summaries(current_user_id)
    target_summary = next((s for s in summaries if s.week_id == week_id), None)
    if not target_summary:
        raise HTTPException(status_code=404, detail=f"Week {week_id} not found")

    winner = target_summary.winner
    if not winner:
        raise HTTPException(status_code=400, detail=f"No winner found for {week_id}")

    # Only the champion who won the week can confirm receiving the party
    is_winner = (str(winner.id) == str(current_user_id))

    if not is_winner:
        raise HTTPException(
            status_code=403, 
            detail=f"Only the weekly champion ({winner.display_name}) can confirm receiving the Paneer Patties Party!"
        )

    # Check if already resolved
    if target_summary.party_resolved:
        return ResolvePartyResponse(
            message="Paneer Patties Party Mandate is already resolved!",
            week_id=week_id,
            party_resolved=True,
            resolved_by=target_summary.party_resolved_by or winner.display_name,
            resolved_at=target_summary.party_resolved_at or datetime.now(timezone.utc).isoformat()
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    resolver_label = winner.display_name
    resolution_task = {
        "user_id": current_user_id,
        "title": f"🍔 [PANEER_PATTIES_RESOLVED] {week_id} - Party Delivered & Enjoyed!",
        "is_private": False,
        "estimated_hours": 0.1,
        "actual_hours": 0.0,
        "goal_id": None,
        "status": "COMPLETED",
        "points_earned": 0,
        "completed_at": now_iso,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    db.table("tasks").insert(resolution_task).execute()

    return ResolvePartyResponse(
        message="Paneer Patties Party Mandate resolved! Party confirmed.",
        week_id=week_id,
        party_resolved=True,
        resolved_by=resolver_label,
        resolved_at=now_iso
    )

class SetPasswordRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6, max_length=128)
    current_password: Optional[str] = Field(None, max_length=128)

class UpdatePasswordRequest(BaseModel):
    password: str = Field(..., min_length=6, max_length=128)

ALLOWED_OPERATIVE_EMAILS = {
    "adityash@glazing.com",
    "manas@glazing.com",
    "shivansh@glazing.com",
    "praveen@glazing.com",
    "harshit@glazing.com"
}

@router.post("/set-password")
async def set_operative_password(req: SetPasswordRequest):
    """Allows verified squad operatives to set or update their custom password in Supabase."""
    clean_email = req.email.strip().lower()
    if clean_email not in ALLOWED_OPERATIVE_EMAILS:
        raise HTTPException(
            status_code=403,
            detail="Unauthorized operative email. Access restricted strictly to the 5 squad operatives."
        )
    if len(req.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long."
        )
    
    try:
        users = db.auth.admin.list_users()
        user = next((u for u in users if u.email and u.email.lower() == clean_email), None)
        if not user:
            # First-time provisioning: create user if missing in auth
            disp_name = clean_email.split("@")[0].capitalize()
            created = db.auth.admin.create_user({
                "email": clean_email,
                "password": req.password,
                "email_confirm": True
            })
            db.table("users").upsert({
                "id": created.user.id,
                "display_name": disp_name,
                "total_lifetime_points": 0
            }).execute()
        else:
            # Existing operative account: must provide current password to prevent unauthorized takeover
            if not req.current_password:
                raise HTTPException(
                    status_code=400,
                    detail="Current password is required to update an existing operative's password."
                )
            try:
                sign_in_test = db.auth.sign_in_with_password({
                    "email": clean_email,
                    "password": req.current_password
                })
                if not sign_in_test or not sign_in_test.user:
                    raise Exception("Invalid credentials")
            except Exception:
                raise HTTPException(
                    status_code=401,
                    detail="Current password verification failed. Unauthorized to update password."
                )
            db.auth.admin.update_user_by_id(user.id, {"password": req.password})
            
        return {
            "status": "success",
            "message": f"Password successfully updated in Supabase for {clean_email}."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update password. Telemetry logged.")

@router.post("/me/password")
async def update_my_password(
    req: UpdatePasswordRequest,
    current_user_id: str = Depends(get_current_user)
):
    """Allows an authenticated operative to update their password while in the terminal."""
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
    try:
        db.auth.admin.update_user_by_id(current_user_id, {"password": req.password})
        return {"status": "success", "message": "Password updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update password. Telemetry logged.")


