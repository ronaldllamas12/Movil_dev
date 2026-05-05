from __future__ import annotations

from types import SimpleNamespace

import pytest
import requests
from fastapi import HTTPException

from auth import email_service
from cloudinary_utils import _configure_cloudinary, _validate_image_file, upload_image_to_cloudinary
from database.core.errors import ConflictError
from orders import whatsapp_router, whatsapp_service
from payments.epayco_client import HTTPEpaycoClient, _epayco_error_message
from payments.paypal_client import HTTPPayPalClient, _paypal_api_base, _paypal_error_message


class DummyResponse:
    def __init__(self, status_code: int = 200, payload: dict | None = None, text: str = ""):
        self.status_code = status_code
        self._payload = payload or {}
        self.text = text
        self.content = b"png-bytes"

    def json(self):
        return self._payload

    def raise_for_status(self):
        if self.status_code >= 400:
            error = requests.HTTPError("boom")
            error.response = self
            raise error


class DummyUploadFile:
    def __init__(self, content_type: str, raw: bytes):
        self.content_type = content_type
        self._raw = raw

    async def read(self):
        return self._raw


def test_get_required_env_raises_when_missing(monkeypatch):
    monkeypatch.delenv("MAILTRAP_API_TOKEN", raising=False)
    with pytest.raises(HTTPException):
        email_service._get_required_env("MAILTRAP_API_TOKEN")


def test_get_optional_env_uses_default(monkeypatch):
    monkeypatch.delenv("MAIL_FROM_NAME", raising=False)
    assert email_service._get_optional_env("Movil Dev", "MAIL_FROM_NAME") == "Movil Dev"


def test_send_password_reset_email_success(monkeypatch):
    monkeypatch.setenv("MAILTRAP_API_TOKEN", "token")
    monkeypatch.setenv("MAIL_FROM", "noreply@example.com")
    monkeypatch.setenv("MAIL_FROM_NAME", "App")
    monkeypatch.setenv("FRONTEND_URL", "https://frontend.test")
    monkeypatch.setenv("RESET_PASSWORD_PATH", "reset")

    called = {}

    def fake_post(url, headers, json, timeout):
        called["url"] = url
        called["headers"] = headers
        called["json"] = json
        called["timeout"] = timeout
        return DummyResponse(status_code=200, payload={"ok": True}, text="ok")

    monkeypatch.setattr(email_service.requests, "post", fake_post)

    email_service.send_password_reset_email(recipient_email="u@example.com", token="abc")

    assert called["url"].endswith("/api/send")
    assert "Bearer token" in called["headers"]["Authorization"]
    assert "token=abc" in called["json"]["text"]


def test_send_password_reset_email_http_error(monkeypatch):
    monkeypatch.setenv("MAILTRAP_API_TOKEN", "token")
    monkeypatch.setenv("MAIL_FROM", "noreply@example.com")
    monkeypatch.setenv("FRONTEND_URL", "https://frontend.test")

    def fake_post(*args, **kwargs):
        return DummyResponse(status_code=500, payload={"error": "x"}, text="bad")

    monkeypatch.setattr(email_service.requests, "post", fake_post)

    with pytest.raises(HTTPException):
        email_service.send_password_reset_email(recipient_email="u@example.com", token="abc")


def test_configure_cloudinary_requires_dependency(monkeypatch):
    monkeypatch.setattr("cloudinary_utils.cloudinary", None)
    with pytest.raises(HTTPException):
        _configure_cloudinary()


def test_configure_cloudinary_requires_env(monkeypatch):
    monkeypatch.setattr("cloudinary_utils.cloudinary", SimpleNamespace(config=lambda **kwargs: None))
    monkeypatch.delenv("CLOUDINARY_CLOUD_NAME", raising=False)
    monkeypatch.delenv("CLOUDINARY_API_KEY", raising=False)
    monkeypatch.delenv("CLOUDINARY_API_SECRET", raising=False)
    with pytest.raises(HTTPException):
        _configure_cloudinary()


def test_validate_image_file_rejects_non_image():
    with pytest.raises(HTTPException):
        _validate_image_file(SimpleNamespace(content_type="text/plain"), b"abc")


def test_validate_image_file_rejects_oversize():
    with pytest.raises(HTTPException):
        _validate_image_file(SimpleNamespace(content_type="image/png"), b"x" * (5 * 1024 * 1024 + 1))


