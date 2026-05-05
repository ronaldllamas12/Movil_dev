"""Cliente HTTP para ePayco."""

from __future__ import annotations

import base64
import json
import os
from typing import Any

import requests

from payments.interfaces import PaymentProviderClient

from database.core.errors import ConflictError


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _epayco_error_message(response: requests.Response | dict[str, Any], fallback: str) -> str:
    if isinstance(response, requests.Response):
        try:
            data = response.json()
        except ValueError:
            return fallback
    else:
        data = response

    title = data.get("titleResponse") or data.get("title_response") or ""
    text = data.get("textResponse") or data.get("text_response") or data.get("message") or ""
    errors = data.get("errors") or data.get("error") or ""
    if isinstance(errors, (dict, list)):
        errors = json.dumps(errors, ensure_ascii=False)

    parts = [str(part) for part in (title, text, errors) if part]
    if not parts:
        return fallback

    return f"{fallback} ePayco: {' - '.join(parts)}"


class HTTPEpaycoClient(PaymentProviderClient):
    def get_access_token(self) -> str:
        public_key = _env("EPAYCO_PUBLIC_KEY") or _env("PUBLIC_KEY")
        private_key = _env("EPAYCO_PRIVATE_KEY")

        if not public_key or not private_key:
            raise ConflictError("Faltan EPAYCO_PUBLIC_KEY y EPAYCO_PRIVATE_KEY en el backend.")

        credentials = base64.b64encode(
            f"{public_key}:{private_key}".encode("utf-8")
        ).decode("ascii")
        response = requests.post(
            "https://apify.epayco.co/login",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Basic {credentials}",
            },
            timeout=20,
        )

        if response.status_code >= 400:
            raise ConflictError(
                _epayco_error_message(
                    response,
                    "ePayco no pudo autenticar las credenciales configuradas.",
                )
            )

        return response.json()["token"]

    def create_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        access_token = self.get_access_token()
        response = requests.post(
            "https://apify.epayco.co/payment/session/create",
            json=payload,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {access_token}",
            },
            timeout=20,
        )

        if response.status_code >= 400:
            raise ConflictError(
                _epayco_error_message(
                    response,
                    "No se pudo crear la sesion de pago en ePayco.",
                )
            )

        return response.json()

    def capture_order(self, order_id: str) -> dict[str, Any]:
        raise NotImplementedError(
            "ePayco confirma pagos via webhook; no se requiere capture_order."
        )
