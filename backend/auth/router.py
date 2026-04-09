"""Rutas de autenticación."""

from auth.dependencies import get_current_user
from auth.schemas import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SetPasswordRequest,
    TokenResponse,
    UserLogin,
)
from auth.services import (
    authenticate_google_user,
    authenticate_user,
    create_password_reset_token,
    create_token_for_user,
    extract_token_data,
    register_user,
    reset_password,
    revoke_token,
    set_user_password,
)
from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.orm import Session
from users.models import User
from users.schemas import UserResponse

from database.core.database import get_db
from database.core.errors import UnauthorizedError

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Registra un nuevo usuario."""
    user = register_user(db, payload.email, payload.password, payload.full_name)

    return UserResponse.model_validate(user, from_attributes=True)


# LOGIN
@router.post("/login", response_model=TokenResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    """Autentica usuario y retorna JWT."""
    if payload.email.strip() == "" or payload.password.strip() == "":
        raise UnauthorizedError("Email y contraseña no pueden estar vacíos.")

    user = authenticate_user(db, payload.email, payload.password)
    token, _, _ = create_token_for_user(user)

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user, from_attributes=True),
    )


@router.post("/google", response_model=TokenResponse)
def login_with_google(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """Autentica un usuario usando Google OAuth y retorna JWT propio."""
    user = authenticate_google_user(db, payload.id_token)
    token, _, _ = create_token_for_user(user)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user, from_attributes=True),
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Genera un token temporal para recuperación de contraseña."""
    token = create_password_reset_token(db, payload.email)
    return MessageResponse(message=f"Token de recuperación generado: {token}")


@router.post("/reset-password", response_model=MessageResponse)
def update_password(
    payload: ResetPasswordRequest,
    db: Session = Depends(get_db),
):
    """Restablece la contraseña usando un token temporal."""
    reset_password(db, payload.token, payload.new_password)
    return MessageResponse(message="Contraseña actualizada correctamente.")


# PERFIL
@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(get_current_user)):
    """Obtiene el usuario autenticado."""
    return UserResponse.model_validate(user, from_attributes=True)


@router.post("/password", response_model=UserResponse)
def add_or_change_password(
    payload: SetPasswordRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Permite agregar contraseña a usuarios Google o cambiarla en cuentas existentes."""
    updated_user = set_user_password(
        db,
        user,
        payload.new_password,
        payload.current_password,
    )
    return UserResponse.model_validate(updated_user, from_attributes=True)


# LOGOUT
@router.post("/logout")
def logout(
    request: Request,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoca el token actual."""

    # Obtener token desde header
    token = request.headers.get("Authorization")

    if not token:
        raise UnauthorizedError("Token no proporcionado.")

    token = token.replace("Bearer ", "")

    jti, exp = extract_token_data(token)

    revoke_token(db, jti, exp)

    return {"message": "Sesión cerrada correctamente"}
