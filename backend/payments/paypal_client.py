"""Cliente HTTP para PayPal."""

from __future__ import annotations

import os
from typing import Any

import requests

from payments.interfaces import PaymentProviderClient

from database.core.errors import ConflictError


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _paypal_api_base() -> str:
    mode = _env("PAYPAL_MODE", "sandbox").lower()
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def _paypal_error_message(response: requests.Response, fallback: str) -> str:
    try:
        data = response.json()
    except ValueError:
        return fallback

    details = data.get("details") or []
    issue = ""
    description = ""
    if details and isinstance(details[0], dict):
        issue = details[0].get("issue", "")
        description = details[0].get("description", "")

    message = data.get("message") or description or fallback
    if issue:
        return f"{fallback} PayPal: {issue} - {message}"
    return f"{fallback} PayPal: {message}"


class HTTPPayPalClient(PaymentProviderClient):
    def get_access_token(self) -> str:
        client_id = _env("PAYPAL_CLIENT_ID")
        client_secret = _env("PAYPAL_CLIENT_SECRET")

        if not client_id or not client_secret:
            raise ConflictError("Faltan PAYPAL_CLIENT_ID y PAYPAL_CLIENT_SECRET en el backend.")

        response = requests.post(
            f"{_paypal_api_base()}/v1/oauth2/token",
            auth=(client_id, client_secret),
            data={"grant_type": "client_credentials"},
            headers={"Accept": "application/json", "Accept-Language": "en_US"},
            timeout=20,
        )

        if response.status_code >= 400:
            raise ConflictError("PayPal no pudo autenticar las credenciales configuradas.")

        return response.json()["access_token"]

    def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        access_token = self.get_access_token()
        response = requests.post(
            f"{_paypal_api_base()}/v2/checkout/orders",
            json=payload,
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )

        if response.status_code >= 400:
            raise ConflictError(
                _paypal_error_message(response, "No se pudo crear la orden en PayPal.")
            )

        return response.json()

    def capture_order(self, order_id: str) -> dict[str, Any]:
        if not order_id:
            raise ConflictError("Token de PayPal no encontrado.")

        access_token = self.get_access_token()
        response = requests.post(
            f"{_paypal_api_base()}/v2/checkout/orders/{order_id}/capture",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json",
            },
            timeout=20,
        )

        if response.status_code >= 400:
            raise ConflictError(
                _paypal_error_message(response, "No se pudo capturar el pago en PayPal.")
            )

        return response.json()
