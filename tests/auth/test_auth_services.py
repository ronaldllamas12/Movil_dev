"""Pruebas unitarias para servicios de autenticación."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from users.constants import UserRole
from users.models import User

from backend.auth.dependencies import get_current_admin
from backend.auth.services import (
    authenticate_google_user,
    authenticate_user,
    create_password_reset_token,
    register_user,
    reset_password,
    set_user_password,
)
from database.core.database import Base
from database.core.errors import ForbiddenError


def create_test_db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    db.info["_engine"] = engine
    return db


def close_test_db(db: Session) -> None:
    engine = db.info.get("_engine")
    db.close()
    if engine is not None:
        engine.dispose()


def test_register_and_authenticate_user():
    db = create_test_db()
    try:
        user = register_user(
            db,
            email="test@example.com",
            password="ClaveSegura123",
            full_name="Usuario Test",
            role=UserRole.ADMIN,
        )

        authenticated = authenticate_user(db, "test@example.com", "ClaveSegura123")

        assert user.id is not None
        assert authenticated.email == "test@example.com"
        assert authenticated.role == UserRole.ADMIN.value
        assert authenticated.auth_provider == "local"
        assert authenticated.purchase_history == []
        assert authenticated.preferences == {}
        assert authenticated.saved_articles == []
    finally:
        close_test_db(db)


def test_reset_password_flow():
    db = create_test_db()
    try:
        register_user(
            db,
            email="reset@example.com",
            password="ClaveInicial123",
            full_name="Usuario Reset",
        )

        token = create_password_reset_token(db, "reset@example.com")
        reset_password(db, token, "NuevaClave123")

        authenticated = authenticate_user(db, "reset@example.com", "NuevaClave123")

        assert token
        assert authenticated.email == "reset@example.com"
        assert authenticated.auth_provider == "local"
    finally:
        close_test_db(db)


def test_google_user_debe_agregar_password_antes_local_login(monkeypatch):
    db = create_test_db()
    try:
        monkeypatch.setattr(
            "backend.auth.services.verify_google_id_token",
            lambda _: {
                "sub": "google-user-1",
                "email": "google@example.com",
                "email_verified": True,
                "name": "Google User",
                "picture": "https://example.com/avatar.png",
            },
        )

        google_user = authenticate_google_user(db, "fake-token")

        assert google_user.auth_provider == "google"
        assert google_user.role == UserRole.USER.value
        assert google_user.hashed_password is None

        updated_user = set_user_password(db, google_user, "ClaveNueva123")
        authenticated = authenticate_user(db, "google@example.com", "ClaveNueva123")

        assert updated_user.auth_provider == "hybrid"
        assert authenticated.google_sub == "google-user-1"
        assert authenticated.saved_articles == []
    finally:
        close_test_db(db)


def test_google_login_links_existing_local_account(monkeypatch):
    db = create_test_db()
    try:
        local_user = register_user(
            db,
            email="link@example.com",
            password="ClaveSegura123",
            full_name="Cuenta Local",
        )

        monkeypatch.setattr(
            "backend.auth.services.verify_google_id_token",
            lambda _: {
                "sub": "google-link-1",
                "email": "link@example.com",
                "email_verified": True,
                "name": "Cuenta Vinculada",
                "picture": "https://example.com/pic.png",
            },
        )

        linked_user = authenticate_google_user(db, "fake-token")

        assert linked_user.id == local_user.id
        assert linked_user.auth_provider == "hybrid"
        assert linked_user.google_sub == "google-link-1"
        assert linked_user.avatar_url == "https://example.com/pic.png"
        assert linked_user.role == UserRole.USER.value
    finally:
        close_test_db(db)


def test_get_current_admin_permite_administrador():
    admin_user = User(
        email="admin@example.com",
        full_name="Admin Test",
        role=UserRole.ADMIN,
        hashed_password="hash",
        auth_provider="local",
        is_active=True,
        purchase_history=[],
        preferences={},
        saved_articles=[],
    )

    current = get_current_admin(admin_user)
    assert current.role == UserRole.ADMIN.value


def test_get_current_admin_rechaza_usuario_no_admin():
    normal_user = User(
        email="user@example.com",
        full_name="User Test",
        role=UserRole.USER,
        hashed_password="hash",
        auth_provider="local",
        is_active=True,
        purchase_history=[],
        preferences={},
        saved_articles=[],
    )

    try:
        get_current_admin(normal_user)
        assert False, "Se esperaba ForbiddenError para rol usuario"
    except ForbiddenError as exc:
        assert "Solo un administrador" in exc.message
