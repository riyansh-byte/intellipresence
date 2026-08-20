import os, requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
email = "omegaeditz962@gmail.com"

# Check user in Supabase auth.users
users = supabase.auth.admin.list_users()
target = None
for u in users:
    if u.email == email:
        target = u
        break

if not target:
    print(f"USER {email} NOT FOUND IN SUPABASE AUTH!")
else:
    print(f"FOUND SUPABASE USER: id={target.id}, email={target.email}")
    # Reset password to test sign in
    supabase.auth.admin.update_user_by_id(target.id, {"password": "TestPassword123!"})
    print("Password set to TestPassword123!")

    # Sign in
    session = supabase.auth.sign_in_with_password({"email": email, "password": "TestPassword123!"})
    jwt = session.session.access_token
    print("JWT token obtained!")

    # Call backend /api/auth/me
    res = requests.get("http://localhost:5000/api/auth/me", headers={"Authorization": f"Bearer {jwt}"})
    print(f"Backend /api/auth/me Status Code: {res.status_code}")
    print(f"Backend Response Body: {res.text}")
