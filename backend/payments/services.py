"""Servicios para integración con PayPal y ePayco."""

from __future__ import annotations

import base64
import json
import os
import time
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

import requests
from cart.schemas import CartItemResponse
from cart.services import compute_cart_totals, list_items_for_user
from products.models import Product
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ConflictError

PAYPAL_ZERO_DECIMAL_CURRENCIES = {
    "HUF",
    "JPY",
    "TWD",
}


def _env(name: str, default: str = "") -> str:
    return os.getenv(name, default).strip()


def _safe_float(value: str | None, default: float) -> float:
    try:
        return float(value) if value is not None else default
    except ValueError:
        return default


def _paypal_api_base() -> str:
    mode = _env("PAYPAL_MODE", "sandbox").lower()
    if mode == "live":
        return "https://api-m.paypal.com"
    return "https://api-m.sandbox.paypal.com"


def _frontend_url() -> str:
    return _env("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _backend_url() -> str:
    return _env("BACKEND_URL", "http://localhost:8000").rstrip("/")


def _is_public_https_url(url: str) -> bool:
    return url.startswith("https://")


def _format_amount(value: Decimal, currency: str) -> str:
    quantizer = Decimal("1") if currency in PAYPAL_ZERO_DECIMAL_CURRENCIES else Decimal("0.01")
    return str(value.quantize(quantizer, rounding=ROUND_HALF_UP))


def _get_shipping_fee(*, subtotal: float, item_count: int) -> float:
    mode = _env("CART_SHIPPING_MODE", "fixed").lower()
    free_from = _safe_float(os.getenv("CART_FREE_SHIPPING_FROM"), -1)

    if free_from >= 0 and subtotal >= free_from:
        return 0.0

    if mode == "dynamic":
        return max(0.0, _safe_float(os.getenv("CART_SHIPPING_DYNAMIC_PER_ITEM"), 0.0)) * item_count

    return max(0.0, _safe_float(os.getenv("CART_SHIPPING_FIXED_FEE"), 0.0))


def _get_tax_percent() -> float:
    return max(0.0, min(100.0, _safe_float(os.getenv("CART_TAX_PERCENT"), 19.0)))


def _build_cart_items(db: Session, user_id: int) -> list[CartItemResponse]:
    items = list_items_for_user(db, user_id=user_id)
    normalized: list[CartItemResponse] = []

    for item in items:
        product = db.get(Product, item.product_id)
        if not product:
            continue

        price = float(item.price)
        normalized.append(
            CartItemResponse(
                id=item.id,
                product_id=product.id,
                referencia=product.referencia,
                nombre=product.nombre,
                imagen_url=product.imagen_url,
                quantity=item.quantity,
                price=round(price, 2),
                line_total=round(price * item.quantity, 2),
            )
        )

    return normalized


def get_user_cart_total(db: Session, user: User) -> float:
    items = _build_cart_items(db, user.id)
    if not items:
        raise ConflictError("El carrito esta vacio.")

    subtotal = sum(item.line_total for item in items)
    shipping_fee = _get_shipping_fee(
        subtotal=subtotal,
        item_count=sum(item.quantity for item in items),
    )
    totals = compute_cart_totals(
        items=items,
        tax_percent=_get_tax_percent(),
        shipping_fee=shipping_fee,
    )
    return totals.total


def build_invoice(user: User, provider: str) -> str:
    return f"MD-{provider.upper()}-{user.id}-{int(time.time())}"


def build_internal_reference(user: User, provider: str) -> str:
    return f"{provider.upper()}-{user.id}-{int(time.time())}"


def build_paypal_amount(cop_total: float) -> tuple[str, str]:
    currency = _env("PAYPAL_CURRENCY", "USD").upper()
    total = Decimal(str(cop_total))

    if currency != "COP":
        rate = Decimal(_env("PAYPAL_COP_TO_USD_RATE", "4000"))
        if rate <= 0:
            raise ConflictError("La tasa PAYPAL_COP_TO_USD_RATE debe ser mayor que cero.")
        total = total / rate

    return _format_amount(total, currency), currency


def _paypal_access_token() -> str:
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


def create_paypal_order(
    *,
    db: Session,
    user: User,
    customer: Any,
) -> dict[str, str]:
    from orders.services import get_or_create_pending_order_for_checkout

    try:
        order = get_or_create_pending_order_for_checkout(db, user)
        order_id_db = order.id
    except Exception as e:
        raise ConflictError(f"No se pudo crear la orden: {str(e)}")

    cart_total = get_user_cart_total(db, user)
    amount, currency = build_paypal_amount(cart_total)
    reference = build_internal_reference(user, "paypal")
    access_token = _paypal_access_token()

    payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "custom_id": f"order_{order_id_db}",  # Referencia a la orden en BD
                "description": "Compra en Movil Dev",
                "amount": {"currency_code": currency, "value": amount},
                "shipping": {
                    "name": {"full_name": customer.nombre},
                    "address": {
                        "address_line_1": customer.direccion,
                        "admin_area_2": customer.ciudad,
                        "country_code": "CO",
                    },
                },
            }
        ],
        "application_context": {
            "brand_name": "Movil Dev",
            "landing_page": "NO_PREFERENCE",
            "user_action": "PAY_NOW",
            "return_url": f"{_frontend_url()}/success?provider=paypal&order_id={order_id_db}",
            "cancel_url": f"{_frontend_url()}/cancel",
        },
    }

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
        raise ConflictError(_paypal_error_message(response, "No se pudo crear la orden en PayPal."))

    data = response.json()
    approve_url = next(
        (link["href"] for link in data.get("links", []) if link.get("rel") == "approve"),
        "",
    )

    if not approve_url:
        raise ConflictError("PayPal no retorno una URL de aprobacion.")

    return {
        "order_id": data["id"],
        "url": approve_url,
        "amount": amount,
        "currency": currency,
        "invoice": reference,
        "db_order_id": order_id_db,
    }


