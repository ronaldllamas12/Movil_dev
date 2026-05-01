"""Pruebas unitarias para servicios de órdenes."""

import pytest

from cart.services import add_item_for_user, list_items_for_user
from database.core.errors import ConflictError
from orders.services import create_order_from_cart, update_order_status


def test_create_order_from_cart_rejects_empty_cart(db_session, make_user):
    user = make_user(email="empty-order@example.com")

    with pytest.raises(ConflictError, match="carrito"):
        create_order_from_cart(db_session, user)


def test_create_order_from_cart_persists_order_and_items(
    db_session,
    make_user,
    make_product,
):
    user = make_user(email="order-user@example.com")
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=2)

    order = create_order_from_cart(db_session, user)

    assert order.id is not None
    assert order.user_id == user.id
    assert order.status == "pending"
    assert float(order.total) == 200000
    assert len(order.items) == 1
    assert order.items[0].quantity == 2


def test_create_order_from_cart_rejects_changed_price(
    db_session,
    make_user,
    make_product,
):
    user = make_user(email="changed-price@example.com")
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)
    product.precio_unitario = 120000
    db_session.commit()

    with pytest.raises(ConflictError, match="Precio"):
        create_order_from_cart(db_session, user)


def test_update_order_status_changes_existing_order(db_session, make_user, make_product):
    user = make_user(email="status-order@example.com")
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)
    order = create_order_from_cart(db_session, user)

    paid_order = update_order_status(db_session, order.id, "paid")

    assert paid_order.status == "paid"
    assert list_items_for_user(db_session, user_id=user.id) == []
