from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from uuid import UUID
import os
import re
import time
from app.models import TaskBase, mask_private_task
from app.auth import get_current_user
from app.database import db
from app.routers.timer import get_all_tasks_focus_durations, get_tasks_focus_durations

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])

# Strict Indian Standard Time (IST) offset
IST = timezone(timedelta(hours=5, minutes=30))

def parse_to_ist(dt_str: Optional[str]) -> Optional[datetime]:
    """Parses any ISO-8601 or UTC datetime string into a timezone-aware IST datetime."""
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

def analyze_proof_of_work(task_title: str, domain_category: Optional[str], proof_url: Optional[str]) -> tuple[bool, str]:
    """
    Analyses whether the provided Proof of Work (URL link, screenshot, or repository commit)
    is authentic and reasonably/vaguely related to the work performed.
    """
    if not proof_url or not proof_url.strip():
        return False, "No proof of work provided."

    proof = proof_url.strip().lower()
    
    # 1. Reject obvious placeholder or dummy values
    dummy_patterns = ["test.com", "example.com", "fake.com", "asdf", "foo.bar", "placeholder", "none", "null", "undefined"]
    for dp in dummy_patterns:
        if proof == dp or f"//{dp}" in proof:
            return False, "Proof rejected: Placeholder or dummy link detected."

    # 2. Check for uploaded screenshots or image files
    image_indicators = ["proof_uploads", ".png", ".jpg", ".jpeg", ".webp", ".gif", "data:image/", "blob:"]
    is_screenshot = any(ind in proof for ind in image_indicators)

    category = (domain_category or "").strip().lower()

    # 3. Known domain platforms
    dsa_platforms = ["leetcode", "codeforces", "hackerrank", "geeksforgeeks", "neetcode", "algo", "problem", "submission", "atcoder", "cses", "interviewbit"]
    dev_platforms = ["github", "gitlab", "bitbucket", "vercel", "netlify", "heroku", "render", "postman", "codepen", "codesandbox", "replit", "pull", "commit", "localhost", "127.0.0.1", "docker", "aws", "gcp"]
    college_platforms = ["google.com/document", "docs.google", "drive.google", "classroom.google", "canvas", "blackboard", "moodle", "notion.site", "notion.so", "overleaf", ".pdf", "edu/", ".edu", "assignment", "slides"]

    # 4. Extract meaningful tokens from task title
    stopwords = {"a", "an", "the", "in", "on", "of", "to", "for", "with", "and", "or", "by", "from", "at", "my", "task", "work", "part", "day", "do", "done", "complete", "finish", "test"}
    title_words = set(re.findall(r'[a-zA-Z0-9]{3,}', task_title.lower())) - stopwords

    # Token match between title and proof URL / filename
    matching_tokens = [w for w in title_words if w in proof]

    # Verification decision:
    if is_screenshot:
        # User uploaded visual proof of execution
        return True, "Proof verified: Visual screenshot uploaded."

    if "dsa" in category:
        if any(p in proof for p in dsa_platforms) or any(p in proof for p in ["github", "solution", "dsa", "code"]) or matching_tokens:
            return True, "Proof verified: Algorithmic platform / code submission detected."
    elif "dev" in category or "coding" in category or "career" in category:
        if any(p in proof for p in dev_platforms) or matching_tokens:
            return True, "Proof verified: Development repository or deployment link confirmed."
    elif "college" in category or "study" in category or "studies" in category:
        if any(p in proof for p in college_platforms) or matching_tokens:
            return True, "Proof verified: Academic document or submission verified."
    else:
        # General / unlinked:
        if matching_tokens or any(p in proof for p in dsa_platforms + dev_platforms + college_platforms):
            return True, "Proof verified: Task-related link confirmed."
        if proof.startswith("http://") or proof.startswith("https://"):
            if len(proof) > 12 and "/" in proof[8:]:
                return True, "Proof verified: Valid verification link provided."

    if matching_tokens:
        return True, f"Proof verified: Correlates with task scope ({', '.join(matching_tokens[:2])})."

    return False, "Proof rejected: Provided link does not appear related to the task domain."