@pytest.mark.asyncio
async def test_upload_image_to_cloudinary_success(monkeypatch):
    monkeypatch.setenv("CLOUDINARY_CLOUD_NAME", "demo")
    monkeypatch.setenv("CLOUDINARY_API_KEY", "k")
    monkeypatch.setenv("CLOUDINARY_API_SECRET", "s")

    class Uploader:
        @staticmethod
        def upload(raw_data, folder, resource_type):
            assert raw_data == b"img"
            assert folder == "products"
            assert resource_type == "image"
            return {"secure_url": "https://img", "public_id": "pid", "format": "png"}

    fake_cloudinary = SimpleNamespace(config=lambda **kwargs: None, uploader=Uploader)
    monkeypatch.setattr("cloudinary_utils.cloudinary", fake_cloudinary)

    result = await upload_image_to_cloudinary(DummyUploadFile("image/png", b"img"), "products")

    assert result["url"] == "https://img"
    assert result["public_id"] == "pid"


@pytest.mark.asyncio
async def test_upload_image_to_cloudinary_upload_error(monkeypatch):
    monkeypatch.setenv("CLOUDINARY_CLOUD_NAME", "demo")
    monkeypatch.setenv("CLOUDINARY_API_KEY", "k")
    monkeypatch.setenv("CLOUDINARY_API_SECRET", "s")

    class Uploader:
        @staticmethod
        def upload(*args, **kwargs):
            raise RuntimeError("fail")

    fake_cloudinary = SimpleNamespace(config=lambda **kwargs: None, uploader=Uploader)
    monkeypatch.setattr("cloudinary_utils.cloudinary", fake_cloudinary)

    with pytest.raises(HTTPException):
        await upload_image_to_cloudinary(DummyUploadFile("image/png", b"img"), "products")


def test_wa_url_variants(monkeypatch):
    monkeypatch.delenv("WA_SERVICE_URL", raising=False)
    with pytest.raises(RuntimeError):
        whatsapp_router._wa_url("/x")

    monkeypatch.setenv("WA_SERVICE_URL", "localhost:3000")
    assert whatsapp_router._wa_url("/x") == "http://localhost:3000/x"

    monkeypatch.setenv("WA_SERVICE_URL", "wa-service.example.com")
    assert whatsapp_router._wa_url("/x") == "https://wa-service.example.com/x"


def test_whatsapp_status_error(monkeypatch):
    def fake_get(*args, **kwargs):
        raise RuntimeError("down")

    monkeypatch.setenv("WA_SERVICE_URL", "localhost:3000")
    monkeypatch.setattr(whatsapp_router.requests, "get", fake_get)

    data = whatsapp_router.whatsapp_status()
    assert data["ready"] is False


def test_whatsapp_qr_404(monkeypatch):
    monkeypatch.setenv("WA_SERVICE_URL", "localhost:3000")
    monkeypatch.setattr(whatsapp_router.requests, "get", lambda *args, **kwargs: DummyResponse(status_code=404))

    data = whatsapp_router.whatsapp_qr()
    assert data["qr"] is None


def test_whatsapp_connect_disconnect_error(monkeypatch):
    monkeypatch.setenv("WA_SERVICE_URL", "localhost:3000")

    def fake_post(*args, **kwargs):
        raise RuntimeError("boom")

    monkeypatch.setattr(whatsapp_router.requests, "post", fake_post)

    connect = whatsapp_router.whatsapp_connect()
    disconnect = whatsapp_router.whatsapp_disconnect()

    assert connect["status"] == "error"
    assert disconnect["status"] == "error"


def test_whatsapp_service_short_circuit_paths(monkeypatch):
    monkeypatch.delenv("WA_SERVICE_URL", raising=False)
    whatsapp_service.send_order_status_whatsapp(phone=None, order_id=1, status="paid")
    whatsapp_service.send_order_status_whatsapp(phone="300", order_id=1, status="draft")
    whatsapp_service.send_order_status_whatsapp(phone="300", order_id=1, status="paid")


def test_whatsapp_service_success_and_connection_error(monkeypatch):
    monkeypatch.setenv("WA_SERVICE_URL", "http://localhost:3000")

    monkeypatch.setattr(whatsapp_service.requests, "post", lambda *args, **kwargs: DummyResponse(status_code=200, payload={"sent": True}))
    whatsapp_service.send_order_status_whatsapp(phone="300", order_id=2, status="paid", product_names=["A"])

    def connection_error(*args, **kwargs):
        raise requests.exceptions.ConnectionError("down")

    monkeypatch.setattr(whatsapp_service.requests, "post", connection_error)
    whatsapp_service.send_order_status_whatsapp(phone="300", order_id=3, status="paid")


