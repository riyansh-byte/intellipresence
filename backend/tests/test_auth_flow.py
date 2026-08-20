import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from app import create_app


def test_healthz():
    app = create_app()
    app.testing = True
    client = app.test_client()
    resp = client.get('/healthz')
    assert resp.status_code == 200
