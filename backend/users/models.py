"""Modelo de usuario para la aplicación de movil-dev."""

from datetime import datetime
from typing import Any

from sqlalchemy import JSON, Boolean, DateTime, String, func
from sqlalchemy.orm import Mapped, mapped_column, validates

from database.core.database import Base


class User(Base):
    """Modelo de usuario que representa a un usuario en la base de datos."""

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    full_name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
    )

    hashed_password: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    auth_provider: Mapped[str] = mapped_column(
        String(20),
        default="local",
        nullable=False,
    )

    google_sub: Mapped[str | None] = mapped_column(
        String(255),
        unique=True,
        nullable=True,
        index=True,
    )

    avatar_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
        nullable=False,
    )

    purchase_history: Mapped[list[dict[str, str]]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    preferences: Mapped[dict[str, str]] = mapped_column(
        JSON,
        default=dict,
        nullable=False,
    )

    saved_articles: Mapped[list[dict[str, Any]]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    @property
    def has_password(self) -> bool:
        """Indica si la cuenta ya tiene contraseña local configurada."""
        return bool(self.hashed_password)

    @validates("email")
    def _normalize_email(self, _: str, value: str) -> str:
        email = value.strip().lower()
        if not email:
            raise ValueError("El email es obligatorio.")
        return email

    @validates("full_name")
    def _normalize_full_name(self, _: str, value: str) -> str:
        name = value.strip()
        if not name:
            raise ValueError("El nombre es obligatorio.")
        return name
