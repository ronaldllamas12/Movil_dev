"""Módulo de dependencias de autenticación para FastAPI."""

from auth.services import is_token_revoked
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from users.constants import UserRole
from users.models import User

from database.core.database import get_db
from database.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from database.core.security import decode_token, is_jwt_error

# USUARIO ACTUAL (DEPENDENCY)
security = HTTPBearer(auto_error=False)
optional_security = HTTPBearer(auto_error=False)

AUTH_COOKIE_NAME = "access_token"


def _extract_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
    *,
    required: bool = True,
) -> str | None:
    """Extrae el token JWT desde el header Authorization o la cookie httpOnly."""
    if credentials and credentials.credentials:
        return credentials.credentials

    cookie_token = request.cookies.get(AUTH_COOKIE_NAME)
    if cookie_token:
        return cookie_token

    if required:
        raise UnauthorizedError("Token no proporcionado.")
    return None


def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
):
    """Dependency para obtener el usuario autenticado a partir del token JWT en la request."""
    token = _extract_token(request, credentials, required=True)

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


def get_current_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency para exigir que el usuario autenticado sea administrador."""
    if current_user.role != UserRole.ADMIN.value:
        raise ForbiddenError("Solo un administrador puede realizar esta acción.")
    return current_user


def get_optional_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(optional_security),
    db: Session = Depends(get_db),
) -> User | None:
    """Obtiene el usuario autenticado si existe token válido, de lo contrario None."""
    token = _extract_token(request, credentials, required=False)
    if not token:
        return None

    try:
        payload = decode_token(token)
    except Exception as exc:
        if is_jwt_error(exc):
            return None
        raise

    jti = payload.get("jti")
    sub = payload.get("sub")

    if not jti or not sub:
        return None

    if is_token_revoked(db, jti):
        return None

    user = db.get(User, int(sub))
    if not user or not user.is_active:
        return None

    return user