def test_paypal_api_base(monkeypatch):
    monkeypatch.setenv("PAYPAL_MODE", "live")
    assert _paypal_api_base().endswith("paypal.com")
    monkeypatch.setenv("PAYPAL_MODE", "sandbox")
    assert "sandbox" in _paypal_api_base()


def test_paypal_error_message_with_details():
    response = DummyResponse(payload={"details": [{"issue": "X", "description": "Y"}], "message": "M"})
    message = _paypal_error_message(response, "fallback")
    assert "X" in message


def test_paypal_error_message_invalid_json():
    class InvalidJsonResponse(DummyResponse):
        def json(self):
            raise ValueError("bad")

    message = _paypal_error_message(InvalidJsonResponse(), "fallback")
    assert message == "fallback"


def test_paypal_client_missing_credentials(monkeypatch):
    monkeypatch.delenv("PAYPAL_CLIENT_ID", raising=False)
    monkeypatch.delenv("PAYPAL_CLIENT_SECRET", raising=False)
    with pytest.raises(ConflictError):
        HTTPPayPalClient().get_access_token()


def test_paypal_client_auth_failure(monkeypatch):
    monkeypatch.setenv("PAYPAL_CLIENT_ID", "id")
    monkeypatch.setenv("PAYPAL_CLIENT_SECRET", "secret")
    monkeypatch.setattr("payments.paypal_client.requests.post", lambda *args, **kwargs: DummyResponse(status_code=401))

    with pytest.raises(ConflictError):
        HTTPPayPalClient().get_access_token()


def test_paypal_client_create_and_capture_success(monkeypatch):
    monkeypatch.setattr(HTTPPayPalClient, "get_access_token", lambda self: "token")

    calls = {"n": 0}

    def fake_post(*args, **kwargs):
        calls["n"] += 1
        return DummyResponse(status_code=200, payload={"ok": calls["n"]})

    monkeypatch.setattr("payments.paypal_client.requests.post", fake_post)

    client = HTTPPayPalClient()
    created = client.create_order({"x": 1})
    captured = client.capture_order("order-1")

    assert created["ok"] == 1
    assert captured["ok"] == 2


def test_paypal_capture_requires_order_id(monkeypatch):
    monkeypatch.setattr(HTTPPayPalClient, "get_access_token", lambda self: "token")
    with pytest.raises(ConflictError):
        HTTPPayPalClient().capture_order("")


def test_epayco_error_message_variants():
    msg = _epayco_error_message(
        {
            "titleResponse": "T",
            "textResponse": "TXT",
            "errors": {"a": 1},
        },
        "fallback",
    )
    assert "T" in msg and "TXT" in msg


def test_epayco_client_missing_credentials(monkeypatch):
    monkeypatch.delenv("EPAYCO_PUBLIC_KEY", raising=False)
    monkeypatch.delenv("PUBLIC_KEY", raising=False)
    monkeypatch.delenv("EPAYCO_PRIVATE_KEY", raising=False)
    with pytest.raises(ConflictError):
        HTTPEpaycoClient().get_access_token()


def test_epayco_client_auth_failure(monkeypatch):
    monkeypatch.setenv("EPAYCO_PUBLIC_KEY", "pub")
    monkeypatch.setenv("EPAYCO_PRIVATE_KEY", "priv")

    def fake_post(*args, **kwargs):
        response = requests.Response()
        response.status_code = 401
        response._content = b'{"error":"bad"}'
        response.encoding = "utf-8"
        return response

    monkeypatch.setattr("payments.epayco_client.requests.post", fake_post)

    with pytest.raises(ConflictError):
        HTTPEpaycoClient().get_access_token()


def test_epayco_client_create_order_success(monkeypatch):
    monkeypatch.setattr(HTTPEpaycoClient, "get_access_token", lambda self: "token")
    monkeypatch.setattr(
        "payments.epayco_client.requests.post",
        lambda *args, **kwargs: DummyResponse(status_code=200, payload={"success": True, "data": {"sessionId": "S-1"}}),
    )

    result = HTTPEpaycoClient().create_order({"x": 1})
    assert result["success"] is True


def test_epayco_capture_not_implemented():
    with pytest.raises(NotImplementedError):
        HTTPEpaycoClient().capture_order("x")
