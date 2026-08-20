from flask import g
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.config.settings import Config

_engine = None
_SessionLocal = None


def _normalize_database_url(database_url):
    """Make Supabase/Postgres URLs friendly to SQLAlchemy."""
    if database_url and database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql://", 1)
    if database_url and database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    return database_url


def get_engine():
    global _engine, _SessionLocal

    if _engine is None:
        database_url = _normalize_database_url(Config.DATABASE_URL)
        if not database_url:
            raise RuntimeError("DATABASE_URL is not configured")

        _engine = create_engine(
            database_url,
            pool_pre_ping=True,
            future=True,
        )
        _SessionLocal = sessionmaker(
            bind=_engine,
            autoflush=False,
            autocommit=False,
            expire_on_commit=False,
            future=True,
        )

    return _engine


def get_db():
    if "db" not in g:
        get_engine()
        g.db = _SessionLocal()
    return g.db


def close_db(error=None):
    db = g.pop("db", None)
    if db is None:
        return

    if error is not None:
        db.rollback()
    db.close()


def init_db(app):
    app.teardown_appcontext(close_db)
