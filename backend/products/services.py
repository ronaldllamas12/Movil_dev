"""Servicios CRUD para productos."""

from products.models import Product
from products.schemas import ProductCreate, ProductUpdate
from sqlalchemy import select
from sqlalchemy.orm import Session

from database.core.errors import ConflictError, NotFoundError


def list_products(db: Session, skip: int = 0, limit: int = 100, categoria: str | None = None) -> list[Product]:
    """Lista productos con paginación simple y filtro opcional por categoría."""
    stmt = select(Product)

    if categoria:
        categoria = categoria.strip().lower()
        stmt = stmt.where(Product.categoria == categoria)

    stmt = stmt.offset(skip).limit(limit).order_by(Product.id.desc())
    return list(db.scalars(stmt).all())


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
