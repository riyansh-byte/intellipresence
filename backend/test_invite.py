"""
Tests the pure Supabase invite flow.
Run: .\\venv\\Scripts\\python.exe test_invite.py test_teacher@gmail.com
"""
import sys
import os
from dotenv import load_dotenv

load_dotenv()

email = sys.argv[1] if len(sys.argv) > 1 else "test_teacher@gmail.com"

from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
APP_URL = os.getenv("NEXT_PUBLIC_APP_URL", "http://localhost:3000")

print(f"Supabase URL : {SUPABASE_URL}")
print(f"Testing for  : {email}")
print("-" * 60)

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

email_sent = False
invite_link = None

# Step 1: Attempt to send invite email via Supabase Auth
try:
    print("\n[STEP 1] Calling invite_user_by_email...")
    result = supabase.auth.admin.invite_user_by_email(
        email.lower(),
        options={
            "data": {
                "organization_id": "test_org_id",
                "role": "teacher",
                "invitation_id": "test_inv_id"
            },
            "redirect_to": f"{APP_URL}/auth/callback"
        }
    )
    email_sent = True
    print("  SUCCESS! Supabase accepted email invitation request.")
    invite_link = getattr(result.user, "action_link", None)
    print(f"  Action Link (from invite response): {invite_link}")
except Exception as e:
    print(f"  FAILED: {e}")

# Step 2: Fallback generate_link (just to get the link for copy/paste UI option)
if not invite_link:
    try:
        print("\n[STEP 2] Fallback: Generating manual link via generate_link...")
        result_link = supabase.auth.admin.generate_link({
            "type": "invite",
            "email": email.lower(),
            "options": {
                "data": {
                    "organization_id": "test_org_id",
                    "role": "teacher",
                    "invitation_id": "test_inv_id"
                },
                "redirect_to": f"{APP_URL}/auth/callback"
            }
        })
        invite_link = getattr(getattr(result_link, "properties", None), "action_link", None)
        print(f"  SUCCESS! Link generated: {invite_link}")
    except Exception as ex:
        print(f"  FAILED: {ex}")

print("\n" + "-" * 60)
print(f"Final status: email_sent={email_sent}, invite_link={'Present' if invite_link else 'None'}")
print("Done.")
