"""Configuración simple de base de datos para el backend."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

_raw_url = os.getenv("DATABASE_URL")
if not _raw_url:
    raise RuntimeError(
        "DATABASE_URL environment variable is not set. "
        "Please configure it with the PostgreSQL connection string."
    )
# Railway provides postgresql:// URLs; psycopg3 requires postgresql+psycopg://
DATABASE_URL = _raw_url.replace("postgresql://", "postgresql+psycopg://", 1)

class Base(DeclarativeBase):
    """Base declarativa de SQLAlchemy."""


engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    class_=Session,
)


def get_db():
    """Entrega una sesión de base de datos por request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
