"""Unit tests for order status transitions and refunds."""

from datetime import datetime, timedelta, timezone

import pytest

from cart.services import add_item_for_user
from database.core.errors import ConflictError, ForbiddenError, NotFoundError
from orders.creation_service import create_order_from_cart
from orders.models import OrderStatus, RefundType
from orders.status_service import (
    _as_utc,
    _transition_order_status,
    cancel_order_by_user,
    mark_order_paid,
    refund_order,
)


def _build_pending_order(db_session, make_user, make_product, *, email: str):
    user = make_user(email=email)
    product = make_product(precio_unitario=100000, cantidad_stock=10)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=2)
    order = create_order_from_cart(db_session, user)
    return user, product, order


def test_as_utc_converts_naive_and_preserves_aware():
    naive = datetime(2026, 1, 1, 12, 0, 0)
    aware = datetime(2026, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    out_naive = _as_utc(naive)
    out_aware = _as_utc(aware)

    assert out_naive.tzinfo == timezone.utc
    assert out_aware.tzinfo == timezone.utc


def test_transition_order_status_rejects_invalid_target(db_session, make_user, make_product):
    _, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="transition-invalid@example.com",
    )

    with pytest.raises(ConflictError, match="no valido"):
        _transition_order_status(db_session, order=order, to_status="not-a-status")


def test_transition_order_status_rejects_invalid_transition(db_session, make_user, make_product):
    _, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="transition-forbidden@example.com",
    )

    with pytest.raises(ConflictError, match="Transicion invalida"):
        _transition_order_status(db_session, order=order, to_status=OrderStatus.SHIPPED)


def test_transition_order_status_rejects_noop_when_disabled(db_session, make_user, make_product):
    _, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="transition-noop@example.com",
    )

    with pytest.raises(ConflictError, match="ya esta"):
        _transition_order_status(
            db_session,
            order=order,
            to_status=OrderStatus.PENDING,
            allow_noop=False,
        )


def test_cancel_order_by_user_rejects_forbidden_user(db_session, make_user, make_product):
    owner, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="cancel-owner@example.com",
    )
    other = make_user(email="cancel-other@example.com")

    with pytest.raises(ForbiddenError):
        cancel_order_by_user(db_session, order_id=order.id, user_id=other.id)

    assert owner.id != other.id


def test_cancel_order_by_user_rejects_expired_window(db_session, make_user, make_product):
    user, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="cancel-expired@example.com",
    )
    order.created_at = datetime.now(timezone.utc) - timedelta(minutes=120)
    db_session.commit()

    with pytest.raises(ConflictError, match="ventana de cancelacion expiro"):
        cancel_order_by_user(db_session, order_id=order.id, user_id=user.id)


def test_cancel_order_by_user_restores_stock_and_sets_cancelled(db_session, make_user, make_product):
    user, product, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="cancel-ok@example.com",
    )
    original_stock = product.cantidad_stock

    cancelled = cancel_order_by_user(
        db_session,
        order_id=order.id,
        user_id=user.id,
        reason="No lo necesito",
    )

    db_session.refresh(product)
    assert cancelled.status == OrderStatus.CANCELLED
    assert product.cantidad_stock == original_stock + 2


def test_mark_order_paid_sets_provider_and_status(db_session, make_user, make_product, monkeypatch):
    user, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="mark-paid@example.com",
    )

    monkeypatch.setattr("orders.status_service.send_order_status_whatsapp", lambda **_: None)
    monkeypatch.setattr("orders.invoice_service._ensure_paid_invoice", lambda *_: None)

    paid = mark_order_paid(
        db_session,
        order.id,
        provider="paypal",
        payment_method="Tarjeta/PayPal",
    )

    assert paid.status == OrderStatus.PAID
    assert paid.user_id == user.id
    assert paid.payment_provider == "paypal"


def test_refund_order_validates_type_and_amount(db_session, make_user, make_product, monkeypatch):
    _, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="refund-validate@example.com",
    )

    monkeypatch.setattr("orders.status_service.send_order_status_whatsapp", lambda **_: None)
    monkeypatch.setattr("orders.invoice_service._ensure_paid_invoice", lambda *_: None)
    mark_order_paid(db_session, order.id)

    with pytest.raises(ConflictError, match="Tipo de reembolso invalido"):
        refund_order(
            db_session,
            order_id=order.id,
            actor_user_id=None,
            refund_type="bad",
            amount=None,
            reason=None,
        )

    with pytest.raises(ConflictError, match="Debes enviar 'amount'"):
        refund_order(
            db_session,
            order_id=order.id,
            actor_user_id=None,
            refund_type=RefundType.PARTIAL,
            amount=None,
            reason=None,
        )


def test_refund_order_partial_and_total_transition(db_session, make_user, make_product, monkeypatch):
    _, _, order = _build_pending_order(
        db_session,
        make_user,
        make_product,
        email="refund-flow@example.com",
    )

    monkeypatch.setattr("orders.status_service.send_order_status_whatsapp", lambda **_: None)
    monkeypatch.setattr("orders.invoice_service._ensure_paid_invoice", lambda *_: None)
    mark_order_paid(db_session, order.id)

    partial = refund_order(
        db_session,
        order_id=order.id,
        actor_user_id=1,
        refund_type=RefundType.PARTIAL,
        amount=50000,
        reason="Ajuste",
    )
    assert partial.status == OrderStatus.PAID

    total = refund_order(
        db_session,
        order_id=order.id,
        actor_user_id=1,
        refund_type=RefundType.TOTAL,
        amount=None,
        reason="Completo",
    )
    assert total.status == OrderStatus.REFUNDED


def test_mark_order_paid_raises_not_found(db_session):
    with pytest.raises(NotFoundError):
        mark_order_paid(db_session, 999999)
