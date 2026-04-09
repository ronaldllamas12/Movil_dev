"""Módulo de dependencias de autenticación para FastAPI."""

from auth.services import is_token_revoked
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from users.models import User

from database.core.database import get_db
from database.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from database.core.security import decode_token, is_jwt_error

# USUARIO ACTUAL (DEPENDENCY)
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
):
    """Dependency para obtener el usuario autenticado a partir del token JWT en la request."""
    token = credentials.credentials
    # Extrae el token del esquema Bearer

    if not token:
        raise UnauthorizedError("Token no proporcionado.")

    try:
        payload = decode_token(token)
    except Exception as exc:
        if is_jwt_error(exc):
            raise UnauthorizedError("Token inválido.") from exc
        raise

    jti = payload.get("jti")  # Extrae el JTI (ID del token) del payload del token
    sub = payload.get("sub")  # Extrae el subject (ID del usuario) del payload del token

    if not jti or not sub:
        raise UnauthorizedError("Token inválido.")

    if is_token_revoked(db, jti):
        raise UnauthorizedError("Token revocado.")

    user = db.get(User, int(sub))  # Consulta la base de datos para obtener el usuario

    if not user:
        raise NotFoundError("Usuario no encontrado.")

    if not user.is_active:
        raise ForbiddenError("Usuario inactivo.")

    return user
