import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "").strip()
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "").strip() # Service Role Key for Admin Access

if not SUPABASE_URL or not SUPABASE_KEY:
    print("CRITICAL: Supabase credentials (SUPABASE_URL, SUPABASE_KEY) missing in environment.")
    if os.getenv("TESTING") == "1" or os.getenv("CI") == "1":
        SUPABASE_URL = "https://placeholder.supabase.co"
        SUPABASE_KEY = "placeholder"
    else:
        raise RuntimeError(
            "CRITICAL STARTUP CONFIG ERROR: SUPABASE_URL and SUPABASE_KEY must be configured in environment."
        )

# The backend client uses the Service Role Key to bypass RLS, ensuring it has authoritative
# read/write access. We enforce security manually via the JWT checking in auth.py.
db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
