"""Pruebas unitarias para dependencias de autenticación."""

import pytest
from auth.dependencies import (
    AUTH_COOKIE_NAME,
    _extract_token,
    get_current_user,
    get_optional_current_user,
)
from database.core.errors import ForbiddenError, NotFoundError, UnauthorizedError
from fastapi.security import HTTPAuthorizationCredentials
from starlette.requests import Request


def _request_with_cookie(token: str | None = None) -> Request:
    headers = []
    if token is not None:
        headers.append((b"cookie", f"{AUTH_COOKIE_NAME}={token}".encode("utf-8")))
    return Request({"type": "http", "method": "GET", "path": "/", "headers": headers})


def _bearer(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_extract_token_prefers_header_then_cookie_and_required_flag():
    req = _request_with_cookie("cookie-token")
    assert _extract_token(req, _bearer("header-token"), required=True) == "header-token"
    assert _extract_token(req, None, required=True) == "cookie-token"

    req_no_token = _request_with_cookie(None)
    assert _extract_token(req_no_token, None, required=False) is None

    with pytest.raises(UnauthorizedError):
        _extract_token(req_no_token, None, required=True)


def test_get_current_user_rejects_invalid_jwt(monkeypatch, db_session):
    req = _request_with_cookie("bad-token")

    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: (_ for _ in ()).throw(ValueError("bad")))
    monkeypatch.setattr("auth.dependencies.is_jwt_error", lambda exc: True)

    with pytest.raises(UnauthorizedError, match="Token inválido"):
        get_current_user(req, None, db_session)


def test_get_current_user_rejects_missing_claims(monkeypatch, db_session):
    req = _request_with_cookie("token")
    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: {"sub": "1"})

    with pytest.raises(UnauthorizedError, match="Token inválido"):
        get_current_user(req, None, db_session)


def test_get_current_user_rejects_revoked(monkeypatch, db_session):
    req = _request_with_cookie("token")
    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: {"sub": "1", "jti": "rev-1"})
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: True)

    with pytest.raises(UnauthorizedError, match="Token revocado"):
        get_current_user(req, None, db_session)


def test_get_current_user_rejects_user_not_found(monkeypatch, db_session):
    req = _request_with_cookie("token")
    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: {"sub": "123", "jti": "ok"})
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: False)

    with pytest.raises(NotFoundError, match="Usuario no encontrado"):
        get_current_user(req, None, db_session)


def test_get_current_user_rejects_inactive_user(monkeypatch, db_session, make_user):
    user = make_user(email="dep-inactive@example.com")
    user.is_active = False
    db_session.commit()

    req = _request_with_cookie("token")
    monkeypatch.setattr(
        "auth.dependencies.decode_token", lambda _t: {"sub": str(user.id), "jti": "ok"}
    )
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: False)

    with pytest.raises(ForbiddenError, match="Usuario inactivo"):
        get_current_user(req, None, db_session)


def test_get_current_user_returns_user_when_valid(monkeypatch, db_session, make_user):
    user = make_user(email="dep-active@example.com")

    req = _request_with_cookie("token")
    monkeypatch.setattr(
        "auth.dependencies.decode_token", lambda _t: {"sub": str(user.id), "jti": "ok"}
    )
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: False)

    current = get_current_user(req, None, db_session)

    assert current.id == user.id


def test_get_optional_current_user_none_without_token(db_session):
    req = _request_with_cookie(None)
    assert get_optional_current_user(req, None, db_session) is None


def test_get_optional_current_user_none_for_invalid_jwt(monkeypatch, db_session):
    req = _request_with_cookie("bad")
    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: (_ for _ in ()).throw(ValueError("bad")))
    monkeypatch.setattr("auth.dependencies.is_jwt_error", lambda exc: True)

    assert get_optional_current_user(req, None, db_session) is None


def test_get_optional_current_user_none_for_missing_claims(monkeypatch, db_session):
    req = _request_with_cookie("token")
    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: {"sub": "1"})

    assert get_optional_current_user(req, None, db_session) is None


def test_get_optional_current_user_none_for_revoked(monkeypatch, db_session):
    req = _request_with_cookie("token")
    monkeypatch.setattr("auth.dependencies.decode_token", lambda _t: {"sub": "1", "jti": "j"})
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: True)

    assert get_optional_current_user(req, None, db_session) is None


def test_get_optional_current_user_none_for_inactive(monkeypatch, db_session, make_user):
    user = make_user(email="dep-opt-inactive@example.com")
    user.is_active = False
    db_session.commit()

    req = _request_with_cookie("token")
    monkeypatch.setattr(
        "auth.dependencies.decode_token", lambda _t: {"sub": str(user.id), "jti": "ok"}
    )
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: False)

    assert get_optional_current_user(req, None, db_session) is None


def test_get_optional_current_user_returns_user(monkeypatch, db_session, make_user):
    user = make_user(email="dep-opt-active@example.com")

    req = _request_with_cookie("token")
    monkeypatch.setattr(
        "auth.dependencies.decode_token", lambda _t: {"sub": str(user.id), "jti": "ok"}
    )
    monkeypatch.setattr("auth.dependencies.is_token_revoked", lambda _db, _jti: False)

    current = get_optional_current_user(req, None, db_session)

    assert current is not None
    assert current.id == user.id
