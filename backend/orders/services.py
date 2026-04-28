from cart.services import compute_cart_totals, list_items_for_user
from orders.models import Order, OrderItem
from products.models import Product
from sqlalchemy.orm import Session
from users.models import User

from database.core.errors import ConflictError


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


def update_order_status(db: Session, order_id: int, status: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ConflictError("Orden no encontrada.")
    order.status = status
    db.commit()
    db.refresh(order)
    return order
