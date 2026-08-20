"""
Cleanup script - deletes all INVITATION, STUDENT, and TEACHER records
so you can re-invite users from scratch. Safely skips the org_admin profile.
Run from the backend directory:  python cleanup_invitations.py
"""
import os, sys
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL', '')
if not DATABASE_URL:
    print('ERROR: DATABASE_URL not found in .env file.')
    sys.exit(1)

if DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
if DATABASE_URL.startswith('postgresql://'):
    DATABASE_URL = DATABASE_URL.replace('postgresql://', 'postgresql+psycopg://', 1)

from sqlalchemy import create_engine, text

engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

with engine.begin() as conn:
    r1 = conn.execute(text("DELETE FROM invitations"))
    print(f'Deleted {r1.rowcount} invitation(s)')

    r2 = conn.execute(text("DELETE FROM students"))
    print(f'Deleted {r2.rowcount} student record(s)')

    r3 = conn.execute(text("DELETE FROM teachers"))
    print(f'Deleted {r3.rowcount} teacher record(s)')

    # Only delete NON-admin profiles to avoid locking yourself out
    r4 = conn.execute(text("DELETE FROM profiles WHERE role != 'org_admin'"))
    print(f'Deleted {r4.rowcount} non-admin profile(s)')
    print('(Admin profile preserved)')

print()
print('Done! You can now re-invite users cleanly.')
