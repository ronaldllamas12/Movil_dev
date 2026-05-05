from __future__ import annotations

from pathlib import Path

import pytest

from cart.services import add_item_for_user
from database.core.errors import ConflictError, NotFoundError
from orders.invoice_service import ensure_order_invoice_pdf, send_order_invoice_email
from orders.models import OrderStatus
from orders.services import create_order_from_cart


class DummyGenerator:
    def __init__(self, path: str = "generated/invoices/test.pdf"):
        self.path = path

    def generate(self, db, order):
        return self.path


def _create_paid_order(db_session, make_user, make_product, email: str = "buyer@example.com"):
    user = make_user(email=email)
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)
    order = create_order_from_cart(db_session, user)
    order.status = OrderStatus.PAID
    order.customer_email = email
    db_session.commit()
    db_session.refresh(order)
    return order


def test_ensure_order_invoice_pdf_sets_resolved_path(db_session, make_user, make_product):
    order = _create_paid_order(db_session, make_user, make_product)

    pdf_path = ensure_order_invoice_pdf(db_session, order, generator=DummyGenerator())

    assert isinstance(pdf_path, Path)
    assert order.invoice_pdf_path is not None


def test_send_order_invoice_email_rejects_not_found(db_session):
    with pytest.raises(NotFoundError):
        send_order_invoice_email(db_session, 999999)


def test_send_order_invoice_email_rejects_unpaid_order(db_session, make_user, make_product):
    user = make_user(email="pending@example.com")
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)
    order = create_order_from_cart(db_session, user)

    with pytest.raises(ConflictError, match="pago"):
        send_order_invoice_email(db_session, order.id)


def test_send_order_invoice_email_rejects_without_customer_email(db_session, make_user, make_product):
    order = _create_paid_order(db_session, make_user, make_product)
    order.customer_email = None
    db_session.commit()

    with pytest.raises(ConflictError, match="correo"):
        send_order_invoice_email(db_session, order.id)


def test_send_order_invoice_email_success_and_idempotent(monkeypatch, db_session, make_user, make_product):
    order = _create_paid_order(db_session, make_user, make_product)

    monkeypatch.setattr("orders.invoice_service.ensure_order_invoice_pdf", lambda db, order: Path("generated/invoices/ok.pdf"))
    monkeypatch.setattr("orders.invoice_service.send_invoice_email", lambda **kwargs: True)

    updated = send_order_invoice_email(db_session, order.id)
    assert updated.invoice_email_sent_to == "buyer@example.com"
    assert updated.invoice_email_sent_at is not None

    second = send_order_invoice_email(db_session, order.id)
    assert second.id == updated.id


def test_send_order_invoice_email_force_resends(monkeypatch, db_session, make_user, make_product):
    order = _create_paid_order(db_session, make_user, make_product)

    calls = {"n": 0}

    def fake_send(**kwargs):
        calls["n"] += 1
        return True

    monkeypatch.setattr("orders.invoice_service.ensure_order_invoice_pdf", lambda db, order: Path("generated/invoices/ok.pdf"))
    monkeypatch.setattr("orders.invoice_service.send_invoice_email", fake_send)

    send_order_invoice_email(db_session, order.id)
    send_order_invoice_email(db_session, order.id, force=True)

    assert calls["n"] == 2


def test_send_order_invoice_email_raises_on_false_or_exception(monkeypatch, db_session, make_user, make_product):
    order = _create_paid_order(db_session, make_user, make_product)

    monkeypatch.setattr("orders.invoice_service.ensure_order_invoice_pdf", lambda db, order: Path("generated/invoices/ok.pdf"))
    monkeypatch.setattr("orders.invoice_service.send_invoice_email", lambda **kwargs: False)

    with pytest.raises(ConflictError, match="SMTP"):
        send_order_invoice_email(db_session, order.id)

    def fail_send(**kwargs):
        raise RuntimeError("smtp down")

    monkeypatch.setattr("orders.invoice_service.send_invoice_email", fail_send)
    with pytest.raises(ConflictError, match="SMTP"):
        send_order_invoice_email(db_session, order.id, force=True)
