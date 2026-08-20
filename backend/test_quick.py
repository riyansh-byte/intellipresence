import os, requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
email = "omegaeditz962@gmail.com"

try:
    session = supabase.auth.sign_in_with_password({"email": email, "password": "TestPassword123!"})
    print("Login succeeded. Token:", session.session.access_token[:50] + "...")
    print("User role from metadata:", session.user.user_metadata)
except Exception as e:
    print("Login FAILED:", type(e).__name__, str(e))
