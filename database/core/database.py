"""Configuración simple de base de datos para el backend."""

import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from sqlalchemy import Engine, create_engine, inspect, text
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")


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
            "Define it in your .env file with the PostgreSQL connection string."
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


def ensure_user_role_column(engine: Engine) -> None:
    """Agrega la columna role si la tabla users ya existía sin ese campo."""
    inspector = inspect(engine)

    if "users" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("users")}
    if "role" in columns:
        return

    with engine.begin() as connection:
        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'usuario'"
            )
        )


def ensure_products_new_columns(engine: Engine) -> None:
    """Agrega nuevas columnas de products si la tabla ya existía sin esos campos."""
    inspector = inspect(engine)

    if "products" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("products")}

    statements: list[str] = []

    if "resolucion_camara_principal" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN resolucion_camara_principal VARCHAR(80) NOT NULL DEFAULT 'N/A'"
        )

    if (
        "resolucion_camara_trasera" in columns
        and "resolucion_camara_frontal" not in columns
    ):
        statements.append(
            "ALTER TABLE products "
            "RENAME COLUMN resolucion_camara_trasera TO resolucion_camara_frontal"
        )
        columns.add("resolucion_camara_frontal")

    if "resolucion_camara_frontal" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN resolucion_camara_frontal VARCHAR(80) NOT NULL DEFAULT 'N/A'"
        )

    if "capacidad_carga_rapida" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN capacidad_carga_rapida VARCHAR(40) NOT NULL DEFAULT 'N/A'"
        )

    if "garantia_meses" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN garantia_meses INTEGER NOT NULL DEFAULT 0"
        )

    if "is_active" not in columns:
        statements.append(
            "ALTER TABLE products " "ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE"
        )

    if "is_featured" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE"
        )

    if "imagen_url" not in columns:
        statements.append("ALTER TABLE products ADD COLUMN imagen_url VARCHAR(500)")

    if "categoria" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN categoria VARCHAR(20) NOT NULL DEFAULT 'economico'"
        )

    if "color_variants" not in columns:
        statements.append(
            "ALTER TABLE products "
            "ADD COLUMN color_variants JSONB NOT NULL DEFAULT '[]'::jsonb"
        )

    if not statements:
        return

    with engine.begin() as connection:
        for stmt in statements:
            connection.execute(text(stmt))


def ensure_orders_invoice_columns(engine: Engine) -> None:
    """Agrega columnas de facturación/envío a orders si la tabla ya existía."""
    inspector = inspect(engine)

    if "orders" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("orders")}
    column_definitions = {
        "customer_name": "VARCHAR(200)",
        "customer_email": "VARCHAR(255)",
        "customer_phone": "VARCHAR(40)",
        "delivery_address": "VARCHAR(300)",
        "delivery_city": "VARCHAR(120)",
        "shipping_company": "VARCHAR(120)",
        "tracking_number": "VARCHAR(120)",
        "payment_provider": "VARCHAR(40)",
        "payment_method": "VARCHAR(80)",
        "paid_at": "TIMESTAMP",
        "cancelled_at": "TIMESTAMP",
        "cancellation_reason": "VARCHAR(300)",
        "invoice_pdf_path": "VARCHAR(500)",
        "invoice_email_sent_to": "VARCHAR(255)",
        "invoice_email_sent_at": "TIMESTAMP",
    }

    statements = [
        f"ALTER TABLE orders ADD COLUMN {name} {definition}"
        for name, definition in column_definitions.items()
        if name not in columns
    ]

    if not statements:
        return

    with engine.begin() as connection:
        for stmt in statements:
            connection.execute(text(stmt))

    if "order_items" in inspector.get_table_names():
        item_columns = {column["name"] for column in inspector.get_columns("order_items")}
        if "color_selected" not in item_columns:
            with engine.begin() as connection:
                connection.execute(
                    text("ALTER TABLE order_items ADD COLUMN color_selected VARCHAR(50)")
                )


def ensure_cart_items_session_column(engine: Engine) -> None:
    """Agrega la columna session_id a cart_items si no existe, y hace user_id nullable."""
    inspector = inspect(engine)

    if "cart_items" not in inspector.get_table_names():
        return

    columns = {column["name"] for column in inspector.get_columns("cart_items")}

    if "session_id" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE cart_items ADD COLUMN session_id VARCHAR(128)")
            )

    if "color_selected" not in columns:
        with engine.begin() as connection:
            connection.execute(
                text("ALTER TABLE cart_items ADD COLUMN color_selected VARCHAR(50) NOT NULL DEFAULT ''")
            )

    # Make user_id nullable to support anonymous cart sessions
    with engine.begin() as connection:
        try:
            connection.execute(
                text("ALTER TABLE cart_items ALTER COLUMN user_id DROP NOT NULL")
            )
        except Exception:
            pass

    with engine.begin() as connection:
        try:
            connection.execute(
                text("ALTER TABLE cart_items DROP CONSTRAINT uq_cart_items_user_product")
            )
        except Exception:
            pass

        try:
            connection.execute(
                text("ALTER TABLE cart_items DROP CONSTRAINT uq_cart_items_session_product")
            )
        except Exception:
            pass

        try:
            connection.execute(
                text(
                    "ALTER TABLE cart_items "
                    "ADD CONSTRAINT uq_cart_items_user_product_color "
                    "UNIQUE (user_id, product_id, color_selected)"
                )
            )
        except Exception:
            pass

        try:
            connection.execute(
                text(
                    "ALTER TABLE cart_items "
                    "ADD CONSTRAINT uq_cart_items_session_product_color "
                    "UNIQUE (session_id, product_id, color_selected)"
                )
            )
        except Exception:
            pass