DOMAIN_HOURLY_RATES = {
    "DSA": 15.0,
    "Development": 12.5,
    "College Work": 10.0,
    "College Studies": 10.0,
}

def get_domain_hourly_rate(category: Optional[str]) -> float:
    if not category:
        return 5.0
    cat_norm = category.strip().lower()
    if "dsa" in cat_norm:
        return 15.0
    elif "dev" in cat_norm or "coding" in cat_norm or "career" in cat_norm:
        return 12.5
    elif "college" in cat_norm or "learning" in cat_norm or "studies" in cat_norm or "work" in cat_norm:
        return 10.0
    return 5.0

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    is_private: bool = False
    estimated_hours: float = Field(..., gt=0, le=12)
    goal_id: Optional[str] = None

class TaskComplete(BaseModel):
    actual_hours: float = Field(..., gt=0, le=12)
    proof_url: Optional[str] = None

    @field_validator("proof_url")
    @classmethod
    def validate_proof_url(cls, v: Optional[str]) -> Optional[str]:
        if not v:
            return None
        cleaned = v.strip()
        if not cleaned:
            return None
        if not (cleaned.startswith("http://") or cleaned.startswith("https://") or cleaned.startswith("data:image/")):
            if "." in cleaned and not cleaned.startswith("/"):
                return f"https://{cleaned}"
        return cleaned


@router.post("/upload-proof")
async def upload_task_proof(file: UploadFile = File(...), current_user_id: str = Depends(get_current_user)):
    """Uploads a screenshot or proof asset directly to the proof_uploads Supabase Storage bucket."""
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max size is 10MB.")

    safe_name = re.sub(r'[^a-zA-Z0-9_\-\.]', '_', file.filename)
    dest_path = f"{current_user_id[:8]}_{int(time.time())}_{safe_name}"
    content_type = file.content_type or "image/png"

    try:
        db.storage.from_("proof_uploads").upload(dest_path, content, {"content-type": content_type})
        public_url = db.storage.from_("proof_uploads").get_public_url(dest_path)
        return {"url": public_url, "filename": safe_name}
    except Exception as e:
        print("Upload failed or bucket handling:", e)
        try:
            public_url = db.storage.from_("proof_uploads").get_public_url(dest_path)
            return {"url": public_url, "filename": safe_name}
        except Exception:
            raise HTTPException(status_code=500, detail=f"Failed to upload proof asset: {str(e)}")

class TaskFeedStats(BaseModel):
    active_in_progress_count: int
    active_operatives_count: int
    completed_today_count: int
    hours_logged_today: float
    points_scored_today: int
    open_bounties_count: int
    open_bounty_points: int

@router.get("/stats", response_model=TaskFeedStats)
async def get_task_feed_stats(current_user_id: str = Depends(get_current_user)):
    """Provides high-level tactical telemetry for the Global Activity squad pulse in IST."""
    now_ist = datetime.now(IST)
    today_date = now_ist.date().isoformat()

    tasks_res = db.table("tasks").select("id, user_id, status, actual_hours, points_earned, completed_at").execute()
    tasks = tasks_res.data or []

    active_tasks = [t for t in tasks if t.get("status") == "IN_PROGRESS"]
    active_users = set(str(t["user_id"]) for t in active_tasks)

    completed_today = []
    for t in tasks:
        if t.get("status") == "COMPLETED" and t.get("completed_at"):
            c_ist = parse_to_ist(t["completed_at"])
            if c_ist and c_ist.date().isoformat() == today_date:
                completed_today.append(t)

    hours_today = round(sum(float(t.get("actual_hours") or 0.0) for t in completed_today), 1)
    points_today = sum(int(t.get("points_earned") or 0) for t in completed_today)

    bounties_res = db.table("bounties").select("id, points_at_stake").eq("status", "ACTIVE").execute()
    bounties = bounties_res.data or []

    return TaskFeedStats(
        active_in_progress_count=len(active_tasks),
        active_operatives_count=len(active_users),
        completed_today_count=len(completed_today),
        hours_logged_today=hours_today,
        points_scored_today=points_today,
        open_bounties_count=len(bounties),
        open_bounty_points=sum(int(b.get("points_at_stake") or 0) for b in bounties)
    )

