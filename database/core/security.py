"""Utilidades de seguridad para contraseñas y JWT."""

import os
from datetime import datetime, timedelta, timezone
from typing import Any

from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext

JWT_SECRET = os.getenv("APP_JWT_SECRET", "secret-key")  # En
JWT_ALGORITHM = os.getenv("APP_JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("APP_JWT_EXPIRATION", "60"))

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hashea una contraseña usando bcrypt."""
    return _pwd_context.hash(password)


def verify_hash(password: str, password_hashed: str) -> bool:
    """Verifica una contraseña contra su hash."""
    return _pwd_context.verify(password, password_hashed)


def create_token(subject: str, jti: str | None = None) -> str:
    """Crea un JWT de acceso."""
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=JWT_EXPIRATION_MINUTES
    )

    payload = {
        "sub": subject,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    if jti:
        payload["jti"] = jti

    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """Decodifica un JWT."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except ExpiredSignatureError as exc:
        raise ValueError("⚠️ Token expirado") from exc
    except JWTError as exc:
        raise ValueError("❌ Token inválido") from exc


def is_jwt_error(exc: Exception) -> bool:
    """Indica si la excepción pertenece a JWT."""
    return isinstance(exc, JWTError)
