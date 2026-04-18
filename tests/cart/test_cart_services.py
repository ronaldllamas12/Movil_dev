"""Pruebas unitarias para servicios de carrito."""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_ROOT / "backend"))
sys.path.insert(0, str(_ROOT))

from cart.schemas import CartItemResponse
from cart.services import add_item_for_user, compute_cart_totals, remove_item_for_user
from products.models import Product
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from users.constants import UserRole
from users.models import User

from database.core.database import Base
from database.core.errors import ConflictError, NotFoundError


def create_test_db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    testing_session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)
    return testing_session_local()


def create_user(db: Session) -> User:
    user = User(
        email="cart-user@example.com",
        full_name="Cart User",
        role=UserRole.USER,
        hashed_password="hash",
        auth_provider="local",
        is_active=True,
        purchase_history=[],
        preferences={},
        saved_articles=[],
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_product(db: Session, *, stock: int = 10) -> Product:
    product = Product(
        marca="Samsung",
        referencia=f"REF-{stock}",
        nombre="Galaxy Test",
        categoria="gama media",
        descripcion_breve="Producto de prueba",
        cantidad_stock=stock,
        precio_unitario=1000,
        tamano_memoria_ram="8GB",
        rom="128GB",
        colores_disponibles=["Negro"],
        conectividad="5G",
        procesador="Test Chip",
        dimensiones="160x70x8",
        bateria="5000mAh",
        resolucion_camara_principal="50MP",
        resolucion_camara_frontal="32MP",
        capacidad_carga_rapida="67W",
        garantia_meses=12,
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def test_add_item_for_user_creates_new_item():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=10)

        item = add_item_for_user(
            db,
            user_id=user.id,
            product_id=product.id,
            quantity=2,
        )

        assert item.id is not None
        assert item.user_id == user.id
        assert item.product_id == product.id
        assert item.quantity == 2
    finally:
        db.close()


def test_add_item_for_user_increments_existing_quantity():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=10)

        first = add_item_for_user(
            db, user_id=user.id, product_id=product.id, quantity=2
        )
        second = add_item_for_user(
            db, user_id=user.id, product_id=product.id, quantity=3
        )

        assert first.id == second.id
        assert second.quantity == 5
    finally:
        db.close()


def test_add_item_for_user_rejects_invalid_quantity():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=10)

        try:
            add_item_for_user(db, user_id=user.id, product_id=product.id, quantity=0)
            assert False, "Se esperaba ConflictError"
        except ConflictError as exc:
            assert "cantidad" in exc.message.lower()
    finally:
        db.close()


def test_add_item_for_user_rejects_nonexistent_product():
    db = create_test_db()
    try:
        user = create_user(db)

        try:
            add_item_for_user(db, user_id=user.id, product_id=9999, quantity=1)
            assert False, "Se esperaba NotFoundError"
        except NotFoundError as exc:
            assert "producto" in exc.message.lower()
    finally:
        db.close()


def test_add_item_for_user_rejects_insufficient_stock():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=2)

        try:
            add_item_for_user(db, user_id=user.id, product_id=product.id, quantity=3)
            assert False, "Se esperaba ConflictError"
        except ConflictError as exc:
            assert "stock" in exc.message.lower()
    finally:
        db.close()


def test_remove_item_for_user_removes_item():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=10)
        item = add_item_for_user(db, user_id=user.id, product_id=product.id, quantity=1)

        remove_item_for_user(db, user_id=user.id, cart_item_id=item.id)

        try:
            remove_item_for_user(db, user_id=user.id, cart_item_id=item.id)
            assert False, "Se esperaba NotFoundError"
        except NotFoundError:
            pass
    finally:
        db.close()


def test_compute_cart_totals_calculates_business_values():
    items = [
        CartItemResponse(
            id=1,
            product_id=1,
            referencia="REF-1",
            nombre="Producto 1",
            quantity=2,
            price=1000,
            line_total=2000,
        ),
        CartItemResponse(
            id=2,
            product_id=2,
            referencia="REF-2",
            nombre="Producto 2",
            quantity=1,
            price=500,
            line_total=500,
        ),
    ]

    totals = compute_cart_totals(items=items, tax_percent=19, shipping_fee=300)

    assert totals.item_count == 3
    assert totals.subtotal == 2500
    assert totals.tax_amount == 475
    assert totals.shipping_fee == 300
    assert totals.total == 3275
    assert totals.total == 3275