@router.get("/feed", response_model=List[TaskBase])
async def get_task_feed(current_user_id: str = Depends(get_current_user)):
    """Fetches global task feed enriched with active bounties, sniper bonus, timer durations, and first blood."""
    res = db.table("tasks").select("*").order("created_at", desc=True).execute()
    tasks = res.data or []
    
    # Map user_id -> display_name
    users_res = db.table("users").select("id, display_name").execute()
    user_map = {str(u["id"]): u.get("display_name", "Operative") for u in (users_res.data or [])}

    # Map goal_id -> { title, is_private, user_id, category }
    goals_res = db.table("goals").select("id, title, user_id, category").execute()
    goal_map = {}
    for g in (goals_res.data or []):
        raw_t = g.get("title") or ""
        clean_t = raw_t[10:] if raw_t.startswith("[PRIVATE] ") else raw_t
        goal_map[str(g["id"])] = {
            "title": clean_t,
            "is_private": raw_t.startswith("[PRIVATE] "),
            "user_id": str(g.get("user_id")),
            "category": g.get("category")
        }

    # Map active bounties on each task
    bounties_res = db.table("bounties").select("target_task_id, points_at_stake, issuer_id").eq("status", "ACTIVE").execute()
    bounty_map = {}
    for b in (bounties_res.data or []):
        tid = str(b.get("target_task_id"))
        entry = bounty_map.setdefault(tid, {"count": 0, "points": 0, "issuers": []})
        entry["count"] += 1
        entry["points"] += int(b.get("points_at_stake") or 0)
        issuer_name = user_map.get(str(b.get("issuer_id")), "Operative")
        if issuer_name not in entry["issuers"]:
            entry["issuers"].append(issuer_name)

    # Calculate first blood task ID for each completed calendar date in IST
    completed_by_day = {}
    for t in tasks:
        if t.get("status") == "COMPLETED" and t.get("completed_at"):
            c_ist = parse_to_ist(t["completed_at"])
            if c_ist:
                day_str = c_ist.date().isoformat()
                if day_str not in completed_by_day or c_ist < completed_by_day[day_str]["time"]:
                    completed_by_day[day_str] = {"time": c_ist, "task_id": str(t["id"])}
    first_blood_task_ids = {info["task_id"] for info in completed_by_day.values()}
    
    # Aggregated focus durations across ALL operatives
    focus_durations = get_all_tasks_focus_durations()
    masked_tasks = []
    for task_data in tasks:
        uid = str(task_data.get("user_id"))
        gid = str(task_data.get("goal_id")) if task_data.get("goal_id") else None
        task_data["user_name"] = user_map.get(uid, "Operative")
        
        if gid and gid in goal_map:
            g_info = goal_map[gid]
            if g_info["is_private"] and uid != current_user_id:
                task_data["goal_title"] = "[ CLASSIFIED OBJECTIVE ]"
            else:
                task_data["goal_title"] = g_info["title"]
            task_data["category"] = g_info.get("category")
        else:
            task_data["goal_title"] = None
            task_data["category"] = None

        # Attach active bounty info
        b_info = bounty_map.get(str(task_data["id"]), {"count": 0, "points": 0, "issuers": []})
        task_data["active_bounties_count"] = b_info["count"]
        task_data["total_bounty_points"] = b_info["points"]
        task_data["bounty_issuers"] = b_info["issuers"]

        # Achievement bonus indicators
        is_completed = task_data.get("status") == "COMPLETED"
        task_data["is_first_blood"] = str(task_data["id"]) in first_blood_task_ids

        # Sniper precision bonus is removed
        task_data["is_sniper"] = False

        # Proof of Work verification
        if is_completed and task_data.get("proof_url"):
            verified, feedback = analyze_proof_of_work(task_data.get("title", ""), task_data.get("category"), task_data.get("proof_url"))
            task_data["is_proof_verified"] = verified
            task_data["proof_feedback"] = feedback
        else:
            task_data["is_proof_verified"] = False
            task_data["proof_feedback"] = None
        
        # Attach tracked Pomodoro timer time
        task_id_str = str(task_data.get("id"))
        tracked_mins = focus_durations.get(task_id_str, 0)
        task_data["tracked_timer_minutes"] = tracked_mins
        task_data["tracked_timer_hours"] = round(tracked_mins / 60.0, 1) if tracked_mins > 0 else 0.0

        task = TaskBase(**task_data)
        masked = mask_private_task(task, UUID(current_user_id))
        masked_tasks.append(masked)
        
    return masked_tasks

