"""Configuración simple de base de datos para el backend."""

import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

DATABASE_URL = os.getenv( "DATABASE_URL","postgresql+psycopg://postgres:admin@localhost:5433/movil_dev")

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
        db.close()
