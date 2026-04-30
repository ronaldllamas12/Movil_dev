from datetime import datetime, timezone
from typing import Any

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
    totals = compute_cart_totals(items=cart_item_responses, tax_percent=19, shipping_fee=0)

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


def update_order_status(db: Session, order_id: int, status: str):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ConflictError("Orden no encontrada.")
    order.status = status
    if status == "paid":
        _ensure_paid_invoice(db, order)
    db.commit()
    db.refresh(order)
    return order


def save_checkout_customer(
    db: Session,
    *,
    order: Order,
    customer: Any,
    provider: str,
    payment_method: str,
) -> Order:
    """Persiste los datos necesarios para facturar la orden."""
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


def mark_order_paid(
    db: Session,
    order_id: int,
    *,
    provider: str | None = None,
    payment_method: str | None = None,
) -> Order:
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ConflictError("Orden no encontrada.")

    if provider:
        order.payment_provider = provider
    if payment_method:
        order.payment_method = payment_method

    order.status = "paid"
    _ensure_paid_invoice(db, order)
    db.commit()
    db.refresh(order)
    return order


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
    if order.invoice_email_sent_to == recipient and order.invoice_email_sent_at is not None:
        return

    try:
        was_sent = send_invoice_email(recipient_email=recipient, invoice_pdf_path=pdf_path, order=order)
        if was_sent:
            order.invoice_email_sent_to = recipient
            order.invoice_email_sent_at = datetime.now(timezone.utc)
    except Exception as exc:
        print(f"[INVOICE EMAIL ERROR] No se pudo enviar factura de orden {order.id}: {exc}")


def ensure_order_invoice_pdf(db: Session, order: Order):
    """Genera o regenera el PDF de factura y guarda su ruta en la orden."""
    from orders.invoice_template import generate_invoice_pdf

    pdf_path = generate_invoice_pdf(db, order)
    order.invoice_pdf_path = str(pdf_path)
    return pdf_path


def send_order_invoice_email(db: Session, order_id: int, *, force: bool = False) -> Order:
    """Envia la factura al correo de facturacion capturado en checkout."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise ConflictError("Orden no encontrada.")

    if order.status != "paid":
        raise ConflictError("Solo se puede enviar factura de una orden con pago exitoso.")

    if not order.customer_email:
        raise ConflictError("La orden no tiene correo de facturación.")


    from orders.invoice_template import send_invoice_email

    pdf_path = ensure_order_invoice_pdf(db, order)
    recipient = order.customer_email.strip().lower()

    if not force and order.invoice_email_sent_to == recipient and order.invoice_email_sent_at is not None:
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
        raise ConflictError("No se pudo enviar la factura. Revisa la configuración de Mailtrap.")

    order.invoice_email_sent_to = recipient
    order.invoice_email_sent_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(order)
    return order
