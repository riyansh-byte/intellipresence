import os, requests
from dotenv import load_dotenv
from supabase import create_client
load_dotenv()
supabase = create_client(os.getenv('SUPABASE_URL'), os.getenv('SUPABASE_SERVICE_ROLE_KEY'))
session = supabase.auth.sign_in_with_password({'email': 'riyansh.kul@gmail.com', 'password': 'TestPassword123!'})
token = session.session.access_token
r = requests.get('http://localhost:5000/api/auth/me', headers={'Authorization': f'Bearer {token}'})
print('GET /auth/me Status:', r.status_code)
import json; data = r.json(); print('role:', data.get('data',{}).get('profile',{}).get('role'), '| active:', data.get('data',{}).get('profile',{}).get('is_active'))
