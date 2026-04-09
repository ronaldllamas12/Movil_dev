"""Configuración simple de base de datos para el backend."""

import os
from typing import Optional

from sqlalchemy import Engine, create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker


class Base(DeclarativeBase):
    """Base declarativa de SQLAlchemy."""


# Module-level cache — populated on first access, never at import time.
_engine: Optional[Engine] = None
_SessionLocal: Optional[sessionmaker] = None


def _get_database_url() -> str:
    """Read and validate DATABASE_URL from the environment.

    Called lazily so that the variable is guaranteed to be present by the
    time the engine is first created (e.g. after Railway injects env vars).
    """
    raw_url = os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError(
            "DATABASE_URL environment variable is not set. "
            "Please configure it with the PostgreSQL connection string."
        )
    # Railway provides postgresql:// URLs; psycopg3 requires postgresql+psycopg://
    return raw_url.replace("postgresql://", "postgresql+psycopg://", 1)


def get_engine() -> Engine:
    """Return the SQLAlchemy engine, creating it on the first call."""
    global _engine
    if _engine is None:
        _engine = create_engine(
            _get_database_url(),
            pool_pre_ping=True,
        )
    return _engine


def get_session_local() -> sessionmaker:
    """Return the sessionmaker factory, creating it on the first call."""
    global _SessionLocal
    if _SessionLocal is None:
        _SessionLocal = sessionmaker(
            bind=get_engine(),
            autocommit=False,
            autoflush=False,
            class_=Session,
        )
    return _SessionLocal


def get_db():
    """Entrega una sesión de base de datos por request."""
    db = get_session_local()()
    try:
        yield db
    finally:
        db.close()
