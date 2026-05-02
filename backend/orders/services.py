import os
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

from cart.services import clear_user_cart, compute_cart_totals, list_items_for_user
from orders.models import (
    Order,
    OrderItem,
    OrderRefund,
    OrderStatus,
    OrderStatusHistory,
    RefundType,
)
from products.models import Product
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ConflictError, ForbiddenError, NotFoundError

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


def _refunded_total(order: Order) -> Decimal:
    return sum((Decimal(str(r.amount)) for r in order.refunds), Decimal("0.00"))


def create_order_from_cart(db: Session, user: User) -> Order:
    cart_items = list_items_for_user(db, user_id=user.id)
    if not cart_items:
        raise ConflictError("El carrito esta vacio.")

    items = []
    locked_products: dict[int, Product] = {}
    for cart_item in cart_items:
        product = (
            db.query(Product)
            .filter(Product.id == cart_item.product_id)
            .with_for_update()
            .first()
        )
        if not product or not product.is_active:
            raise ConflictError(f"Producto {cart_item.product_id} no disponible.")
        if float(product.precio_unitario) != float(cart_item.price):
            raise ConflictError(f"Precio de producto {product.nombre} ha cambiado.")
        if product.cantidad_stock < cart_item.quantity:
            raise ConflictError(
                f"Stock insuficiente para '{product.nombre}'. "
                f"Disponible: {product.cantidad_stock}, solicitado: {cart_item.quantity}."
            )
        locked_products[cart_item.product_id] = product
        items.append(cart_item)

    from cart.schemas import CartItemResponse

    cart_item_responses = [
        CartItemResponse(
            id=ci.id,
            product_id=ci.product_id,
            referencia=getattr(ci, "referencia", ""),
            nombre=getattr(ci, "nombre", ""),
            imagen_url=getattr(ci, "imagen_url", None),
            quantity=ci.quantity,
            price=ci.price,
            line_total=ci.price * ci.quantity,
        )
        for ci in items
    ]
    totals = compute_cart_totals(items=cart_item_responses, tax_percent=19, shipping_fee=0)

    order = Order(
        user_id=user.id,
        status=OrderStatus.PENDING,
        subtotal=totals.subtotal,
        tax=totals.tax_amount,
        total=totals.total,
    )
    db.add(order)
    db.flush()

    for ci in items:
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=ci.product_id,
                quantity=ci.quantity,
                price=ci.price,
            )
        )
        locked_products[ci.product_id].cantidad_stock -= ci.quantity

    _create_status_history(
        db,
        order=order,
        from_status=None,
        to_status=OrderStatus.PENDING,
        actor_user_id=user.id,
        reason="Creacion de orden",
    )

    db.commit()
    db.refresh(order)
    return order


def _pending_order_matches_cart(order: Order, cart_items: list) -> bool:
    if len(order.items) != len(cart_items):
        return False

    cart_items_by_product = {item.product_id: item for item in cart_items}
    for order_item in order.items:
        cart_item = cart_items_by_product.get(order_item.product_id)
        if not cart_item:
            return False
        if order_item.quantity != cart_item.quantity:
            return False
        if float(order_item.price) != float(cart_item.price):
            return False

    return True


def get_or_create_pending_order_for_checkout(db: Session, user: User) -> Order:
    cart_items = list_items_for_user(db, user_id=user.id)
    if not cart_items:
        raise ConflictError("El carrito esta vacio.")

    pending_order = (
        db.query(Order)
        .filter(Order.user_id == user.id, Order.status == OrderStatus.PENDING)
        .order_by(Order.created_at.desc())
        .first()
    )

    if pending_order and _pending_order_matches_cart(pending_order, cart_items):
        return pending_order

    return create_order_from_cart(db, user)


def save_checkout_customer(
    db: Session,
    *,
    order: Order,
    customer: Any,
    provider: str,
    payment_method: str,
) -> Order:
    order.customer_name = getattr(customer, "nombre", None)
    order.customer_email = getattr(customer, "correo", None)
    order.customer_phone = getattr(customer, "telefono", None)
    order.delivery_address = getattr(customer, "direccion", None)
    order.delivery_city = getattr(customer, "ciudad", None)
    order.payment_provider = provider
    order.payment_method = payment_method
    db.commit()
    db.refresh(order)
    return order


def update_order_status(
    db: Session,
    order_id: int,
    status: str,
    *,
    actor_user_id: int | None = None,
    reason: str | None = None,
) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")

    previous_status = order.status

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
    return order


def mark_order_paid(
    db: Session,
    order_id: int,
    *,
    provider: str | None = None,
    payment_method: str | None = None,
) -> Order:
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


def ensure_order_invoice_pdf(db: Session, order: Order):
    from orders.invoice_template import generate_invoice_pdf

    pdf_path = generate_invoice_pdf(db, order)
    order.invoice_pdf_path = str(pdf_path)
    return pdf_path


def _ensure_paid_invoice(db: Session, order: Order) -> None:
    if order.paid_at is None:
        order.paid_at = datetime.now(timezone.utc)

    pdf_path = ensure_order_invoice_pdf(db, order)

    recipient = order.customer_email
    if not recipient:
        user = db.get(User, order.user_id)
        recipient = user.email if user else None

    if not recipient:
        return

    recipient = recipient.strip().lower()
    if (
        order.invoice_email_sent_to == recipient
        and order.invoice_email_sent_at is not None
    ):
        return

    try:
        from orders.invoice_template import send_invoice_email

        if send_invoice_email(
            recipient_email=recipient,
            invoice_pdf_path=pdf_path,
            order=order,
        ):
            order.invoice_email_sent_to = recipient
            order.invoice_email_sent_at = datetime.now(timezone.utc)
    except Exception as exc:
        print(f"[INVOICE EMAIL ERROR] No se pudo enviar factura de orden {order.id}: {exc}")


def send_order_invoice_email(db: Session, order_id: int, *, force: bool = False) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")
    if order.status != OrderStatus.PAID:
        raise ConflictError("Solo se puede enviar factura de una orden con pago exitoso.")
    if not order.customer_email:
        raise ConflictError("La orden no tiene correo de facturacion.")

    from orders.invoice_template import send_invoice_email

    pdf_path = ensure_order_invoice_pdf(db, order)
    recipient = order.customer_email.strip().lower()

    if (
        not force
        and order.invoice_email_sent_to == recipient
        and order.invoice_email_sent_at is not None
    ):
        db.commit()
        db.refresh(order)
        return order

    try:
        was_sent = send_invoice_email(
            recipient_email=recipient,
            invoice_pdf_path=pdf_path,
            order=order,
        )
    except Exception as exc:
        raise ConflictError(f"No se pudo enviar la factura por Mailtrap: {exc}") from exc

    if not was_sent:
        raise ConflictError("No se pudo enviar la factura. Revisa la configuracion de Mailtrap.")

    order.invoice_email_sent_to = recipient
    order.invoice_email_sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order
