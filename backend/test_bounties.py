from dotenv import load_dotenv
load_dotenv()
from app.database import db

try:
    res = db.table("bounties").select("*").execute()
    print("Bounties:", res.data)
except Exception as e:
    print("Error:", e)