@router.post("", response_model=TaskBase)
async def create_task(task_in: TaskCreate, current_user_id: str = Depends(get_current_user)):
    clean_title = task_in.title.strip()
    if not clean_title:
        raise HTTPException(status_code=400, detail="Task title cannot be empty")

    clean_goal_id = None
    if task_in.goal_id and str(task_in.goal_id).strip():
        raw_gid = str(task_in.goal_id).strip()
        try:
            clean_goal_id = str(UUID(raw_gid))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid goal_id format")

        goal_check = db.table("goals").select("id, user_id, title").eq("id", clean_goal_id).execute()
        if not goal_check.data:
            raise HTTPException(status_code=404, detail="Referenced goal does not exist")
        if str(goal_check.data[0]["user_id"]) != current_user_id:
            raise HTTPException(status_code=403, detail="Referenced goal does not belong to you")

    now_ist = datetime.now(IST).isoformat()
    new_task = {
        "user_id": current_user_id,
        "title": clean_title,
        "is_private": task_in.is_private,
        "estimated_hours": round(float(task_in.estimated_hours), 2),
        "goal_id": clean_goal_id,
        "status": "PENDING",
        "points_earned": 0,
        "created_at": now_ist,
        "updated_at": now_ist
    }
    res = db.table("tasks").insert(new_task).execute()
    if not res.data:
        raise HTTPException(status_code=500, detail="Failed to create task")
    created = res.data[0]
    user_res = db.table("users").select("display_name").eq("id", current_user_id).execute()
    created["user_name"] = user_res.data[0].get("display_name", "Operative") if user_res.data else "Operative"
    gid = created.get("goal_id")
    if gid:
        goal_res = db.table("goals").select("title").eq("id", str(gid)).execute()
        if goal_res.data:
            raw_t = goal_res.data[0].get("title") or ""
            created["goal_title"] = raw_t[10:] if raw_t.startswith("[PRIVATE] ") else raw_t
        else:
            created["goal_title"] = None
    else:
        created["goal_title"] = None
    return TaskBase(**created)

