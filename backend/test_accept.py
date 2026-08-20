import os
import requests
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

email = "riyansh.kul@gmail.com"
temp_password = "TestPassword123!"

print(f"Updating password for {email}...")
# Update user password using service_role admin client
supabase.auth.admin.update_user_by_id(
    "a2dcab72-8ce6-4273-90a1-fa10ad8a5933",
    attributes={"password": temp_password}
)
print("Password updated successfully.")

print("Logging in to get JWT token...")
# Log in with the updated password
session = supabase.auth.sign_in_with_password({
    "email": email,
    "password": temp_password
})

jwt_token = session.session.access_token
print(f"JWT Token: {jwt_token[:20]}...{jwt_token[-20:]}")

print("Sending POST request to /api/invitations/accept...")
headers = {
    "Authorization": f"Bearer {jwt_token}",
    "Content-Type": "application/json"
}

try:
    response = requests.post(
        "http://localhost:5000/api/invitations/accept",
        headers=headers,
        json={}
    )
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {response.headers}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
