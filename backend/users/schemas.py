"""Schemas para la gestión de usuarios."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    """Modelo para crear un nuevo usuario."""

    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=50)


class UserUpdate(BaseModel):
    """Modelo para actualizar un usuario."""

    full_name: str | None = Field(default=None, min_length=2, max_length=200)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None


class UserResponse(BaseModel):
    """Modelo para la respuesta de un usuario."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    full_name: str
    is_active: bool
    auth_provider: str
    google_sub: str | None = None
    avatar_url: str | None = None
    has_password: bool = False
    purchase_history: list[dict[str, Any]] = Field(default_factory=list)
    preferences: dict[str, Any] = Field(default_factory=dict)
    saved_articles: list[dict[str, Any]] = Field(default_factory=list)
    created_at: datetime
