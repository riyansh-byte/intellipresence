import os, requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
email = "omegaeditz962@gmail.com"

# Check Supabase user
try:
    session = supabase.auth.sign_in_with_password({"email": email, "password": "TestPassword123!"})
    print("Sign in successful for TestPassword123!")
    jwt = session.session.access_token
    res = requests.get("http://localhost:5000/api/auth/me", headers={"Authorization": f"Bearer {jwt}"})
    print(f"Backend Status: {res.status_code}")
    print(f"Backend Body: {res.text}")
except Exception as e:
    print("Sign in failed:", e)
