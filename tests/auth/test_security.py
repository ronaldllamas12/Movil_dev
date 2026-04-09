"""Pruebas unitarias para utilidades de seguridad."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2] / "backend"))

from database.core.security import (
    create_token,
    decode_token,
    hash_password,
    verify_hash,
)


def test_password_hash_and_verify():
    password = "ClaveSegura123"

    password_hashed = hash_password(password)

    assert password_hashed
    assert password_hashed != password
    assert verify_hash(password, password_hashed) is True


def test_verify_hash_with_wrong_password():
    password_hashed = hash_password("ClaveSegura123")

    assert verify_hash("otra-clave", password_hashed) is False


def test_create_and_decode_token():
    token = create_token(subject="1", jti="abc123")

    payload = decode_token(token)

    assert payload["sub"] == "1"
    assert payload["jti"] == "abc123"
    assert "exp" in payload
