"""Servicio de creacion de ordenes."""

from __future__ import annotations

from typing import Any

from cart.services import (
    compute_cart_totals,
    decrease_color_variant_stock,
    list_items_for_user,
    resolve_color_and_stock_limit,
)
from orders.models import Order, OrderItem, OrderStatus
from products.models import Product
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ConflictError


def _pending_order_matches_cart(order: Order, cart_items: list) -> bool:
    if len(order.items) != len(cart_items):
        return False

    cart_items_by_product_color = {
        (item.product_id, (item.color_selected or "").strip().lower()): item
        for item in cart_items
    }
    for order_item in order.items:
        key = (order_item.product_id, (order_item.color_selected or "").strip().lower())
        cart_item = cart_items_by_product_color.get(key)
        if not cart_item:
            return False
        if order_item.quantity != cart_item.quantity:
            return False
        if float(order_item.price) != float(cart_item.price):
            return False

    return True


def create_order_from_cart(db: Session, user: User) -> Order:
    from orders.status_service import _create_status_history

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
        normalized_color, stock_limit = resolve_color_and_stock_limit(
            product,
            cart_item.color_selected,
        )
        if cart_item.quantity > stock_limit:
            if normalized_color:
                raise ConflictError(
                    f"Stock insuficiente para '{product.nombre}' en color '{normalized_color}'. "
                    f"Disponible: {stock_limit}, solicitado: {cart_item.quantity}."
                )
            raise ConflictError(
                f"Stock insuficiente para '{product.nombre}'. "
                f"Disponible: {stock_limit}, solicitado: {cart_item.quantity}."
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
            color_selected=getattr(ci, "color_selected", None),
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
                color_selected=ci.color_selected or None,
                quantity=ci.quantity,
                price=ci.price,
            )
        )
        decrease_color_variant_stock(
            locked_products[ci.product_id],
            color_selected=ci.color_selected,
            quantity=ci.quantity,
        )

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
