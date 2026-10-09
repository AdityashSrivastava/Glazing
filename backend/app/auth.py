from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import jwt
import os
from dotenv import load_dotenv
from app.database import db

import time

load_dotenv()

SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

_verified_users: set[str] = set()
# Fast token validation cache: token -> (user_id, expires_at_epoch)
_token_cache: dict[str, tuple[str, float]] = {}

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
    now = time.time()
    
    # 0. Check in-memory validation cache for instant zero-latency response
    cached = _token_cache.get(token)
    if cached:
        cached_user_id, cached_exp = cached
        if cached_exp > now:
            return cached_user_id
        else:
            _token_cache.pop(token, None)

    def _cache_user_token(u_id: str):
        # Determine remaining lifespan from token exp claim or max 300s
        ttl = 300.0
        try:
            unverified = jwt.decode(token, options={"verify_signature": False})
            if "exp" in unverified:
                exp_ts = float(unverified["exp"])
                if exp_ts > now:
                    ttl = min(ttl, exp_ts - now)
        except Exception:
            pass
        _token_cache[token] = (u_id, now + ttl)

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
                    _cache_user_token(user_id)
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
            _cache_user_token(user.id)
            return user.id
    except Exception as e:
        print(f"Supabase auth validation error: {e}")

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

from fastapi import Header

CRON_SECRET = os.getenv("CRON_SECRET", "")

async def verify_cron_secret_or_user(
    authorization: str | None = Header(None),
    x_cron_secret: str | None = Header(None, alias="X-Cron-Secret")
) -> str:
    # 1. Check if valid CRON_SECRET is provided via header
    if CRON_SECRET and x_cron_secret and x_cron_secret.strip() == CRON_SECRET.strip():
        return "system_cron"
    
    # 2. Check Authorization header
    if authorization:
        token = authorization
        if authorization.startswith("Bearer "):
            token = authorization[7:].strip()
        if CRON_SECRET and token.strip() == CRON_SECRET.strip():
            return "system_cron"
        # Validate as standard user JWT
        return await get_current_user(token)
        
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Unauthorized. Valid session token or X-Cron-Secret header required.",
        headers={"WWW-Authenticate": "Bearer"},
    )

