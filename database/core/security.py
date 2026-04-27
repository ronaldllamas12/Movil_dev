"""Utilidades de seguridad para contraseñas y JWT."""

import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from jose import ExpiredSignatureError, JWTError, jwt
from passlib.context import CryptContext

PROJECT_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(PROJECT_ROOT / ".env")

JWT_SECRET = os.getenv("APP_JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("APP_JWT_SECRET debe estar configurado en el entorno.")

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
