from dotenv import load_dotenv
load_dotenv()
from app.database import db

def create_users():
    test_users = [
        {"email": "adityash@glazing.com", "password": "password123", "name": "Adityash"},
        {"email": "manas@glazing.com", "password": "password123", "name": "Manas"},
        {"email": "shivansh@glazing.com", "password": "password123", "name": "Shivansh"},
        {"email": "praveen@glazing.com", "password": "password123", "name": "Praveen"},
        {"email": "harshit@glazing.com", "password": "password123", "name": "Harshit"}
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
