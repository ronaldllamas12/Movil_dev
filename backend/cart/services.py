"""Servicios de negocio para carrito de compras."""

from dataclasses import dataclass

from cart.models import CartItem, CartSettings
from cart.schemas import CartItemResponse
from products.models import Product
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.core.errors import ConflictError, NotFoundError


@dataclass
class CartTotals:
    """Resultado de cálculo de totales de carrito."""

    item_count: int
    subtotal: float
    tax_percent: float
    tax_amount: float
    shipping_fee: float
    total: float


def get_or_create_cart_settings(
    db: Session, *, default_tax_percent: float
) -> CartSettings:
    """Obtiene la configuración global del carrito o crea una por defecto."""
    settings = db.get(CartSettings, 1)
    if settings:
        return settings

    settings = CartSettings(id=1, tax_percent=default_tax_percent)
    db.add(settings)
    db.commit()
    db.refresh(settings)
    return settings


def set_cart_tax_percent(
    db: Session, *, tax_percent: float, default_tax_percent: float
) -> CartSettings:
    """Actualiza el porcentaje de impuesto global del carrito."""
    settings = get_or_create_cart_settings(db, default_tax_percent=default_tax_percent)
    settings.tax_percent = tax_percent
    db.commit()
    db.refresh(settings)
    return settings


def get_product_for_cart(db: Session, product_id: int) -> Product:
    """Obtiene un producto válido para operación de carrito."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError("Producto inexistente.")

    if not product.is_active:
        raise ConflictError(
            "El producto está inactivo y no se puede agregar al carrito."
        )

    return product


def add_item_for_user(
    db: Session,
    *,
    user_id: int,
    product_id: int,
    quantity: int,
) -> CartItem:
    """Agrega o actualiza un ítem del carrito para un usuario autenticado."""
    if quantity <= 0:
        raise ConflictError("La cantidad debe ser mayor que cero.")

    product = get_product_for_cart(db, product_id)

    existing_item = db.scalar(
        select(CartItem).where(
            CartItem.user_id == user_id,
            CartItem.product_id == product_id,
        )
    )

    current_qty = existing_item.quantity if existing_item else 0
    target_qty = current_qty + quantity

    if target_qty > product.cantidad_stock:
        raise ConflictError(
            "Stock insuficiente para la cantidad solicitada. "
            f"Stock disponible: {product.cantidad_stock}."
        )

    if existing_item:
        existing_item.quantity = target_qty
        existing_item.price = float(product.precio_unitario)
        db.commit()
        db.refresh(existing_item)
        return existing_item

    new_item = CartItem(
        user_id=user_id,
        product_id=product_id,
        quantity=quantity,
        price=float(product.precio_unitario),
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def remove_item_for_user(db: Session, *, user_id: int, cart_item_id: int) -> None:
    """Elimina un ítem del carrito por ID para un usuario autenticado."""
    item = db.scalar(
        select(CartItem).where(
            CartItem.id == cart_item_id,
            CartItem.user_id == user_id,
        )
    )

    if not item:
        raise NotFoundError("Ítem de carrito no encontrado.")

    db.delete(item)
    db.commit()


def list_items_for_user(db: Session, *, user_id: int) -> list[CartItem]:
    """Lista los ítems del carrito de un usuario."""
    stmt = (
        select(CartItem).where(CartItem.user_id == user_id).order_by(CartItem.id.asc())
    )
    return list(db.scalars(stmt).all())


def compute_cart_totals(
    *,
    items: list[CartItemResponse],
    tax_percent: float,
    shipping_fee: float,
) -> CartTotals:
    """Calcula subtotal, impuestos y total a partir de los ítems."""
    # El precio de venta incluye IVA, separamos el neto y el impuesto
    total_con_iva = sum(item.line_total for item in items)
    subtotal = total_con_iva / (1 + tax_percent / 100) if tax_percent > 0 else total_con_iva
    tax_amount = total_con_iva - subtotal
    total = total_con_iva + shipping_fee

    return CartTotals(
        item_count=sum(item.quantity for item in items),
        subtotal=round(subtotal, 2),
        tax_percent=round(tax_percent, 2),
        tax_amount=round(tax_amount, 2),
        shipping_fee=round(shipping_fee, 2),
        total=round(total, 2),
    )


def add_item_for_session(
    db: Session,
    *,
    session_id: str,
    product_id: int,
    quantity: int,
) -> CartItem:
    """Agrega o actualiza un item del carrito para una sesion anonima."""
    if quantity <= 0:
        raise ConflictError("La cantidad debe ser mayor que cero.")

    product = get_product_for_cart(db, product_id)

    existing_item = db.scalar(
        select(CartItem).where(
            CartItem.session_id == session_id,
            CartItem.product_id == product_id,
        )
    )

    current_qty = existing_item.quantity if existing_item else 0
    target_qty = current_qty + quantity

    if target_qty > product.cantidad_stock:
        raise ConflictError(
            "Stock insuficiente para la cantidad solicitada. "
            f"Stock disponible: {product.cantidad_stock}."
        )

    if existing_item:
        existing_item.quantity = target_qty
        existing_item.price = float(product.precio_unitario)
        db.commit()
        db.refresh(existing_item)
        return existing_item

    new_item = CartItem(
        user_id=None,
        session_id=session_id,
        product_id=product_id,
        quantity=quantity,
        price=float(product.precio_unitario),
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def remove_item_for_session(db: Session, *, session_id: str, cart_item_id: int) -> None:
    """Elimina un item del carrito anonimo por ID."""
    item = db.scalar(
        select(CartItem).where(
            CartItem.id == cart_item_id,
            CartItem.session_id == session_id,
        )
    )
    if not item:
        raise NotFoundError("Item de carrito no encontrado.")
    db.delete(item)
    db.commit()


def list_items_for_session(db: Session, *, session_id: str) -> list[CartItem]:
    """Lista los items del carrito de una sesion anonima."""
    return list(
        db.scalars(
            select(CartItem)
            .where(CartItem.session_id == session_id)
            .order_by(CartItem.id.asc())
        ).all()
    )


def clear_session_cart(db: Session, *, session_id: str) -> None:
    """Elimina todos los items del carrito de una sesion anonima."""
    db.query(CartItem).filter(CartItem.session_id == session_id).delete()
    db.commit()


def merge_session_cart_to_user(db: Session, *, session_id: str, user_id: int) -> None:
    """Mueve items anonimos al carrito del usuario tras login."""
    session_items = list_items_for_session(db, session_id=session_id)
    if not session_items:
        return

    for session_item in session_items:
        try:
            add_item_for_user(
                db,
                user_id=user_id,
                product_id=session_item.product_id,
                quantity=session_item.quantity,
            )
        except ConflictError:
            pass
        db.delete(session_item)

    db.commit()


