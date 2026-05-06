"""Servicio de transiciones de estado de ordenes."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from decimal import Decimal

from cart.services import clear_user_cart
from orders.models import (
    Order,
    OrderRefund,
    OrderStatus,
    OrderStatusHistory,
    RefundType,
)
from products.models import Product
from sqlalchemy.orm import Session

from database.core.errors import ConflictError, ForbiddenError, NotFoundError
from orders.whatsapp_service import send_order_status_whatsapp

_CANCELLATION_WINDOW_MINUTES = int(os.getenv("ORDER_CANCELLATION_WINDOW_MINUTES", "30"))

_ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    OrderStatus.PENDING: {OrderStatus.PAID, OrderStatus.CANCELLED},
    OrderStatus.PAID: {OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.REFUNDED},
    OrderStatus.PROCESSING: {OrderStatus.SHIPPED, OrderStatus.CANCELLED, OrderStatus.REFUNDED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED, OrderStatus.REFUNDED},
    OrderStatus.DELIVERED: {OrderStatus.REFUNDED},
    OrderStatus.CANCELLED: set(),
    OrderStatus.REFUNDED: set(),
}


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _refunded_total(order: Order) -> Decimal:
    return sum((Decimal(str(r.amount)) for r in order.refunds), Decimal("0.00"))


def _create_status_history(
    db: Session,
    *,
    order: Order,
    from_status: str | None,
    to_status: str,
    actor_user_id: int | None,
    reason: str | None,
) -> None:
    db.add(
        OrderStatusHistory(
            order_id=order.id,
            from_status=from_status,
            to_status=to_status,
            actor_user_id=actor_user_id,
            reason=reason,
        )
    )


def _transition_order_status(
    db: Session,
    *,
    order: Order,
    to_status: str,
    actor_user_id: int | None = None,
    reason: str | None = None,
    allow_noop: bool = True,
) -> None:
    if to_status not in OrderStatus.ALL:
        raise ConflictError(f"Estado de orden no valido: {to_status}")

    from_status = order.status
    if from_status == to_status:
        if allow_noop:
            return
        raise ConflictError(f"La orden ya esta en estado '{to_status}'.")

    allowed = _ALLOWED_TRANSITIONS.get(from_status, set())
    if to_status not in allowed:
        raise ConflictError(
            f"Transicion invalida de '{from_status}' a '{to_status}'."
        )

    order.status = to_status
    if to_status == OrderStatus.PAID and order.paid_at is None:
        order.paid_at = datetime.now(timezone.utc)
    if to_status == OrderStatus.CANCELLED:
        order.cancelled_at = datetime.now(timezone.utc)
        order.cancellation_reason = reason

    _create_status_history(
        db,
        order=order,
        from_status=from_status,
        to_status=to_status,
        actor_user_id=actor_user_id,
        reason=reason,
    )


def _whatsapp_product_names(db: Session, order: Order) -> list[str]:
    product_ids = [item.product_id for item in order.items if item.product_id]
    if not product_ids:
        return []

    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    product_map = {product.id: product.nombre for product in products}

    names: list[str] = []
    for item in order.items:
        product_name = product_map.get(item.product_id)
        if not product_name:
            continue
        qty = int(getattr(item, "quantity", 1) or 1)
        names.append(f"{product_name} x{qty}")

    return names


def update_order_status(
    db: Session,
    order_id: int,
    status: str,
    *,
    actor_user_id: int | None = None,
    reason: str | None = None,
    shipping_company: str | None = None,
    tracking_number: str | None = None,
) -> Order:
    from orders.invoice_service import _ensure_paid_invoice

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")

    previous_status = order.status

    if status == OrderStatus.SHIPPED:
        shipping_company_value = (shipping_company or "").strip()
        tracking_number_value = (tracking_number or "").strip()

        if not shipping_company_value or not tracking_number_value:
            raise ConflictError(
                "Para marcar como enviado debes registrar empresa transportadora y numero de guia."
            )

        order.shipping_company = shipping_company_value
        order.tracking_number = tracking_number_value

    _transition_order_status(
        db,
        order=order,
        to_status=status,
        actor_user_id=actor_user_id,
        reason=reason,
    )
    if status == OrderStatus.PAID and previous_status != OrderStatus.PAID:
        clear_user_cart(db, user_id=order.user_id)
    if status == OrderStatus.PAID:
        _ensure_paid_invoice(db, order)

    db.commit()
    db.refresh(order)

    send_order_status_whatsapp(
        phone=order.customer_phone,
        order_id=order.id,
        status=order.status,
        total=float(order.total) if order.total is not None else None,
        address=order.delivery_address,
        customer_name=order.customer_name,
        product_names=_whatsapp_product_names(db, order),
        shipping_company=order.shipping_company,
        tracking_number=order.tracking_number,
    )

    return order


def mark_order_paid(
    db: Session,
    order_id: int,
    *,
    provider: str | None = None,
    payment_method: str | None = None,
) -> Order:
    from orders.invoice_service import _ensure_paid_invoice

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")

    if provider:
        order.payment_provider = provider
    if payment_method:
        order.payment_method = payment_method

    became_paid = order.status != OrderStatus.PAID
    if became_paid:
        _transition_order_status(
            db,
            order=order,
            to_status=OrderStatus.PAID,
            actor_user_id=None,
            reason="Confirmacion de pasarela",
        )
        clear_user_cart(db, user_id=order.user_id)

    _ensure_paid_invoice(db, order)
    db.commit()
    db.refresh(order)

    if became_paid:
        send_order_status_whatsapp(
            phone=order.customer_phone,
            order_id=order.id,
            status=order.status,
            total=float(order.total) if order.total is not None else None,
            address=order.delivery_address,
            customer_name=order.customer_name,
            product_names=_whatsapp_product_names(db, order),
            shipping_company=order.shipping_company,
            tracking_number=order.tracking_number,
        )

    return order


def cancel_order_by_user(
    db: Session,
    order_id: int,
    user_id: int,
    reason: str | None = None,
) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")
    if order.user_id != user_id:
        raise ForbiddenError("No tienes permiso para cancelar esta orden.")

    if order.status not in {OrderStatus.PENDING, OrderStatus.PAID}:
        raise ConflictError(
            "Solo puedes cancelar ordenes en estado pending o paid."
        )

    age_minutes = (
        datetime.now(timezone.utc) - _as_utc(order.created_at)
    ).total_seconds() / 60
    if age_minutes > _CANCELLATION_WINDOW_MINUTES:
        raise ConflictError(
            "La ventana de cancelacion expiro. "
            f"Maximo permitido: {_CANCELLATION_WINDOW_MINUTES} minutos."
        )

    for item in order.items:
        product = (
            db.query(Product)
            .filter(Product.id == item.product_id)
            .with_for_update()
            .first()
        )
        if product:
            product.cantidad_stock += item.quantity

    _transition_order_status(
        db,
        order=order,
        to_status=OrderStatus.CANCELLED,
        actor_user_id=user_id,
        reason=reason or "Cancelada por cliente",
    )

    db.commit()
    db.refresh(order)
    return order


def refund_order(
    db: Session,
    *,
    order_id: int,
    actor_user_id: int | None,
    refund_type: str,
    amount: float | None,
    reason: str | None,
) -> Order:
    order = (
        db.query(Order)
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise NotFoundError("Orden no encontrada.")

    if order.status not in {
        OrderStatus.PAID,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
    }:
        raise ConflictError("El estado actual de la orden no permite reembolsos.")

    if refund_type not in {RefundType.PARTIAL, RefundType.TOTAL}:
        raise ConflictError("Tipo de reembolso invalido. Usa 'partial' o 'total'.")

    total_amount = Decimal(str(order.total))
    already_refunded = _refunded_total(order)
    remaining = total_amount - already_refunded

    if remaining <= Decimal("0.00"):
        raise ConflictError("La orden ya fue reembolsada completamente.")

    if refund_type == RefundType.TOTAL:
        target_amount = remaining
    else:
        if amount is None:
            raise ConflictError("Debes enviar 'amount' para reembolso parcial.")
        target_amount = Decimal(str(amount))
        if target_amount <= Decimal("0.00"):
            raise ConflictError("El monto de reembolso debe ser mayor a cero.")
        if target_amount > remaining:
            raise ConflictError(
                f"Monto excede el saldo reembolsable ({remaining})."
            )

    db.add(
        OrderRefund(
            order_id=order.id,
            amount=float(target_amount),
            refund_type=refund_type,
            reason=reason,
            actor_user_id=actor_user_id,
        )
    )

    if target_amount == remaining:
        _transition_order_status(
            db,
            order=order,
            to_status=OrderStatus.REFUNDED,
            actor_user_id=actor_user_id,
            reason=reason or "Reembolso total",
        )

    db.commit()
    db.refresh(order)
    return order
