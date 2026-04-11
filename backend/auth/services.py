"""Módulo de servicios para autenticación, manejo de tokens y autorización."""

import os
from datetime import datetime, timedelta, timezone
from secrets import token_urlsafe
from uuid import uuid4

from auth.models import PasswordResetToken, RevokedToken
from fastapi import HTTPException
from google.auth.transport.requests import Request as GoogleRequest
from google.oauth2 import id_token as google_id_token
from sqlalchemy import select
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ForbiddenError, UnauthorizedError
from database.core.security import (
    JWT_EXPIRATION_MINUTES,
    create_token,
    decode_token,
    hash_password,
    is_jwt_error,
    verify_hash,
)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# AUTENTICACIÓN


def authenticate_user(db: Session, email: str, password: str) -> User:
    """Valida credenciales y estado del usuario."""
    user = db.scalar(
        select(User).where(User.email == email.lower().strip())
    )  # Asegura que el email se busque en minúsculas y sin espacios

    if not user:
        raise HTTPException(status_code=422, detail="Credenciales inválidas.")

    if not user.hashed_password:
        raise HTTPException(
            status_code=422,
            detail=(
                "Esta cuenta fue creada con Google. Inicia sesión con Google y agrega "
                "una contraseña desde tu perfil."
            ),
        )

    if not verify_hash(password, user.hashed_password):
        raise HTTPException(status_code=422, detail="Credenciales inválidas.")

    if not user.is_active:
        raise ForbiddenError("Usuario inactivo.")

    return user


def verify_google_id_token(id_token: str) -> dict[str, object]:
    """Verifica el ID token de Google y retorna sus claims principales."""
    if not GOOGLE_CLIENT_ID:
        raise UnauthorizedError(
            "Google OAuth no está configurado. Define la variable de entorno GOOGLE_CLIENT_ID."
        )

    try:
        payload = google_id_token.verify_oauth2_token(
            id_token,
            GoogleRequest(),
            GOOGLE_CLIENT_ID,
        )
    except ValueError as exc:
        raise UnauthorizedError("El token de Google no es válido.") from exc

    if not payload.get("email") or not payload.get("email_verified"):
        raise UnauthorizedError("La cuenta de Google no tiene un email verificado.")

    return payload


def authenticate_google_user(db: Session, id_token: str) -> User:
    """Autentica o crea un usuario a partir de un token de Google."""
    payload = verify_google_id_token(id_token)
    email = payload["email"].lower().strip()
    google_sub = str(payload["sub"])

    user = db.scalar(select(User).where(User.google_sub == google_sub))

    if not user:
        user = db.scalar(select(User).where(User.email == email))

    if not user:
        user = User(
            email=email,
            full_name=(payload.get("name") or email.split("@")[0]).strip(),
            hashed_password=None,
            auth_provider="google",
            google_sub=google_sub,
            avatar_url=payload.get("picture"),
            is_active=True,
            purchase_history=[],
            preferences={},
            saved_articles=[],
        )
        db.add(user)
    else:
        user.full_name = (payload.get("name") or user.full_name).strip()
        user.avatar_url = payload.get("picture") or user.avatar_url
        user.google_sub = google_sub
        user.auth_provider = "hybrid" if user.hashed_password else "google"

    if not user.is_active:
        raise ForbiddenError("Usuario inactivo.")

    db.commit()
    db.refresh(user)

    return user


# CREACIÓN DE TOKEN


def create_token_for_user(user: User) -> tuple[str, str, datetime]:
    """Genera token JWT y retorna token, jti y expiración."""

    jti = uuid4().hex
    expire = datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRATION_MINUTES)

    token = create_token(
        subject=str(user.id),
        jti=jti,
    )

    return token, jti, expire


# REVOCACIÓN


def revoke_token(db: Session, jti: str, expires_at: datetime) -> None:
    """Guarda un token revocado."""
    revoked = RevokedToken(
        jti=jti, expires_at=expires_at
    )  # Crea una instancia de RevokedToken con el jti y la fecha de expiración
    db.add(revoked)
    db.commit()


def is_token_revoked(db: Session, jti: str) -> bool:
    """Verifica si un token fue revocado."""
    return bool(
        db.scalar(select(RevokedToken).where(RevokedToken.jti == jti))
    )  # Consulta la base de datos para verificar si el jti del token está presente en la tabla de tokens revocados


# EXTRAER DATA DEL TOKEN


def extract_token_data(token: str) -> tuple[str, datetime]:
    """Extrae jti y expiración desde el JWT."""

    try:
        payload = decode_token(token)
    except Exception as exc:  # noqa: BLE001
        if is_jwt_error(exc):
            raise UnauthorizedError("Token inválido.") from exc
        raise

    jti = payload.get("jti")
    exp = payload.get("exp")

    if not jti or not exp:
        raise UnauthorizedError("Token inválido.")

    expires_at = datetime.fromtimestamp(exp, tz=timezone.utc)

    return jti, expires_at


def register_user(db: Session, email: str, password: str, full_name: str) -> User:
    email = email.lower().strip()

    # Verificar si ya existe
    existing_user = db.scalar(select(User).where(User.email == email))

    if existing_user:
        raise UnauthorizedError("El usuario ya existe.")

    # Crear usuario
    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        auth_provider="local",
        google_sub=None,
        avatar_url=None,
        is_active=True,
        purchase_history=[],
        preferences={},
        saved_articles=[],
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


def create_password_reset_token(db: Session, email: str) -> str:
    """Genera un token temporal para restablecer contraseña."""
    user = db.scalar(select(User).where(User.email == email.lower().strip()))

    if not user:
        raise UnauthorizedError("No existe un usuario con ese email.")

    if not user.hashed_password:
        raise UnauthorizedError(
            "Esta cuenta usa Google. Inicia sesión con Google y agrega una contraseña desde tu perfil."
        )

    token = token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=30)

    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used.is_(False),
    ).update({"used": True})

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
        used=False,
    )
    db.add(reset_token)
    db.commit()

    return token


def reset_password(db: Session, token: str, new_password: str) -> None:
    """Actualiza la contraseña a partir de un token de recuperación."""
    reset_token = db.scalar(
        select(PasswordResetToken).where(PasswordResetToken.token == token)
    )

    if not reset_token or reset_token.used:
        raise UnauthorizedError("El token de recuperación no es válido.")

    expires_at = reset_token.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)

    if expires_at < datetime.now(timezone.utc):
        raise UnauthorizedError("El token de recuperación ya expiró.")

    user = db.get(User, reset_token.user_id)
    if not user:
        raise UnauthorizedError("Usuario no encontrado para este token.")

    user.hashed_password = hash_password(new_password)
    user.auth_provider = "hybrid" if user.google_sub else "local"
    reset_token.used = True
    db.commit()


def set_user_password(
    db: Session,
    user: User,
    new_password: str,
    current_password: str | None = None,
) -> User:
    """Agrega o actualiza la contraseña de un usuario autenticado."""
    if user.hashed_password:
        if not current_password:
            raise UnauthorizedError("Debes enviar tu contraseña actual.")
        if not verify_hash(current_password, user.hashed_password):
            raise UnauthorizedError("La contraseña actual no es correcta.")

    user.hashed_password = hash_password(new_password)
    user.auth_provider = "hybrid" if user.google_sub else "local"
    db.commit()
    db.refresh(user)
    return user
