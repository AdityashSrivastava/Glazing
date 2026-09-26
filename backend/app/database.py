import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "") # Service Role Key for Admin Access

if not SUPABASE_URL or not SUPABASE_KEY:
    print("WARNING: Supabase credentials missing in .env")

# The backend client uses the Service Role Key to bypass RLS, ensuring it has authoritative
# read/write access. We enforce security manually via the JWT checking in auth.py.
db: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
