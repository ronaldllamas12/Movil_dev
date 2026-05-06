from __future__ import annotations

from datetime import datetime, timedelta, timezone

from tests.conftest import auth_headers_for


def test_login_rejects_blank_email_or_password(client):
    resp = client.post(
        "/auth/login",
        json={"email": "   ", "password": "   "},
    )
    assert resp.status_code == 422


def test_google_login_success(monkeypatch, client, db_session, make_user):
    user = make_user(email="google-login@example.com")

    monkeypatch.setattr("auth.router.authenticate_google_user", lambda db, id_token: user)
    monkeypatch.setattr(
        "auth.router.create_token_for_user",
        lambda user: ("token-google", "jti", datetime.now(timezone.utc) + timedelta(minutes=30)),
    )

    resp = client.post("/auth/google", json={"id_token": "fake-id-token-0123456789"})

    assert resp.status_code == 200
    body = resp.json()
    assert body["access_token"] == "token-google"
    assert body["user"]["email"] == "google-login@example.com"


def test_forgot_password_returns_generic_message_when_user_not_found(monkeypatch, client):
    def raise_unauthorized(db, email):
        from database.core.errors import UnauthorizedError

        raise UnauthorizedError("not found")

    monkeypatch.setattr("auth.router.create_password_reset_token", raise_unauthorized)

    resp = client.post("/auth/forgot-password", json={"email": "nobody@example.com"})

    assert resp.status_code == 200
    assert "Si el correo está registrado" in resp.json()["message"]


def test_reset_password_endpoint_success(monkeypatch, client):
    monkeypatch.setattr("auth.router.reset_password", lambda db, token, new_password: None)

    resp = client.post(
        "/auth/reset-password",
        json={"token": "token-reset-123456", "new_password": "ClaveNueva123"},
    )

    assert resp.status_code == 200
    assert "actualizada" in resp.json()["message"]


def test_set_password_endpoint_success(monkeypatch, client, make_user):
    user = make_user(email="setpass@example.com")

    monkeypatch.setattr("auth.router.set_user_password", lambda db, user, new_password, current_password: user)

    resp = client.post(
        "/auth/password",
        headers=auth_headers_for(user),
        json={"new_password": "NuevaClave123", "current_password": "ClaveSegura123"},
    )

    assert resp.status_code == 200
    assert resp.json()["email"] == "setpass@example.com"


def test_upload_avatar_endpoint_success(monkeypatch, client, make_user):
    user = make_user(email="avatar-extra@example.com")

    async def fake_upload(file, folder):
        return {"url": "https://cdn.example.com/avatar.png"}

    monkeypatch.setattr("auth.router.upload_image_to_cloudinary", fake_upload)

    resp = client.post(
        "/auth/me/avatar",
        headers=auth_headers_for(user),
        files={"file": ("avatar.png", b"fake-bytes", "image/png")},
    )

    assert resp.status_code == 200
    assert resp.json()["avatar_url"] == "https://cdn.example.com/avatar.png"


def test_logout_rejects_when_no_token(monkeypatch, client, make_user):
    user = make_user(email="logout-extra@example.com")
    monkeypatch.setattr("auth.router.extract_token_data", lambda token: ("jti", datetime.now(timezone.utc)))

    resp = client.post("/auth/logout", headers=auth_headers_for(user))

    assert resp.status_code == 200
    assert "cerrada" in resp.json()["message"]
