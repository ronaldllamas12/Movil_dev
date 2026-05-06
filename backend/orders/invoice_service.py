"""Servicio de facturas y envio por email."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from orders.email_service import send_invoice_email
from orders.interfaces import InvoiceGenerator
from orders.models import Order, OrderStatus
from orders.path_utils import resolve_invoice_pdf_path
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ConflictError, NotFoundError


def _default_generator() -> InvoiceGenerator:
    from orders.invoice_template import ReportLabInvoiceGenerator

    return ReportLabInvoiceGenerator()


def ensure_order_invoice_pdf(
    db: Session,
    order: Order,
    generator: InvoiceGenerator | None = None,
) -> Path:
    if generator is None:
        generator = _default_generator()

    generated_path = generator.generate(db, order)
    pdf_path = resolve_invoice_pdf_path(generated_path)
    if pdf_path is None:
        raise ConflictError("No se pudo resolver la ruta de la factura generada.")
    order.invoice_pdf_path = str(pdf_path.resolve())
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
        if send_invoice_email(
            recipient_email=recipient,
            invoice_pdf_path=pdf_path,
            order=order,
        ):
            order.invoice_email_sent_to = recipient
            order.invoice_email_sent_at = datetime.now(timezone.utc)
    except Exception as exc:
        print(f"[INVOICE EMAIL ERROR] No se pudo enviar factura de orden {order.id}: {exc}")


def send_order_invoice_email(
    db: Session,
    order_id: int,
    *,
    force: bool = False,
) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")

    paid_statuses = {
        OrderStatus.PAID,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
        OrderStatus.DELIVERED,
        OrderStatus.REFUNDED,
    }
    if order.status not in paid_statuses:
        raise ConflictError("Solo se puede enviar factura de una orden con pago exitoso.")
    if not order.customer_email:
        raise ConflictError("La orden no tiene correo de facturacion.")

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
        raise ConflictError(f"No se pudo enviar la factura por SMTP: {exc}") from exc

    if not was_sent:
        raise ConflictError("No se pudo enviar la factura. Revisa la configuracion SMTP.")

    order.invoice_email_sent_to = recipient
    order.invoice_email_sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order
