"""Constantes compartidas para el dominio de usuarios."""

from enum import Enum


class UserRole(str, Enum):
    """Roles permitidos para los usuarios del sistema."""

    USER = "usuario"
    ADMIN = "administrador"


ALLOWED_USER_ROLES = {role.value for role in UserRole}
