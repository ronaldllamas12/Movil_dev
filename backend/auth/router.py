"""Rutas de autenticación."""

import os

from auth.dependencies import get_current_admin, get_current_user
from auth.email_service import send_password_reset_email
from auth.schemas import (
    ForgotPasswordRequest,
    GoogleLoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SetPasswordRequest,
    ShippingProfileRequest,
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
from cloudinary_utils import upload_image_to_cloudinary
from fastapi import APIRouter, Depends, File, Request, Response, UploadFile, status
from sqlalchemy.orm import Session
from users.constants import UserRole
from users.models import User
from users.schemas import UserResponse

from database.core.database import get_db
from database.core.errors import ForbiddenError, UnauthorizedError

router = APIRouter(prefix="/auth", tags=["Auth"])

AUTH_COOKIE_NAME = "access_token"
_COOKIE_MAX_AGE = int(os.getenv("APP_JWT_EXPIRATION", "3600"))


def _set_auth_cookie(request: Request, response: Response, token: str) -> None:
    """Establece la cookie httpOnly con el token JWT."""
    forwarded_proto = request.headers.get("x-forwarded-proto", "")
    secure = request.url.scheme == "https" or "https" in forwarded_proto.lower()
    response.set_cookie(
        key=AUTH_COOKIE_NAME,
        value=token,
        max_age=_COOKIE_MAX_AGE,
        httponly=True,
        samesite="lax",
        secure=secure,
        path="/",
    )


def _clear_auth_cookie(response: Response) -> None:
    """Elimina la cookie de autenticación."""
    response.delete_cookie(
        key=AUTH_COOKIE_NAME,
        path="/",
    )


@router.post(
    "/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Registra un nuevo usuario."""
    if payload.role != UserRole.USER:
        raise ForbiddenError(
            "El registro público solo permite crear cuentas con rol usuario."
        )

    user = register_user(
        db,
        payload.email,
        payload.password,
        payload.full_name,
        UserRole.USER,
    )

    return UserResponse.model_validate(user, from_attributes=True)


@router.post(
    "/admin/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED
)
def admin_register_user(
    payload: RegisterRequest,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Permite a un administrador registrar usuarios con cualquier rol válido."""
    user = register_user(
        db,
        payload.email,
        payload.password,
        payload.full_name,
        payload.role,
    )
    return UserResponse.model_validate(user, from_attributes=True)


# LOGIN
@router.post("/login", response_model=TokenResponse)
def login(
    payload: UserLogin,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Autentica usuario, retorna JWT y establece cookie httpOnly."""
    if payload.email.strip() == "" or payload.password.strip() == "":
        raise UnauthorizedError("Email y contraseña no pueden estar vacíos.")

    user = authenticate_user(db, payload.email, payload.password)
    token, _, _ = create_token_for_user(user)
    _set_auth_cookie(request, response, token)

    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user, from_attributes=True),
    )


@router.post("/google", response_model=TokenResponse)
def login_with_google(
    payload: GoogleLoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    """Autentica un usuario usando Google OAuth, retorna JWT y establece cookie httpOnly."""
    user = authenticate_google_user(db, payload.id_token)
    token, _, _ = create_token_for_user(user)
    _set_auth_cookie(request, response, token)
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user, from_attributes=True),
    )


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Session = Depends(get_db),
):
    """Genera token y envía enlace por correo sin revelar si el email existe."""
    generic_message = "Si el correo está registrado, enviaremos un enlace para restablecer la contraseña."

    try:
        token = create_password_reset_token(db, payload.email)
        send_password_reset_email(recipient_email=payload.email, token=token)
    except UnauthorizedError:
        return MessageResponse(message=generic_message)

    return MessageResponse(message=generic_message)


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


@router.post("/me/avatar", response_model=UserResponse)
async def upload_my_avatar(
    file: UploadFile = File(...),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Sube avatar del usuario a Cloudinary y guarda la URL en su perfil."""
    upload_result = await upload_image_to_cloudinary(file, folder="movil-dev/avatars")

    user.avatar_url = upload_result["url"]
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user, from_attributes=True)


@router.patch("/me/shipping", response_model=UserResponse)
def update_my_shipping_profile(
    payload: ShippingProfileRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> UserResponse:
    """Guarda o actualiza la informacion de envio frecuente del usuario."""
    preferences = dict(user.preferences or {})
    preferences["shipping"] = {
        "receiver_name": payload.receiver_name.strip(),
        "phone": payload.phone.strip(),
        "address": payload.address.strip(),
        "city": payload.city.strip(),
    }

    user.preferences = preferences
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserResponse.model_validate(user, from_attributes=True)


# LOGOUT
@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Revoca el token actual y limpia la cookie de autenticación."""
    # Obtener token desde header o cookie
    auth_header = request.headers.get("Authorization", "")
    token = auth_header.replace("Bearer ", "").strip()
    if not token:
        token = request.cookies.get(AUTH_COOKIE_NAME, "")

    if not token:
        raise UnauthorizedError("Token no proporcionado.")

    jti, exp = extract_token_data(token)
    revoke_token(db, jti, exp)
    _clear_auth_cookie(response)

    return {"message": "Sesión cerrada correctamente"}
