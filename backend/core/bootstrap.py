"""Startup/bootstrap utilities for the FastAPI application."""

from __future__ import annotations

from sqlalchemy import Engine

from core.settings import Settings
from database.core.database import (
    Base,
    ensure_cart_items_session_column,
    ensure_orders_invoice_columns,
    ensure_products_new_columns,
    ensure_user_role_column,
)


def initialize_database_schema(engine: Engine) -> None:
    """Initialize and patch schema for compatibility with existing deployments."""
    if not Settings.auto_apply_schema_changes:
        return

    Base.metadata.create_all(bind=engine)
    ensure_user_role_column(engine)
    ensure_products_new_columns(engine)
    ensure_orders_invoice_columns(engine)
    ensure_cart_items_session_column(engine)
