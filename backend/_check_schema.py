import os
import sys
from dotenv import load_dotenv
load_dotenv()
sys.path.insert(0, os.getcwd())
from app.database import get_engine
import sqlalchemy as sa
engine = get_engine()
conn = engine.connect()
for name in ['profiles','organizations','departments','attendance_sessions','attendance','invitations']:
    print(name, conn.execute(sa.text("select to_regclass('public.%s')" % name)).scalar())
print('uuid extension', conn.execute(sa.text("select extname from pg_extension where extname='uuid-ossp'" )).fetchall())
print('profiles cols', conn.execute(sa.text("select column_name from information_schema.columns where table_schema='public' and table_name='profiles' order by ordinal_position")).fetchall())
conn.close()
