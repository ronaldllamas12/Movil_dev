"""Additional integration tests for payment confirmations and webhooks."""

from tests.conftest import auth_headers_for


class _Resp:
    def __init__(self, status_code, payload):
        self.status_code = status_code
        self._payload = payload

    def json(self):
        return self._payload


def test_epayco_confirmation_get_handles_invalid_order_id(client):
    response = client.get("/payments/epayco/confirmation", params={"x_extra6": "bad-id"})

    assert response.status_code == 200
    assert response.json()["received"] is False


def test_paypal_webhook_rejects_invalid_signature(client, monkeypatch):
    monkeypatch.setattr("payments.router._paypal_api_base", lambda: "https://paypal.test")
    monkeypatch.setattr("payments.router._paypal_access_token", lambda: "token")
    monkeypatch.setattr(
        "payments.router.requests.post",
        lambda *args, **kwargs: _Resp(200, {"verification_status": "FAILURE"}),
    )

    payload = {
        "resource": {
            "custom_id": "order_123",
            "id": "CAPTURE-1",
            "amount": {"value": "100.00", "currency_code": "USD"},
        }
    }

    response = client.post(
        "/payments/paypal/webhook",
        json=payload,
        headers={
            "Paypal-Auth-Algo": "algo",
            "Paypal-Cert-Url": "url",
            "Paypal-Transmission-Id": "tid",
            "Paypal-Transmission-Sig": "sig",
            "Paypal-Transmission-Time": "time",
            "Paypal-Webhook-Id": "wid",
        },
    )

    assert response.status_code == 400


def test_paypal_webhook_marks_paid_when_capture_matches(client, monkeypatch):
    paid_calls = []

    monkeypatch.setattr("payments.router._paypal_api_base", lambda: "https://paypal.test")
    monkeypatch.setattr("payments.router._paypal_access_token", lambda: "token")
    monkeypatch.setattr(
        "payments.router.requests.post",
        lambda *args, **kwargs: _Resp(200, {"verification_status": "SUCCESS"}),
    )
    monkeypatch.setattr(
        "payments.router.requests.get",
        lambda *args, **kwargs: _Resp(
            200,
            {
                "status": "COMPLETED",
                "amount": {"value": "100.00", "currency_code": "USD"},
            },
        ),
    )

    def fake_mark(db, order_id, provider=None, payment_method=None):
        paid_calls.append((order_id, provider, payment_method))

    monkeypatch.setattr("payments.router.mark_order_paid", fake_mark)

    payload = {
        "resource": {
            "custom_id": "order_123",
            "id": "CAPTURE-1",
            "amount": {"value": "100.00", "currency_code": "USD"},
        }
    }

    response = client.post(
        "/payments/paypal/webhook",
        json=payload,
        headers={
            "Paypal-Auth-Algo": "algo",
            "Paypal-Cert-Url": "url",
            "Paypal-Transmission-Id": "tid",
            "Paypal-Transmission-Sig": "sig",
            "Paypal-Transmission-Time": "time",
            "Paypal-Webhook-Id": "wid",
        },
    )

    assert response.status_code == 200
    assert response.json()["received"] is True
    assert paid_calls == [(123, "paypal", "Tarjeta/PayPal")]


def test_paypal_webhook_cancels_when_capture_mismatch(client, monkeypatch):
    cancel_calls = []

    monkeypatch.setattr("payments.router._paypal_api_base", lambda: "https://paypal.test")
    monkeypatch.setattr("payments.router._paypal_access_token", lambda: "token")
    monkeypatch.setattr(
        "payments.router.requests.post",
        lambda *args, **kwargs: _Resp(200, {"verification_status": "SUCCESS"}),
    )
    monkeypatch.setattr(
        "payments.router.requests.get",
        lambda *args, **kwargs: _Resp(
            200,
            {
                "status": "DECLINED",
                "amount": {"value": "100.00", "currency_code": "USD"},
            },
        ),
    )

    def fake_cancel(db, order_id, status):
        cancel_calls.append((order_id, status))

    monkeypatch.setattr("payments.router.update_order_status", fake_cancel)

    payload = {
        "resource": {
            "custom_id": "order_777",
            "id": "CAPTURE-2",
            "amount": {"value": "100.00", "currency_code": "USD"},
        }
    }

    response = client.post(
        "/payments/paypal/webhook",
        json=payload,
        headers={
            "Paypal-Auth-Algo": "algo",
            "Paypal-Cert-Url": "url",
            "Paypal-Transmission-Id": "tid",
            "Paypal-Transmission-Sig": "sig",
            "Paypal-Transmission-Time": "time",
            "Paypal-Webhook-Id": "wid",
        },
    )

    assert response.status_code == 200
    assert response.json()["received"] is True
    assert cancel_calls == [(777, "cancelled")]


def test_epayco_create_session_requires_auth(client):
    response = client.post(
        "/payments/epayco/create-session",
        json={
            "nombre": "Cliente",
            "correo": "anon@example.com",
            "telefono": "3001234567",
            "direccion": "Calle 1",
            "ciudad": "Bogota",
            "frontend_origin": "http://localhost:5173",
        },
    )

    assert response.status_code in (401, 403)
