import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()
url = os.getenv('DATABASE_URL','')
if url.startswith('postgres://'): url = url.replace('postgres://','postgresql://',1)
if url.startswith('postgresql://'): url = url.replace('postgresql://','postgresql+psycopg://',1)
engine = create_engine(url, pool_pre_ping=True, future=True)

with engine.connect() as conn:
    p = conn.execute(text("SELECT id, email, role, is_active FROM profiles WHERE email = 'riyansh.kul@gmail.com'")).fetchone()
    print('Profile:', p)
    s = conn.execute(text("SELECT id, email, roll_number FROM students WHERE email = 'riyansh.kul@gmail.com'")).fetchone()
    print('Student:', s)
    i = conn.execute(text("SELECT id, email, role, status FROM invitations WHERE email = 'riyansh.kul@gmail.com'")).fetchone()
    print('Invitation:', i)
