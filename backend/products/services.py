"""Servicios CRUD para productos."""

from typing import Any

from products.models import Product
from products.schemas import ProductCreate, ProductUpdate
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.core.errors import ConflictError, NotFoundError


def _normalize_colors(colors: list[str]) -> list[str]:
    normalized: list[str] = []
    seen: set[str] = set()

    for color in colors:
        clean = color.strip()
        if not clean:
            continue

        key = clean.lower()
        if key in seen:
            continue

        seen.add(key)
        normalized.append(clean)

    return normalized


def _normalize_color_variants(raw_variants: list[dict[str, Any]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    seen: set[str] = set()

    for variant in raw_variants:
        color = str(variant.get("color", "")).strip()
        if not color:
            raise ConflictError("Cada variante debe incluir un color válido.")

        key = color.lower()
        if key in seen:
            raise ConflictError("No se permiten colores repetidos en variantes.")

        stock = variant.get("stock")
        if not isinstance(stock, int):
            raise ConflictError("El stock por color debe ser un entero.")
        if stock < 0:
            raise ConflictError("El stock por color no puede ser negativo.")

        image_url_value = variant.get("image_url")
        image_url = None
        if image_url_value is not None:
            clean_url = str(image_url_value).strip()
            image_url = clean_url or None

        normalized.append(
            {
                "color": color,
                "image_url": image_url,
                "stock": stock,
            }
        )
        seen.add(key)

    return normalized


def list_products(db: Session, skip: int = 0, limit: int = 100, categoria: str | None = None) -> list[Product]:
    """Lista productos con paginación simple y filtro opcional por categoría."""
    stmt = select(Product)

    if categoria:
        categoria = categoria.strip().lower()
        stmt = stmt.where(Product.categoria == categoria)

    stmt = stmt.offset(skip).limit(limit).order_by(Product.id.desc())
    return list(db.scalars(stmt).all())


def count_products(db: Session, categoria: str | None = None) -> int:
    """Cuenta el total de productos con filtro opcional por categoría."""
    from sqlalchemy import func

    stmt = select(func.count()).select_from(Product)
    if categoria:
        categoria = categoria.strip().lower()
        stmt = stmt.where(Product.categoria == categoria)
    return db.scalar(stmt) or 0


def get_product_by_id(db: Session, product_id: int) -> Product:
    """Obtiene un producto por ID o lanza NotFoundError."""
    product = db.get(Product, product_id)
    if not product:
        raise NotFoundError("Producto no encontrado.")
    return product


def create_product(db: Session, payload: ProductCreate) -> Product:
    """Crea un producto validando referencia única."""
    referencia = payload.referencia.strip()
    existing = db.scalar(select(Product).where(Product.referencia == referencia))
    if existing:
        raise ConflictError("Ya existe un producto con esa referencia.")

    data = payload.model_dump()
    data["referencia"] = referencia
    data["colores_disponibles"] = _normalize_colors(data.get("colores_disponibles", []))

    variants = _normalize_color_variants(data.get("color_variants", []))
    data["color_variants"] = variants
    if variants:
        data["colores_disponibles"] = [variant["color"] for variant in variants]
        data["cantidad_stock"] = sum(variant["stock"] for variant in variants)

    product = Product(**data)
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(db: Session, product_id: int, payload: ProductUpdate) -> Product:
    """Actualiza un producto existente de forma parcial."""
    product = get_product_by_id(db, product_id)
    changes = payload.model_dump(exclude_unset=True)

    if "referencia" in changes and changes["referencia"] is not None:
        new_ref = changes["referencia"].strip()
        if new_ref != product.referencia:
            existing = db.scalar(select(Product).where(Product.referencia == new_ref))
            if existing:
                raise ConflictError("Ya existe un producto con esa referencia.")
        changes["referencia"] = new_ref

    if "colores_disponibles" in changes and changes["colores_disponibles"] is not None:
        changes["colores_disponibles"] = _normalize_colors(changes["colores_disponibles"])

    if "color_variants" in changes and changes["color_variants"] is not None:
        variants = _normalize_color_variants(changes["color_variants"])
        changes["color_variants"] = variants
        changes["colores_disponibles"] = [variant["color"] for variant in variants]
        changes["cantidad_stock"] = sum(variant["stock"] for variant in variants)

    for field, value in changes.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> None:
    """Elimina un producto por ID."""
    product = get_product_by_id(db, product_id)
    db.delete(product)
    db.commit()


def toggle_product_active(db: Session, product_id: int, is_active: bool) -> Product:
    """Activa o desactiva un producto."""
    product = get_product_by_id(db, product_id)
    product.is_active = is_active
    db.commit()
    db.refresh(product)
    return product
