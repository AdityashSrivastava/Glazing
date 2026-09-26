import requests
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()
supabase: Client = create_client(os.environ.get("SUPABASE_URL"), os.environ.get("SUPABASE_KEY"))

res = supabase.auth.sign_in_with_password({"email": "adityash@glazing.com", "password": "password123"})
token = res.session.access_token

task_res = supabase.table("tasks").select("id").eq("status", "PENDING").execute()
if not task_res.data:
    print("No pending tasks!")
    exit()

task_id = task_res.data[0]["id"]
print("Using task_id:", task_id)

headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
data = {"target_task_id": task_id, "points_at_stake": 50}

try:
    r = requests.post("http://localhost:8000/api/bounties", json=data, headers=headers)
    print("POST /bounties status:", r.status_code)
    print("POST /bounties body:", r.text)
except Exception as e:
    print("Error:", e)
