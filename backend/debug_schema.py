import os, sys
from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, os.getcwd())
from app.database import get_engine
import sqlalchemy as sa
engine = get_engine()
conn = engine.connect()
for name in ['profiles','organizations','departments','courses','teachers','students','attendance_sessions','attendance','leave_requests','audit_logs','invitations']:
    try:
        res = conn.execute(sa.text("SELECT to_regclass('public.%s')" % name)).scalar()
        print(name, '=>', res)
    except Exception as exc:
        print(name, 'ERROR', exc)
print('uuid extension')
for row in conn.execute(sa.text("SELECT extname FROM pg_extension WHERE extname='uuid-ossp'")):
    print(row)
print('profiles columns')
for row in conn.execute(sa.text("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' ORDER BY ordinal_position")):
    print(row)
conn.close()