@router.patch("/{task_id}/complete", response_model=TaskBase)
async def complete_task(task_id: UUID, payload: TaskComplete, current_user_id: str = Depends(get_current_user)):
    """The Gamification Engine - strictly enforces gamification math rules in IST."""
    if payload.actual_hours > 12 or payload.actual_hours <= 0:
        raise HTTPException(status_code=400, detail="Invalid actual hours. Must be greater than 0 and up to 12 hours.")

    # 1. Fetch current task
    res = db.table("tasks").select("*").eq("id", str(task_id)).eq("user_id", current_user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found or not yours")
    task = res.data[0]
    
    if task["status"] == "COMPLETED":
        raise HTTPException(status_code=400, detail="Task is already completed")
    if task["status"] not in ["PENDING", "IN_PROGRESS"]:
        raise HTTPException(status_code=400, detail=f"Cannot complete task with status {task['status']}. Only PENDING or IN_PROGRESS tasks can be completed.")

    now_ist = datetime.now(IST)
    today_date = now_ist.date().isoformat()

    # 2. Check Daily 24-Hour Logging Limit (Rule 7 & tracker.md)
    user_completed_res = db.table("tasks") \
        .select("actual_hours, completed_at") \
        .eq("user_id", current_user_id) \
        .eq("status", "COMPLETED") \
        .execute()
    today_logged_hours = 0.0
    for ct in (user_completed_res.data or []):
        c_ist = parse_to_ist(ct.get("completed_at"))
        if c_ist and c_ist.date().isoformat() == today_date:
            today_logged_hours += float(ct.get("actual_hours") or 0.0)

    if today_logged_hours + payload.actual_hours > 24.0:
        raise HTTPException(
            status_code=400,
            detail=f"Daily 24-hour limit exceeded. You have already logged {today_logged_hours:.1f} hours today in IST. Adding {payload.actual_hours:.1f} hours would exceed the 24-hour ceiling."
        )

    points = 0
    
    # Step 1: Base Time Points (Domain distribution: 12.5 Dev, 15 DSA, 10 College Work, 5 Base/Unlinked)
    rate = 5.0
    goal_category = None
    gid = task.get("goal_id")
    if gid:
        goal_res = db.table("goals").select("title, category").eq("id", str(gid)).execute()
        if goal_res.data:
            goal_category = goal_res.data[0].get("category")

    rate = get_domain_hourly_rate(goal_category)

    points += int(round(payload.actual_hours * rate))
    
    # Step 2: Proof of Work / Verification Bonus (+5 points only when verifiable proof is provided and system-verified)
    is_proof_verified, proof_feedback = analyze_proof_of_work(task.get("title", ""), goal_category, payload.proof_url)
    if is_proof_verified:
        points += 5
    
    # Step 3: Sniper Precision Bonus -> REMOVED COMPLETELY
    is_sniper = False
            
    # Step 4: First Blood Bonus (+3 points for first completed task of the day in IST)
    all_completed_res = db.table("tasks").select("id, completed_at").eq("status", "COMPLETED").execute()
    already_completed_today = False
    for ct in (all_completed_res.data or []):
        c_ist = parse_to_ist(ct.get("completed_at"))
        if c_ist and c_ist.date().isoformat() == today_date:
            already_completed_today = True
            break
        
    is_first_blood = not already_completed_today
    if is_first_blood:
        points += 3
        
    # Step 5: Process Active Bounties Won
    bounties_res = db.table("bounties").select("*").eq("target_task_id", str(task_id)).eq("status", "ACTIVE").execute()
    active_bounties = bounties_res.data or []
    
    bounty_points_won = 0
    for bounty in active_bounties:
        bounty_points_won += int(bounty.get("points_at_stake", 0))
        try:
            db.table("bounties").update({"status": "RESOLVED_TARGET_WON", "resolved_at": now_ist.isoformat()}).eq("id", bounty["id"]).execute()
        except Exception:
            try:
                db.table("bounties").delete().eq("id", bounty["id"]).execute()
                b_copy = dict(bounty)
                b_copy["status"] = "RESOLVED_TARGET_WON"
                b_copy["resolved_at"] = now_ist.isoformat()
                db.table("bounties").insert(b_copy).execute()
            except Exception as b_err:
                print("Failed to resolve bounty:", b_err)
        
    points += bounty_points_won
        
    # 3. Update Task Record
    updated_task = {
        "status": "COMPLETED",
        "actual_hours": payload.actual_hours,
        "points_earned": points,
        "completed_at": now_ist.isoformat(),
        "updated_at": now_ist.isoformat()
    }
    if payload.proof_url and payload.proof_url.strip():
        updated_task["proof_url"] = payload.proof_url.strip()
    
    update_res = db.table("tasks").update(updated_task).eq("id", str(task_id)).execute()
    completed = update_res.data[0] if (update_res.data and len(update_res.data) > 0) else {**task, **updated_task}
    
    # 4. Increment User Total Lifetime Points
    user_res = db.table("users").select("display_name, total_lifetime_points").eq("id", current_user_id).execute()
    user_name = "Operative"
    if user_res.data:
        user_name = user_res.data[0].get("display_name", "Operative")
        new_total = (user_res.data[0].get("total_lifetime_points") or 0) + points
        db.table("users").update({"total_lifetime_points": new_total}).eq("id", current_user_id).execute()

    # 5. Synchronize Daily Snapshot for Weekly Leaderboard Accuracy
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
            if c_ist and c_ist.date().isoformat() == today_date:
                today_user_pts += int(st.get("points_earned") or 0)
                today_user_count += 1
        
        snap_payload = {
            "user_id": current_user_id,
            "snapshot_date": today_date,
            "points_earned_that_day": today_user_pts,
            "tasks_completed_count": today_user_count
        }
        db.table("daily_snapshots").upsert(snap_payload, on_conflict="user_id,snapshot_date").execute()
    except Exception as snap_err:
        print("Failed to sync daily snapshot:", snap_err)
        
    completed["user_name"] = user_name
    gid = completed.get("goal_id")
    if gid:
        goal_res = db.table("goals").select("title").eq("id", str(gid)).execute()
        if goal_res.data:
            raw_t = goal_res.data[0].get("title") or ""
            completed["goal_title"] = raw_t[10:] if raw_t.startswith("[PRIVATE] ") else raw_t
        else:
            completed["goal_title"] = None
    else:
        completed["goal_title"] = None

    completed["is_sniper"] = False
    completed["is_first_blood"] = is_first_blood
    completed["category"] = goal_category
    completed["is_proof_verified"] = is_proof_verified
    completed["proof_feedback"] = proof_feedback

    # Attach tracked timer duration
    focus_durations = get_tasks_focus_durations(current_user_id)
    mins = focus_durations.get(str(task_id), 0)
    completed["tracked_timer_minutes"] = mins
    completed["tracked_timer_hours"] = round(mins / 60.0, 1) if mins > 0 else 0.0

    return TaskBase(**completed)

@router.patch("/{task_id}/focus", response_model=TaskBase)
async def toggle_task_focus(task_id: UUID, current_user_id: str = Depends(get_current_user)):
    """Toggles task status between PENDING and IN_PROGRESS (Deep Focus mode)."""
    res = db.table("tasks").select("*").eq("id", str(task_id)).eq("user_id", current_user_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found or not yours")
    task = res.data[0]
    
    if task["status"] not in ["PENDING", "IN_PROGRESS"]:
        raise HTTPException(status_code=400, detail=f"Cannot toggle focus on task with status {task['status']}")
        
    new_status = "IN_PROGRESS" if task["status"] == "PENDING" else "PENDING"
    now_ist = datetime.now(IST).isoformat()
    
    update_res = db.table("tasks").update({"status": new_status, "updated_at": now_ist}).eq("id", str(task_id)).execute()
    updated = update_res.data[0] if (update_res.data and len(update_res.data) > 0) else {**task, "status": new_status, "updated_at": now_ist}
    
    user_res = db.table("users").select("display_name").eq("id", current_user_id).execute()
    updated["user_name"] = user_res.data[0].get("display_name", "Operative") if user_res.data else "Operative"
    
    gid = updated.get("goal_id")
    if gid:
        goal_res = db.table("goals").select("title").eq("id", str(gid)).execute()
        if goal_res.data:
            raw_t = goal_res.data[0].get("title") or ""
            updated["goal_title"] = raw_t[10:] if raw_t.startswith("[PRIVATE] ") else raw_t
        else:
            updated["goal_title"] = None
    else:
        updated["goal_title"] = None

    focus_durations = get_tasks_focus_durations(current_user_id)
    mins = focus_durations.get(str(task_id), 0)
    updated["tracked_timer_minutes"] = mins
    updated["tracked_timer_hours"] = round(mins / 60.0, 1) if mins > 0 else 0.0
        
    return TaskBase(**updated)

@router.delete("/{task_id}")
async def delete_task(task_id: UUID, current_user_id: str = Depends(get_current_user)):
    """Allows task owner to delete/cancel a pending task. Active bounties on it are refunded to issuers."""
    res = db.table("tasks").select("*").eq("id", str(task_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found")
    task = res.data[0]
    
    if str(task["user_id"]) != current_user_id:
        raise HTTPException(status_code=403, detail="You can only delete your own tasks")
        
    if task["status"] == "COMPLETED":
        raise HTTPException(status_code=400, detail="Cannot delete an already completed task")

    # Refund active bounties on this task to their issuers
    bounties_res = db.table("bounties").select("id, issuer_id, points_at_stake").eq("target_task_id", str(task_id)).eq("status", "ACTIVE").execute()
    for b in (bounties_res.data or []):
        issuer_id = str(b["issuer_id"])
        pts = int(b.get("points_at_stake", 0))
        u_res = db.table("users").select("total_lifetime_points").eq("id", issuer_id).execute()
        if u_res.data:
            current_pts = u_res.data[0].get("total_lifetime_points", 0)
            db.table("users").update({"total_lifetime_points": current_pts + pts}).eq("id", issuer_id).execute()
        db.table("bounties").delete().eq("id", str(b["id"])).execute()

    # Delete the task
    db.table("tasks").delete().eq("id", str(task_id)).execute()
    return {"message": "Task deleted successfully and active bounties refunded", "task_id": str(task_id)}

@router.patch("/{task_id}/abandon", response_model=TaskBase)
async def abandon_task(task_id: UUID, current_user_id: str = Depends(get_current_user)):
    """Marks a pending or in-progress task as ABANDONED and refunds any active bounties."""
    res = db.table("tasks").select("*").eq("id", str(task_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Task not found")
    task = res.data[0]
    
    if str(task["user_id"]) != current_user_id:
        raise HTTPException(status_code=403, detail="You can only abandon your own tasks")
        
    if task["status"] not in ["PENDING", "IN_PROGRESS"]:
        raise HTTPException(status_code=400, detail=f"Cannot abandon task with status {task['status']}")

    now_ist = datetime.now(IST).isoformat()
    # Refund active bounties
    bounties_res = db.table("bounties").select("id, issuer_id, points_at_stake").eq("target_task_id", str(task_id)).eq("status", "ACTIVE").execute()
    for b in (bounties_res.data or []):
        issuer_id = str(b["issuer_id"])
        pts = int(b.get("points_at_stake", 0))
        u_res = db.table("users").select("total_lifetime_points").eq("id", issuer_id).execute()
        if u_res.data:
            current_pts = u_res.data[0].get("total_lifetime_points", 0)
            db.table("users").update({"total_lifetime_points": current_pts + pts}).eq("id", issuer_id).execute()
        db.table("bounties").delete().eq("id", str(b["id"])).execute()

    updated = {
        "status": "ABANDONED",
        "updated_at": now_ist
    }
    update_res = db.table("tasks").update(updated).eq("id", str(task_id)).execute()
    abandoned_data = update_res.data[0] if (update_res.data and len(update_res.data) > 0) else {**task, **updated}
    
    user_res = db.table("users").select("display_name").eq("id", current_user_id).execute()
    abandoned_data["user_name"] = user_res.data[0].get("display_name", "Operative") if user_res.data else "Operative"
    gid = abandoned_data.get("goal_id")
    if gid:
        goal_res = db.table("goals").select("title").eq("id", str(gid)).execute()
        if goal_res.data:
            raw_t = goal_res.data[0].get("title") or ""
            abandoned_data["goal_title"] = raw_t[10:] if raw_t.startswith("[PRIVATE] ") else raw_t
        else:
            abandoned_data["goal_title"] = None
    else:
        abandoned_data["goal_title"] = None

    focus_durations = get_tasks_focus_durations(current_user_id)
    mins = focus_durations.get(str(task_id), 0)
    abandoned_data["tracked_timer_minutes"] = mins
    abandoned_data["tracked_timer_hours"] = round(mins / 60.0, 1) if mins > 0 else 0.0

    return TaskBase(**abandoned_data)
