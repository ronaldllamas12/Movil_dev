"""Pruebas unitarias para servicios de autenticación."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from backend.auth.services import (
    authenticate_google_user,
    authenticate_user,
    create_password_reset_token,
    register_user,
    reset_password,
    set_user_password,
)
from database.core.database import Base


def create_test_db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def test_register_and_authenticate_user():
    db = create_test_db()
    try:
        user = register_user(
            db,
            email="test@example.com",
            password="ClaveSegura123",
            full_name="Usuario Test",
        )

        authenticated = authenticate_user(db, "test@example.com", "ClaveSegura123")

        assert user.id is not None
        assert authenticated.email == "test@example.com"
        assert authenticated.auth_provider == "local"
        assert authenticated.purchase_history == []
        assert authenticated.preferences == {}
        assert authenticated.saved_articles == []
    finally:
        db.close()


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
        db.close()


def test_google_user_debe_agregar_password_antes_local_login(monkeypatch):
    db = create_test_db()
    try:
        monkeypatch.setattr(
            "auth.services.verify_google_id_token",
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
        assert google_user.hashed_password is None

        updated_user = set_user_password(db, google_user, "ClaveNueva123")
        authenticated = authenticate_user(db, "google@example.com", "ClaveNueva123")

        assert updated_user.auth_provider == "hybrid"
        assert authenticated.google_sub == "google-user-1"
        assert authenticated.saved_articles == []
    finally:
        db.close()


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
            "auth.services.verify_google_id_token",
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
    finally:
        db.close()
