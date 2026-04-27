"""Schemas para la autenticación de usuarios."""

from pydantic import BaseModel, EmailStr, Field
from users.constants import UserRole
from users.schemas import UserResponse


class UserLogin(BaseModel):
    """Modelo para el login de un usuario."""

    email: EmailStr
    password: str = Field(..., min_length=8, max_length=200)


class TokenResponse(BaseModel):
    """Modelo de respuesta con eltoken de acceso."""

    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class GoogleLoginRequest(BaseModel):
    """Modelo para login con Google mediante ID token."""

    id_token: str = Field(..., min_length=20)


class ForgotPasswordRequest(BaseModel):
    """Solicitud para recuperación de contraseña."""

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    """Solicitud para actualizar la contraseña con token de recuperación."""

    token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=200)


class MessageResponse(BaseModel):
    """Respuesta simple para acciones de autenticación."""

    message: str


class RegisterRequest(BaseModel):
    """Modelo para el registro de un nuevo usuario."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=200, examples=["usuario123"])
    full_name: str = Field(..., min_length=2, max_length=200, examples=["Juan Pérez"])
    role: UserRole = Field(default=UserRole.USER, examples=["usuario"])


class SetPasswordRequest(BaseModel):
    """Solicitud para agregar o cambiar una contraseña."""

    new_password: str = Field(..., min_length=8, max_length=200)
    current_password: str | None = Field(default=None, min_length=8, max_length=200)


class ShippingProfileRequest(BaseModel):
    """Datos de envio guardados en el perfil del usuario."""

    receiver_name: str = Field(..., min_length=2, max_length=200)
    phone: str = Field(..., min_length=7, max_length=30)
    address: str = Field(..., min_length=4, max_length=300)
    city: str = Field(..., min_length=2, max_length=120)
