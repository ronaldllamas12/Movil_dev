"""Pruebas unitarias para helpers internos de cart.router."""

import json

from cart.models import CartItem
from cart.router import (
    _build_items_for_authenticated,
    _build_items_for_guest,
    _parse_guest_cart,
    _safe_bool,
    _safe_int,
    _set_guest_cart_cookie,
)
from fastapi import Response
from products.models import Product
from starlette.requests import Request


def _request_with_cookie(cookie_value: str | None = None) -> Request:
    headers = []
    if cookie_value is not None:
        headers.append((b"cookie", f"guest_cart={cookie_value}".encode("utf-8")))
    return Request({"type": "http", "method": "GET", "path": "/cart/items", "headers": headers})


def test_safe_int_and_bool_defaults():
    assert _safe_int("42", 7) == 42
    assert _safe_int("abc", 7) == 7
    assert _safe_int(None, 7) == 7

    assert _safe_bool("true", False) is True
    assert _safe_bool("1", False) is True
    assert _safe_bool("false", True) is False
    assert _safe_bool("off", True) is False
    assert _safe_bool("invalid", True) is True
    assert _safe_bool(None, False) is False


def test_parse_guest_cart_filters_invalid_entries():
    payload = [
        {"product_id": 1, "quantity": 2, "price": 10.5, "color_selected": " Azul "},
        {"product_id": -1, "quantity": 2, "price": 10.5},
        {"product_id": 2, "quantity": 0, "price": 1.0},
        {"product_id": 3, "quantity": 1, "price": -2.0},
        {"product_id": 4, "quantity": 1, "price": 4.0, "color_selected": 123},
        "bad-item",
    ]
    req = _request_with_cookie(json.dumps(payload))

    parsed = _parse_guest_cart(req)

    assert parsed == [
        {"product_id": 1, "quantity": 2, "price": 10.5, "color_selected": "Azul"}
    ]


def test_parse_guest_cart_handles_invalid_json_or_shape():
    assert _parse_guest_cart(_request_with_cookie("{bad-json")) == []
    assert _parse_guest_cart(_request_with_cookie(json.dumps({"product_id": 1}))) == []
    assert _parse_guest_cart(_request_with_cookie(None)) == []


def test_set_guest_cart_cookie_normalizes_samesite_secure(monkeypatch):
    monkeypatch.setenv("CART_COOKIE_SAMESITE", "none")
    monkeypatch.setenv("CART_COOKIE_SECURE", "false")

    resp = Response()
    _set_guest_cart_cookie(resp, [{"product_id": 1, "quantity": 1, "price": 10.0, "color_selected": ""}])

    cookie_header = resp.headers.get("set-cookie", "")
    assert "guest_cart=" in cookie_header
    assert "SameSite=none" in cookie_header
    assert "HttpOnly" in cookie_header
    assert "Secure" in cookie_header


def test_build_items_for_guest_skips_missing_products(db_session, make_product):
    p1 = make_product(referencia="CART-GUEST-1", nombre="Guest 1", precio_unitario=200)
    raw_items = [
        {"product_id": p1.id, "quantity": 2, "price": 200.0, "color_selected": "Negro"},
        {"product_id": 999999, "quantity": 1, "price": 10.0, "color_selected": ""},
    ]
    req = _request_with_cookie(json.dumps(raw_items))

    result = _build_items_for_guest(db_session, req)

    assert len(result) == 1
    assert result[0].product_id == p1.id
    assert result[0].quantity == 2
    assert result[0].line_total == 400


def test_build_items_for_authenticated_skips_missing_products(
    db_session, make_user, make_product
):
    user = make_user(email="auth-cart-helper@example.com")
    p1 = make_product(referencia="CART-AUTH-1", nombre="Auth 1", precio_unitario=300)

    item_ok = CartItem(
        user_id=user.id,
        product_id=p1.id,
        quantity=3,
        price=300.0,
        color_selected="",
    )
    item_orphan = CartItem(
        user_id=user.id,
        product_id=999999,
        quantity=1,
        price=999.0,
        color_selected="",
    )
    db_session.add_all([item_ok, item_orphan])
    db_session.commit()

    result = _build_items_for_authenticated(db_session, user.id)

    assert len(result) == 1
    assert result[0].product_id == p1.id
    assert result[0].quantity == 3
    assert result[0].line_total == 900