def capture_paypal_order(order_id: str) -> dict[str, Any]:
    if not order_id:
        raise ConflictError("Token de PayPal no encontrado.")

    access_token = _paypal_access_token()
    response = requests.post(
        f"{_paypal_api_base()}/v2/checkout/orders/{order_id}/capture",
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        timeout=20,
    )

    if response.status_code >= 400:
        raise ConflictError(_paypal_error_message(response, "No se pudo capturar el pago en PayPal."))

    data = response.json()
    status = data.get("status", "")
    return {"success": status == "COMPLETED", "order_id": data.get("id", order_id), "status": status}


def _epayco_access_token() -> str:
    public_key = _env("EPAYCO_PUBLIC_KEY") or _env("PUBLIC_KEY")
    private_key = _env("EPAYCO_PRIVATE_KEY")

    if not public_key or not private_key:
        raise ConflictError("Faltan EPAYCO_PUBLIC_KEY y EPAYCO_PRIVATE_KEY en el backend.")

    credentials = base64.b64encode(f"{public_key}:{private_key}".encode("utf-8")).decode("ascii")
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


def create_epayco_session(
    *,
    db: Session,
    user: User,
    customer: Any,
) -> dict[str, Any]:
    from orders.services import get_or_create_pending_order_for_checkout

    try:
        order = get_or_create_pending_order_for_checkout(db, user)
        order_id_db = order.id
    except Exception as e:
        raise ConflictError(f"No se pudo crear la orden: {str(e)}")

    amount = round(get_user_cart_total(db, user), 2)
    invoice = build_invoice(user, "epayco")
    access_token = _epayco_access_token()

    payload = {
        "checkout_version": "2",
        "name": "Movil Dev",
        "description": "Compra de productos Movil Dev",
        "currency": "COP",
        "amount": amount,
        "country": "CO",
        "lang": "ES",
        "invoice": invoice,
        "extras": {
            "extra1": str(user.id),
            "extra2": customer.nombre,
            "extra3": customer.telefono,
            "extra4": customer.direccion,
            "extra5": customer.ciudad,
        },
    }

    response_url = f"{_frontend_url()}/success?provider=epayco&order_id={order_id_db}"
    confirmation_url = _env(
        "EPAYCO_CONFIRMATION_URL",
        f"{_backend_url()}/payments/epayco/confirmation",
    )

    if _is_public_https_url(response_url):
        payload["response"] = response_url

    if _is_public_https_url(confirmation_url):
        payload["confirmation"] = confirmation_url

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
            _epayco_error_message(response, "No se pudo crear la sesion de pago en ePayco.")
        )

    data = response.json()
    if data.get("success") is False:
        raise ConflictError(
            _epayco_error_message(data, "No se pudo crear la sesion de pago en ePayco.")
        )

    session_data = data.get("data") or {}
    session_id = (
        session_data.get("sessionId")
        or session_data.get("sessionID")
        or session_data.get("session_id")
        or data.get("sessionId")
        or data.get("sessionID")
        or data.get("session_id")
    )

    if not session_id:
        raise ConflictError(_epayco_error_message(data, "ePayco no retorno el ID de sesion."))

    return {
        "session_id": session_id,
        "token": session_data.get("token"),
        "invoice": invoice,
        "amount": amount,
        "currency": "COP",
        "db_order_id": order_id_db,
    }
