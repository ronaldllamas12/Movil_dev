"""Servicio de notificaciones WhatsApp para cambios de estado de pedidos.

Llama al microservicio Node.js (Baileys) que corre en WA_SERVICE_URL.
Si el servicio no está disponible, registra un aviso y continúa sin error.
"""

from __future__ import annotations

import logging
import os

import requests

logger = logging.getLogger(__name__)

_NOTIFY_STATUSES = {"paid", "processing", "shipped", "delivered", "cancelled", "refunded"}


def send_order_status_whatsapp(
    *,
    phone: str | None,
    order_id: int,
    status: str,
    total: float | None = None,
    address: str | None = None,
    customer_name: str | None = None,
    product_names: list[str] | None = None,
    shipping_company: str | None = None,
    tracking_number: str | None = None,
) -> None:
    """
    Envía una notificación de WhatsApp al cliente sobre el nuevo estado de su pedido.
    Delega al microservicio Node.js/Baileys en WA_SERVICE_URL.
    Incluye nombre del cliente y productos cuando están disponibles.
    Si el servicio no está configurado o falla, sólo registra el evento.
    """
    if not phone:
        logger.debug("Pedido %s: sin teléfono registrado, se omite notificación.", order_id)
        return

    if status not in _NOTIFY_STATUSES:
        logger.debug("Pedido %s: estado '%s' no requiere notificación.", order_id, status)
        return

    service_url = os.getenv("WA_SERVICE_URL", "").rstrip("/")
    if not service_url:
        logger.warning(
            "WA_SERVICE_URL no configurada. No se envió la notificación de WhatsApp "
            "para pedido %s (estado=%s).",
            order_id,
            status,
        )
        return

    payload: dict = {"phone": phone, "order_id": order_id, "status": status}
    if total is not None:
        payload["total"] = total
    if address:
        payload["address"] = address
    if customer_name:
        payload["customer_name"] = customer_name
    if product_names:
        payload["product_names"] = product_names
    if shipping_company:
        payload["shipping_company"] = shipping_company
    if tracking_number:
        payload["tracking_number"] = tracking_number

    try:
        response = requests.post(
            f"{service_url}/api/whatsapp/send-order-status",
            json=payload,
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()
        logger.info(
            "WhatsApp enviado (pedido=%s, estado=%s, sent=%s).",
            order_id,
            status,
            data.get("sent"),
        )
    except requests.exceptions.ConnectionError:
        logger.warning(
            "Microservicio WhatsApp no disponible. No se notificó pedido %s (estado=%s).",
            order_id,
            status,
        )
    except Exception:
        logger.exception("Error al enviar WhatsApp para pedido %s.", order_id)
