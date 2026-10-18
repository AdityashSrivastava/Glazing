from dotenv import load_dotenv
load_dotenv()
from app.database import db

import os

def create_users():
    default_pwd = os.getenv("BOOTSTRAP_OPERATIVE_PASSWORD")
    if not default_pwd:
        raise ValueError(
            "BOOTSTRAP_OPERATIVE_PASSWORD environment variable is required to run user bootstrap. "
            "Please set a strong temporary password in your environment."
        )
    test_users = [
        {"email": "adityash@glazing.com", "password": default_pwd, "name": "Adityash"},
        {"email": "manas@glazing.com", "password": default_pwd, "name": "Manas"},
        {"email": "shivansh@glazing.com", "password": default_pwd, "name": "Shivansh"},
        {"email": "praveen@glazing.com", "password": default_pwd, "name": "Praveen"},
        {"email": "harshit@glazing.com", "password": default_pwd, "name": "Harshit"}
    ]
    
    for u in test_users:
        try:
            res = db.auth.admin.create_user({
                "email": u["email"],
                "password": u["password"],
                "email_confirm": True
            })
            user_id = res.user.id
            
            # Also insert into the public.users table!
            db.table("users").upsert({
                "id": user_id,
                "display_name": u["name"],
                "total_lifetime_points": 0
            }).execute()
            
            print(f"Created user {u['name']} ({u['email']}) successfully!")
        except Exception as e:
            print(f"Failed to create {u['name']}: {e}")

if __name__ == "__main__":
    create_users()
