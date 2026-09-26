import uuid
from datetime import datetime, timezone, timedelta
from dotenv import load_dotenv
load_dotenv()
from app.database import db

IST = timezone(timedelta(hours=5, minutes=30))
now_ist = datetime.now(IST).isoformat()

user_id = "f6f05a5a-8b85-4428-b80c-26466f272a5a" # we'll get a real user first
users_res = db.table("users").select("id").execute()
if users_res.data:
    user_id = users_res.data[0]["id"]
    
# Create a dummy task
task_id = str(uuid.uuid4())
task_res = db.table("tasks").insert({
    "id": task_id,
    "user_id": user_id,
    "title": "Dummy task",
    "estimated_hours": 1,
    "status": "PENDING"
}).execute()

print("Created Task:", task_id)

new_bounty = {
    "issuer_id": user_id,
    "target_task_id": task_id,
    "points_at_stake": 50,
    "status": "ACTIVE",
    "created_at": now_ist
}

try:
    res = db.table("bounties").insert(new_bounty).execute()
    print("Bounty created:", res.data)
except Exception as e:
    print("Failed to create bounty:", e)
