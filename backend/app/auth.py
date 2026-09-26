from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
from dotenv import load_dotenv
from app.database import db

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

_verified_users: set[str] = set()

def ensure_user_record(user_id: str, email: str | None = None, display_name_hint: str | None = None):
    if user_id in _verified_users:
        return
    try:
        res = db.table("users").select("id").eq("id", user_id).execute()
        if not res.data:
            display_name = display_name_hint
            if not display_name:
                if email:
                    display_name = email.split("@")[0].capitalize()
                else:
                    display_name = "Operative"
            db.table("users").upsert({
                "id": user_id,
                "display_name": display_name,
                "total_lifetime_points": 0
            }).execute()
        _verified_users.add(user_id)
    except Exception as e:
        print(f"ensure_user_record error: {e}")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # 1. Try fast local decode if symmetric HS256
    if SUPABASE_JWT_SECRET:
        try:
            header = jwt.get_unverified_header(token)
            alg = header.get("alg")
            if alg in ["HS256", "HS384", "HS512"]:
                payload = jwt.decode(
                    token,
                    SUPABASE_JWT_SECRET,
                    algorithms=["HS256", "HS384", "HS512"],
                    options={"verify_aud": False}
                )
                user_id = payload.get("sub")
                if user_id:
                    ensure_user_record(user_id, payload.get("email"), payload.get("user_metadata", {}).get("display_name"))
                    return user_id
        except Exception:
            pass

    # 2. Authoritative Supabase validation (supports ES256, asymmetric keys, key rotation)
    try:
        user_res = db.auth.get_user(token)
        if user_res and user_res.user and user_res.user.id:
            user = user_res.user
            meta = user.user_metadata or {}
            display_name = meta.get("display_name")
            ensure_user_record(user.id, user.email, display_name)
            return user.id
    except Exception as e:
        print(f"Supabase auth validation error: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
