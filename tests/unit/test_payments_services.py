"""Pruebas unitarias para lógica de pagos sin llamar pasarelas externas."""

from types import SimpleNamespace
from typing import Any

import pytest
import requests

from cart.services import add_item_for_user
from database.core.errors import ConflictError
from payments import services
from payments.interfaces import PaymentProviderClient


class FakePayPalClient(PaymentProviderClient):
    """Cliente PayPal falso para tests — no hace llamadas HTTP."""

    def __init__(self, *, order_id: str = "PAYPAL-1", approve_url: str = "https://paypal.test/approve", call_count: list | None = None):
        self._order_id = order_id
        self._approve_url = approve_url
        self._call_count = call_count if call_count is not None else []

    def get_access_token(self) -> str:
        return "fake-access-token"

    def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        self._call_count.append(payload)
        return {
            "id": f"{self._order_id}-{len(self._call_count)}",
            "links": [{"rel": "approve", "href": self._approve_url}],
        }

    def capture_order(self, order_id: str) -> dict[str, Any]:
        return {"id": order_id, "status": "COMPLETED"}


class FakeEpaycoClient(PaymentProviderClient):
    """Cliente ePayco falso para tests — controla qué devuelve."""

    def __init__(self, *, session_id: str | None = "SESSION-1", success: bool = True):
        self._session_id = session_id
        self._success = success

    def get_access_token(self) -> str:
        return "fake-epayco-token"

    def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        if not self._success:
            return {"success": True, "data": {}}  # no session_id
        return {"success": True, "data": {"sessionId": self._session_id}}

    def capture_order(self, order_id: str) -> dict[str, Any]:
        raise NotImplementedError


class DummyResponse:
    def __init__(self, status_code: int = 200, payload: dict | None = None):
        self.status_code = status_code
        self._payload = payload or {}

    def json(self):
        return self._payload


def test_build_paypal_amount_converts_cop_to_usd(monkeypatch):
    monkeypatch.setenv("PAYPAL_CURRENCY", "USD")
    monkeypatch.setenv("PAYPAL_COP_TO_USD_RATE", "4000")

    amount, currency = services.build_paypal_amount(100000)

    assert amount == "25.00"
    assert currency == "USD"


def test_build_paypal_amount_rejects_invalid_rate(monkeypatch):
    monkeypatch.setenv("PAYPAL_CURRENCY", "USD")
    monkeypatch.setenv("PAYPAL_COP_TO_USD_RATE", "0")

    with pytest.raises(ConflictError, match="tasa"):
        services.build_paypal_amount(100000)


def test_get_user_cart_total_rejects_empty_cart(db_session, make_user):
    user = make_user(email="pay-empty@example.com")

    with pytest.raises(ConflictError, match="vacio"):
        services.get_user_cart_total(db_session, user)


def test_create_paypal_order_builds_expected_payload(
    db_session,
    make_user,
    make_product,
    monkeypatch,
):
    user = make_user(email="paypal-user@example.com")
    product = make_product(precio_unitario=400000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)

    calls: list = []
    fake_client = FakePayPalClient(call_count=calls)

    monkeypatch.setenv("PAYPAL_CURRENCY", "COP")

    result = services.create_paypal_order(
        db=db_session,
        user=user,
        customer=SimpleNamespace(
            nombre="Cliente",
            direccion="Calle 1",
            ciudad="Bogota",
            frontend_origin=None,
        ),
        client=fake_client,
    )

    assert result["order_id"] == "PAYPAL-1-1"
    assert result["url"] == "https://paypal.test/approve"
    assert result["currency"] == "COP"
    assert calls[0]["purchase_units"][0]["amount"]["value"] == "400000.00"


def test_create_paypal_order_reuses_pending_order_when_cart_has_not_changed(
    db_session,
    make_user,
    make_product,
    monkeypatch,
):
    user = make_user(email="paypal-reuse@example.com")
    product = make_product(precio_unitario=400000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)

    calls: list = []
    fake_client = FakePayPalClient(call_count=calls)
    monkeypatch.setenv("PAYPAL_CURRENCY", "COP")

    customer = SimpleNamespace(nombre="Cliente", direccion="Calle 1", ciudad="Bogota", frontend_origin=None)
    first = services.create_paypal_order(db=db_session, user=user, customer=customer, client=fake_client)
    second = services.create_paypal_order(db=db_session, user=user, customer=customer, client=fake_client)

    assert first["db_order_id"] == second["db_order_id"]
    assert len(calls) == 2


