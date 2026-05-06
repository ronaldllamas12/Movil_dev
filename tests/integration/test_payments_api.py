"""Integration tests for payment endpoints with provider calls mocked."""

from tests.conftest import auth_headers_for


def test_paypal_create_order_endpoint_returns_provider_payload(client, make_user, make_product, monkeypatch):
    user = make_user(email="pay-api@example.com")
    make_product(referencia="PAY-API-1", precio_unitario=250000, cantidad_stock=5)

    def fake_create_paypal_order(*, db, user, customer):
        return {
            "order_id": "PAYPAL-ORDER-1",
            "url": "https://paypal.test/approve",
            "amount": "250000.00",
            "currency": "COP",
            "invoice": "PAYPAL-REF-1",
            "db_order_id": 101,
        }

    monkeypatch.setattr("payments.router.create_paypal_order", fake_create_paypal_order)

    response = client.post(
        "/payments/paypal/create-order",
        headers=auth_headers_for(user),
        json={
            "nombre": "Cliente API",
            "correo": "pay-api@example.com",
            "telefono": "3001234567",
            "direccion": "Calle 1",
            "ciudad": "Bogota",
            "frontend_origin": "http://localhost:5173",
        },
    )

    assert response.status_code == 200
    assert response.json()["order_id"] == "PAYPAL-ORDER-1"


def test_paypal_capture_endpoint_marks_order_paid_when_success(client, monkeypatch):
    calls = []

    def fake_capture(token):
        assert token == "TOKEN-123"
        return {"success": True, "order_id": "TOKEN-123", "status": "COMPLETED"}

    def fake_mark_order_paid(db, order_id, provider, payment_method):
        calls.append((order_id, provider, payment_method))

    monkeypatch.setattr("payments.router.capture_paypal_order", fake_capture)
    monkeypatch.setattr("payments.router.mark_order_paid", fake_mark_order_paid)

    response = client.post("/payments/paypal/capture-order", params={"token": "TOKEN-123", "db_order_id": 77})

    assert response.status_code == 200
    assert response.json()["success"] is True
    assert calls == [(77, "paypal", "Tarjeta/PayPal")]


def test_epayco_confirmation_get_marks_paid_or_cancelled(client, monkeypatch):
    paid_calls = []
    cancel_calls = []

    def fake_mark_order_paid(*, db, order_id, provider, payment_method):
        paid_calls.append((order_id, provider, payment_method))

    def fake_update_status(db, order_id, status):
        cancel_calls.append((order_id, status))

    monkeypatch.setattr("payments.router.mark_order_paid", fake_mark_order_paid)
    monkeypatch.setattr("payments.router.update_order_status", fake_update_status)

    approved = client.post(
        "/payments/epayco/confirmation",
        data={"x_extra6": "12", "x_cod_response": "1"},
    )
    assert approved.status_code == 200
    assert approved.json()["received"] is True

    rejected = client.post(
        "/payments/epayco/confirmation",
        data={"x_extra6": "13", "x_cod_response": "2"},
    )
    assert rejected.status_code == 200
    assert rejected.json()["received"] is True

    assert paid_calls == [(12, "epayco", "Tarjeta/transferencia ePayco")]
    assert cancel_calls == [(13, "cancelled")]


def test_epayco_create_session_endpoint_returns_session(client, make_user, monkeypatch):
    user = make_user(email="epayco-api@example.com")

    def fake_create_epayco_session(*, db, user, customer):
        assert customer.nombre == "Cliente API"
        return {
            "session_id": "SESSION-API-1",
            "token": "EPAYCO-TOKEN",
            "checkout_url": "https://checkout.epayco.test/session",
            "invoice": "9001",
            "amount": 100000.0,
            "currency": "COP",
            "db_order_id": 9001,
        }

    monkeypatch.setattr("payments.router.create_epayco_session", fake_create_epayco_session)

    response = client.post(
        "/payments/epayco/create-session",
        headers=auth_headers_for(user),
        json={
            "nombre": "Cliente API",
            "correo": "epayco-api@example.com",
            "telefono": "3001234567",
            "direccion": "Calle 1",
            "ciudad": "Bogota",
            "frontend_origin": "http://localhost:5173",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["session_id"] == "SESSION-API-1"
    assert body["db_order_id"] == 9001
