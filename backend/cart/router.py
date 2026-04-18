"""Rutas REST para carrito de compras."""

import json
import os
from typing import Any

from auth.dependencies import get_current_admin, get_optional_current_user
from cart.schemas import (
    CartAddRequest,
    CartAddResponse,
    CartItemResponse,
    CartTaxSettingsResponse,
    CartTaxSettingsUpdate,
    CartTotalResponse,
)
from cart.services import (
    add_item_for_user,
    compute_cart_totals,
    get_or_create_cart_settings,
    get_product_for_cart,
    list_items_for_user,
    remove_item_for_user,
    set_cart_tax_percent,
)
from fastapi import APIRouter, Depends, Request, Response, status
from products.models import Product
from sqlalchemy.orm import Session
from users.models import User

from database.core.database import get_db
from database.core.errors import ConflictError, NotFoundError

router = APIRouter(prefix="/cart", tags=["Cart"])

COOKIE_NAME = "guest_cart"
COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30


def _safe_float(value: str | None, default: float) -> float:
    try:
        return float(value) if value is not None else default
    except ValueError:
        return default


def _safe_int(value: str | None, default: int) -> int:
    try:
        return int(value) if value is not None else default
    except ValueError:
        return default


def _get_cart_tax_percent() -> float:
    return max(0.0, min(100.0, _safe_float(os.getenv("CART_TAX_PERCENT"), 19.0)))


def _get_persistent_tax_percent(db: Session) -> float:
    env_default = _get_cart_tax_percent()
    settings = get_or_create_cart_settings(db, default_tax_percent=env_default)
    return float(settings.tax_percent)


def _get_shipping_fee(*, subtotal: float, item_count: int) -> float:
    mode = os.getenv("CART_SHIPPING_MODE", "fixed").strip().lower()
    free_from = _safe_float(os.getenv("CART_FREE_SHIPPING_FROM"), -1)

    if free_from >= 0 and subtotal >= free_from:
        return 0.0

    if mode == "dynamic":
        dynamic_per_item = max(
            0.0, _safe_float(os.getenv("CART_SHIPPING_DYNAMIC_PER_ITEM"), 0.0)
        )
        return dynamic_per_item * item_count

    return max(0.0, _safe_float(os.getenv("CART_SHIPPING_FIXED_FEE"), 0.0))


def _parse_guest_cart(request: Request) -> list[dict[str, Any]]:
    raw_cookie = request.cookies.get(COOKIE_NAME)
    if not raw_cookie:
        return []

    try:
        parsed = json.loads(raw_cookie)
    except json.JSONDecodeError:
        return []

    if not isinstance(parsed, list):
        return []

    clean_items: list[dict[str, Any]] = []
    for item in parsed:
        if not isinstance(item, dict):
            continue

        product_id = item.get("product_id")
        quantity = item.get("quantity")
        price = item.get("price")

        if not isinstance(product_id, int) or product_id <= 0:
            continue

        if not isinstance(quantity, int) or quantity <= 0:
            continue

        if not isinstance(price, (int, float)) or price < 0:
            continue

        clean_items.append(
            {
                "product_id": product_id,
                "quantity": quantity,
                "price": float(price),
            }
        )

    return clean_items


def _set_guest_cart_cookie(response: Response, items: list[dict[str, Any]]) -> None:
    response.set_cookie(
        key=COOKIE_NAME,
        value=json.dumps(items, separators=(",", ":")),
        max_age=COOKIE_MAX_AGE_SECONDS,
        httponly=True,
        samesite="lax",
    )


def _to_item_response_from_product(
    *,
    item_id: int,
    product: Product,
    quantity: int,
    price: float,
) -> CartItemResponse:
    return CartItemResponse(
        id=item_id,
        product_id=product.id,
        referencia=product.referencia,
        nombre=product.nombre,
        imagen_url=product.imagen_url,
        quantity=quantity,
        price=round(price, 2),
        line_total=round(price * quantity, 2),
    )


def _build_items_for_authenticated(db: Session, user_id: int) -> list[CartItemResponse]:
    user_items = list_items_for_user(db, user_id=user_id)
    normalized_items: list[CartItemResponse] = []

    for item in user_items:
        product = db.get(Product, item.product_id)
        if not product:
            continue

        normalized_items.append(
            _to_item_response_from_product(
                item_id=item.id,
                product=product,
                quantity=item.quantity,
                price=float(item.price),
            )
        )

    return normalized_items


def _build_items_for_guest(db: Session, request: Request) -> list[CartItemResponse]:
    guest_items = _parse_guest_cart(request)
    normalized_guest_items: list[CartItemResponse] = []

    for item in guest_items:
        product = db.get(Product, item["product_id"])
        if not product:
            continue

        normalized_guest_items.append(
            _to_item_response_from_product(
                item_id=item["product_id"],
                product=product,
                quantity=item["quantity"],
                price=item["price"],
            )
        )

    return normalized_guest_items


