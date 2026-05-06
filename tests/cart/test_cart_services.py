"""Pruebas unitarias para servicios de carrito."""

import sys
from pathlib import Path

import pytest

_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_ROOT / "backend"))
sys.path.insert(0, str(_ROOT))

from cart.schemas import CartItemResponse
from cart.services import (
    add_item_for_session,
    add_item_for_user,
    clear_session_cart,
    clear_user_cart,
    compute_cart_totals,
    decrease_color_variant_stock,
    get_or_create_cart_settings,
    get_product_for_cart,
    get_shipping_fee,
    list_items_for_session,
    list_items_for_user,
    merge_session_cart_to_user,
    normalize_color_selected,
    remove_item_for_session,
    remove_item_for_user,
    resolve_color_and_stock_limit,
    safe_float,
    set_cart_tax_percent,
)
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
    db = testing_session_local()
    db.info["_engine"] = engine
    return db


def close_test_db(db: Session) -> None:
    engine = db.info.get("_engine")
    db.close()
    if engine is not None:
        engine.dispose()


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
        close_test_db(db)


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
        close_test_db(db)


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
        close_test_db(db)


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
        close_test_db(db)


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
        close_test_db(db)


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
        close_test_db(db)


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
    assert totals.subtotal == 2100.84
    assert totals.tax_amount == 399.16
    assert totals.shipping_fee == 300
    assert totals.total == 2800


def test_add_item_for_session_creates_and_updates_existing_item():
    db = create_test_db()
    try:
        product = create_product(db, stock=10)

        first = add_item_for_session(
            db,
            session_id="guest-1",
            product_id=product.id,
            quantity=2,
        )
        second = add_item_for_session(
            db,
            session_id="guest-1",
            product_id=product.id,
            quantity=3,
        )

        assert first.id == second.id
        assert second.quantity == 5
    finally:
        close_test_db(db)


def test_add_item_for_session_rejects_bad_quantity_and_stock():
    db = create_test_db()
    try:
        product = create_product(db, stock=2)

        with pytest.raises(ConflictError, match="cantidad"):
            add_item_for_session(
                db,
                session_id="guest-2",
                product_id=product.id,
                quantity=0,
            )

        with pytest.raises(ConflictError, match="Stock"):
            add_item_for_session(
                db,
                session_id="guest-2",
                product_id=product.id,
                quantity=3,
            )
    finally:
        close_test_db(db)


def test_remove_and_list_items_for_session():
    db = create_test_db()
    try:
        product = create_product(db, stock=10)
        item = add_item_for_session(
            db,
            session_id="guest-3",
            product_id=product.id,
            quantity=1,
        )

        listed = list_items_for_session(db, session_id="guest-3")
        assert len(listed) == 1

        remove_item_for_session(db, session_id="guest-3", cart_item_id=item.id)
        assert list_items_for_session(db, session_id="guest-3") == []

        with pytest.raises(NotFoundError):
            remove_item_for_session(db, session_id="guest-3", cart_item_id=item.id)
    finally:
        close_test_db(db)


def test_clear_session_cart_and_merge_to_user():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=10)
        add_item_for_session(
            db,
            session_id="guest-4",
            product_id=product.id,
            quantity=2,
        )

        merge_session_cart_to_user(db, session_id="guest-4", user_id=user.id)
        assert list_items_for_session(db, session_id="guest-4") == []

        user_item = add_item_for_user(
            db,
            user_id=user.id,
            product_id=product.id,
            quantity=1,
        )
        assert user_item.quantity == 3

        add_item_for_session(
            db,
            session_id="guest-5",
            product_id=product.id,
            quantity=1,
        )
        clear_session_cart(db, session_id="guest-5")
        assert list_items_for_session(db, session_id="guest-5") == []

        clear_user_cart(db, user_id=user.id)
        assert list_items_for_user(db, user_id=user.id) == []
    finally:
        close_test_db(db)


def test_safe_float_and_shipping_fee_modes(monkeypatch):
    assert safe_float("12.5", 0.0) == 12.5
    assert safe_float("not-a-number", 7.5) == 7.5
    assert safe_float(None, 3.0) == 3.0

    monkeypatch.setenv("CART_SHIPPING_MODE", "fixed")
    monkeypatch.setenv("CART_SHIPPING_FIXED_FEE", "1500")
    monkeypatch.setenv("CART_FREE_SHIPPING_FROM", "-1")
    assert get_shipping_fee(subtotal=10000, item_count=1) == 1500

    monkeypatch.setenv("CART_SHIPPING_MODE", "dynamic")
    monkeypatch.setenv("CART_SHIPPING_DYNAMIC_PER_ITEM", "200")
    assert get_shipping_fee(subtotal=10000, item_count=3) == 600

    monkeypatch.setenv("CART_FREE_SHIPPING_FROM", "5000")
    assert get_shipping_fee(subtotal=6000, item_count=3) == 0


def test_color_variant_resolution_and_stock_decrease():
    db = create_test_db()
    try:
        product = create_product(db, stock=10)
        product.color_variants = [
            {"color": "Negro", "image_url": "a.jpg", "stock": 5},
            {"color": "Azul", "image_url": "b.jpg", "stock": 3},
        ]
        db.commit()

        assert normalize_color_selected("  Negro ") == "Negro"

        color, stock = resolve_color_and_stock_limit(product, "negro")
        assert color == "negro"
        assert stock == 5

        decrease_color_variant_stock(product, color_selected="Negro", quantity=2)
        assert product.cantidad_stock == 8
        assert product.color_variants[0]["stock"] == 3

        with pytest.raises(ConflictError, match="Debes seleccionar un color"):
            resolve_color_and_stock_limit(product, None)

        with pytest.raises(ConflictError, match="no está disponible"):
            resolve_color_and_stock_limit(product, "Verde")
    finally:
        close_test_db(db)


def test_get_or_create_settings_set_tax_and_get_product_inactive():
    db = create_test_db()
    try:
        settings = get_or_create_cart_settings(db, default_tax_percent=19.0)
        assert float(settings.tax_percent) == 19.0

        updated = set_cart_tax_percent(db, tax_percent=12.5, default_tax_percent=19.0)
        assert float(updated.tax_percent) == 12.5

        product = create_product(db, stock=3)
        fetched = get_product_for_cart(db, product.id)
        assert fetched.id == product.id

        product.is_active = False
        db.commit()

        with pytest.raises(ConflictError, match="inactivo"):
            get_product_for_cart(db, product.id)
    finally:
        close_test_db(db)


def test_merge_session_cart_to_user_ignores_conflicts_and_cleans_session_items():
    db = create_test_db()
    try:
        user = create_user(db)
        product = create_product(db, stock=2)

        add_item_for_user(db, user_id=user.id, product_id=product.id, quantity=2)
        add_item_for_session(
            db,
            session_id="guest-conflict",
            product_id=product.id,
            quantity=1,
        )

        merge_session_cart_to_user(db, session_id="guest-conflict", user_id=user.id)

        user_items = list_items_for_user(db, user_id=user.id)
        assert len(user_items) == 1
        assert user_items[0].quantity == 2
        assert list_items_for_session(db, session_id="guest-conflict") == []
    finally:
        close_test_db(db)