def test_create_paypal_order_creates_new_order_when_cart_changes(
    db_session,
    make_user,
    make_product,
    monkeypatch,
):
    user = make_user(email="paypal-new-order@example.com")
    product_one = make_product(precio_unitario=300000, cantidad_stock=5, referencia="REF-TEST-ONE")
    product_two = make_product(precio_unitario=100000, cantidad_stock=5, referencia="REF-TEST-TWO")
    add_item_for_user(db_session, user_id=user.id, product_id=product_one.id, quantity=1)

    calls: list = []
    fake_client = FakePayPalClient(call_count=calls)
    monkeypatch.setenv("PAYPAL_CURRENCY", "COP")
    customer = SimpleNamespace(nombre="Cliente", direccion="Calle 1", ciudad="Bogota", frontend_origin=None)

    first = services.create_paypal_order(db=db_session, user=user, customer=customer, client=fake_client)
    add_item_for_user(db_session, user_id=user.id, product_id=product_two.id, quantity=1)
    second = services.create_paypal_order(db=db_session, user=user, customer=customer, client=fake_client)

    assert first["db_order_id"] != second["db_order_id"]
    assert len(calls) == 2


def test_capture_paypal_order_returns_completed(monkeypatch):
    fake_client = FakePayPalClient()
    result = services.capture_paypal_order("PAYPAL-XYZ", client=fake_client)
    assert result["success"] is True
    assert result["status"] == "COMPLETED"


def test_create_epayco_session_raises_when_provider_returns_no_session(
    db_session,
    make_user,
    make_product,
):
    user = make_user(email="epayco-user@example.com")
    product = make_product(precio_unitario=200000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)

    fake_client = FakeEpaycoClient(session_id=None, success=False)

    with pytest.raises(ConflictError, match="sesion"):
        services.create_epayco_session(
            db=db_session,
            user=user,
            customer=SimpleNamespace(
                nombre="Cliente",
                telefono="3001234567",
                direccion="Calle 1",
                ciudad="Bogota",
                frontend_origin=None,
            ),
            client=fake_client,
        )


def test_create_paypal_order_raises_when_provider_returns_no_approve_url(
    db_session,
    make_user,
    make_product,
):
    user = make_user(email="paypal-no-approve@example.com")
    product = make_product(precio_unitario=120000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)

    class BadPayPalClient(FakePayPalClient):
        def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
            return {"id": "PAYPAL-X", "links": []}

    with pytest.raises(ConflictError, match="aprobacion"):
        services.create_paypal_order(
            db=db_session,
            user=user,
            customer=SimpleNamespace(
                nombre="Cliente",
                direccion="Calle 1",
                ciudad="Bogota",
                frontend_origin=None,
            ),
            client=BadPayPalClient(),
        )


def test_create_epayco_session_raises_when_provider_marks_unsuccessful(
    db_session,
    make_user,
    make_product,
):
    user = make_user(email="epayco-fail@example.com")
    product = make_product(precio_unitario=200000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)

    class FailedEpaycoClient(FakeEpaycoClient):
        def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
            return {"success": False, "titleResponse": "Error", "textResponse": "Fail"}

    with pytest.raises(ConflictError, match="ePayco"):
        services.create_epayco_session(
            db=db_session,
            user=user,
            customer=SimpleNamespace(
                nombre="Cliente",
                telefono="3001234567",
                direccion="Calle 1",
                ciudad="Bogota",
                frontend_origin=None,
            ),
            client=FailedEpaycoClient(),
        )


def test_internal_paypal_helpers(monkeypatch):
    monkeypatch.setenv("PAYPAL_MODE", "live")
    assert services._paypal_api_base().endswith("paypal.com")

    monkeypatch.delenv("PAYPAL_CLIENT_ID", raising=False)
    monkeypatch.delenv("PAYPAL_CLIENT_SECRET", raising=False)
    with pytest.raises(ConflictError, match="PAYPAL_CLIENT_ID"):
        services._paypal_access_token()

    monkeypatch.setenv("PAYPAL_CLIENT_ID", "id")
    monkeypatch.setenv("PAYPAL_CLIENT_SECRET", "secret")

    monkeypatch.setattr(services.requests, "post", lambda *args, **kwargs: DummyResponse(status_code=401))
    with pytest.raises(ConflictError, match="autenticar"):
        services._paypal_access_token()

    monkeypatch.setattr(
        services.requests,
        "post",
        lambda *args, **kwargs: DummyResponse(status_code=200, payload={"access_token": "tok"}),
    )
    assert services._paypal_access_token() == "tok"


def test_internal_error_message_helpers_cover_variants():
    class InvalidJsonResponse(DummyResponse):
        def json(self):
            raise ValueError("invalid")

    assert services._paypal_error_message(InvalidJsonResponse(), "fallback") == "fallback"

    with_issue = DummyResponse(
        payload={"details": [{"issue": "X", "description": "Y"}], "message": "Z"}
    )
    assert "X" in services._paypal_error_message(with_issue, "fallback")

    dict_error = services._epayco_error_message(
        {"titleResponse": "T", "textResponse": "TXT", "errors": {"a": 1}},
        "fallback",
    )
    assert "ePayco" in dict_error

    response_error = requests.Response()
    response_error.status_code = 400
    response_error._content = b'{"message":"bad"}'
    response_error.encoding = "utf-8"
    assert "bad" in services._epayco_error_message(response_error, "fallback")