@router.get("/items", response_model=list[CartItemResponse])
def get_cart_items(
    request: Request,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> list[CartItemResponse]:
    """Lista ítems actuales del carrito (SQL para auth, cookie para guest)."""
    if current_user:
        return _build_items_for_authenticated(db, current_user.id)

    return _build_items_for_guest(db, request)


@router.get("/settings/tax", response_model=CartTaxSettingsResponse)
def get_cart_tax_settings(db: Session = Depends(get_db)) -> CartTaxSettingsResponse:
    """Obtiene el porcentaje de impuesto configurado para el carrito."""
    return CartTaxSettingsResponse(tax_percent=_get_persistent_tax_percent(db))


@router.put("/settings/tax", response_model=CartTaxSettingsResponse)
def update_cart_tax_settings(
    payload: CartTaxSettingsUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> CartTaxSettingsResponse:
    """Permite a administrador actualizar el impuesto global del carrito."""
    env_default = _get_cart_tax_percent()
    settings = set_cart_tax_percent(
        db,
        tax_percent=payload.tax_percent,
        default_tax_percent=env_default,
    )
    return CartTaxSettingsResponse(tax_percent=float(settings.tax_percent))


@router.post(
    "/add", response_model=CartAddResponse, status_code=status.HTTP_201_CREATED
)
def add_to_cart(
    payload: CartAddRequest,
    request: Request,
    response: Response,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> CartAddResponse:
    """Agrega productos al carrito con validación de stock."""
    if payload.quantity <= 0:
        raise ConflictError("Cantidad inválida. Debe ser mayor que cero.")

    product = get_product_for_cart(db, payload.product_id)

    if current_user:
        item = add_item_for_user(
            db,
            user_id=current_user.id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )

        return CartAddResponse(
            source="authenticated",
            item=_to_item_response_from_product(
                item_id=item.id,
                product=product,
                quantity=item.quantity,
                price=float(item.price),
            ),
        )

    guest_items = _parse_guest_cart(request)
    existing = next(
        (i for i in guest_items if i["product_id"] == payload.product_id), None
    )

    current_qty = existing["quantity"] if existing else 0
    target_qty = current_qty + payload.quantity

    if target_qty > product.cantidad_stock:
        raise ConflictError(
            "Stock insuficiente para la cantidad solicitada. "
            f"Stock disponible: {product.cantidad_stock}."
        )

    price = float(product.precio_unitario)

    if existing:
        existing["quantity"] = target_qty
        existing["price"] = price
        item_id = existing["product_id"]
    else:
        new_item = {
            "product_id": product.id,
            "quantity": payload.quantity,
            "price": price,
        }
        guest_items.append(new_item)
        item_id = new_item["product_id"]

    _set_guest_cart_cookie(response, guest_items)

    return CartAddResponse(
        source="guest",
        item=_to_item_response_from_product(
            item_id=item_id,
            product=product,
            quantity=target_qty,
            price=price,
        ),
    )


@router.delete("/remove/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_cart(
    item_id: int,
    request: Request,
    response: Response,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> None:
    """Elimina ítems del carrito por ID (auth) o product_id (guest)."""
    if current_user:
        remove_item_for_user(db, user_id=current_user.id, cart_item_id=item_id)
        return

    guest_items = _parse_guest_cart(request)
    next_items = [item for item in guest_items if item["product_id"] != item_id]

    if len(next_items) == len(guest_items):
        raise NotFoundError("Ítem de carrito no encontrado.")

    _set_guest_cart_cookie(response, next_items)


@router.get("/total", response_model=CartTotalResponse)
def get_cart_total(
    request: Request,
    current_user: User | None = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> CartTotalResponse:
    """Obtiene el total del carrito con lógica de negocio (subtotal, impuestos y envío)."""
    tax_percent = _get_persistent_tax_percent(db)

    if current_user:
        normalized_items = _build_items_for_authenticated(db, current_user.id)

        subtotal = sum(i.line_total for i in normalized_items)
        shipping_fee = _get_shipping_fee(
            subtotal=subtotal,
            item_count=sum(i.quantity for i in normalized_items),
        )
        totals = compute_cart_totals(
            items=normalized_items,
            tax_percent=tax_percent,
            shipping_fee=shipping_fee,
        )
        return CartTotalResponse(source="authenticated", **totals.__dict__)

    normalized_guest_items = _build_items_for_guest(db, request)

    subtotal = sum(i.line_total for i in normalized_guest_items)
    shipping_fee = _get_shipping_fee(
        subtotal=subtotal,
        item_count=sum(i.quantity for i in normalized_guest_items),
    )

    totals = compute_cart_totals(
        items=normalized_guest_items,
        tax_percent=tax_percent,
        shipping_fee=shipping_fee,
    )
    return CartTotalResponse(source="guest", **totals.__dict__)
