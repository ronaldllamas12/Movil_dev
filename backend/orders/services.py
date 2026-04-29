from cart.services import compute_cart_totals, list_items_for_user
from datetime import datetime, timezone
from orders.models import Order, OrderItem
from products.models import Product
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ConflictError


ORDER_STATUSES = {
    "pending",
    "paid",
    "shipped",
    "delivered",
    "cancelled",
    "refunded",
}

ALLOWED_STATUS_TRANSITIONS: dict[str, set[str]] = {
    "pending": {"paid", "cancelled"},
    "paid": {"shipped", "cancelled", "refunded"},
    "shipped": {"delivered", "refunded"},
    "delivered": {"refunded"},
    "cancelled": set(),
    "refunded": set(),
}

def create_order_from_cart(db: Session, user: User) -> Order:
    # Obtener items del carrito
    cart_items = list_items_for_user(db, user_id=user.id)
    if not cart_items:
        raise ConflictError("El carrito está vacío.")

    # Validar productos y precios
    items = []
    for cart_item in cart_items:
        product = db.get(Product, cart_item.product_id)
        if not product or not product.is_active:
            raise ConflictError(f"Producto {cart_item.product_id} no disponible.")
        if float(product.precio_unitario) != float(cart_item.price):
            raise ConflictError(f"Precio de producto {product.nombre} ha cambiado.")
        items.append(cart_item)

    # Calcular totales
    from cart.schemas import CartItemResponse
    cart_item_responses = [
        CartItemResponse(
            id=ci.id,
            product_id=ci.product_id,
            referencia=getattr(ci, 'referencia', ''),
            nombre=getattr(ci, 'nombre', ''),
            imagen_url=getattr(ci, 'imagen_url', None),
            quantity=ci.quantity,
            price=ci.price,
            line_total=ci.price * ci.quantity,
        ) for ci in items
    ]
    settings = db.query(Product).first()  # Dummy, replace with real tax/shipping
    totals = compute_cart_totals(items=cart_item_responses, tax_percent=21, shipping_fee=0)

    # Crear la orden
    order = Order(
        user_id=user.id,
        status="pending",
        subtotal=totals.subtotal,
        tax=totals.tax_amount,
        total=totals.total,
    )
    db.add(order)
    db.flush()  # Para obtener order.id

    # Crear los items de la orden
    for ci in items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=ci.product_id,
            quantity=ci.quantity,
            price=ci.price,
        )
        db.add(order_item)
    db.commit()
    db.refresh(order)
    return order


def _pending_order_matches_cart(order: Order, cart_items: list) -> bool:
    if len(order.items) != len(cart_items):
        return False

    cart_items_by_product = {
        item.product_id: item for item in cart_items
    }

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
        raise ConflictError("El carrito está vacío.")

    pending_order = (
        db.query(Order)
        .filter(Order.user_id == user.id, Order.status == "pending")
        .order_by(Order.created_at.desc())
        .first()
    )

    if pending_order and _pending_order_matches_cart(pending_order, cart_items):
        return pending_order

    return create_order_from_cart(db, user)


def update_order_status(db: Session, order_id: int, status: str, reason: str | None = None):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ConflictError("Orden no encontrada.")
    next_status = str(status or "").strip().lower()
    if next_status not in ORDER_STATUSES:
        raise ConflictError("Estado inválido para la orden.")

    current_status = str(order.status or "").strip().lower()
    allowed = ALLOWED_STATUS_TRANSITIONS.get(current_status, set())
    if next_status != current_status and next_status not in allowed:
        raise ConflictError(
            f"No se puede cambiar estado de '{current_status}' a '{next_status}'."
        )

    if next_status != current_status:
        now = datetime.now(timezone.utc)
        normalized_reason = str(reason or "").strip() or None

        if next_status == "cancelled":
            order.cancelled_at = now
            order.cancelled_reason = normalized_reason

        if next_status == "delivered":
            order.delivered_at = now

        if next_status == "refunded":
            order.refunded_at = now
            order.refunded_reason = normalized_reason

    order.status = next_status
    db.commit()
    db.refresh(order)
    return order
