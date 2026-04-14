"""Pruebas unitarias para servicios CRUD de productos."""

import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(_ROOT / "backend"))
sys.path.insert(0, str(_ROOT))

from products.schemas import ProductCreate, ProductUpdate
from products.services import (
    create_product,
    delete_product,
    get_product_by_id,
    list_products,
    toggle_product_active,
    update_product,
)
from pydantic import ValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from database.core.database import Base
from database.core.errors import ConflictError, NotFoundError

# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────


def create_test_db() -> Session:
    engine = create_engine("sqlite:///:memory:")
    TestingSessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()


def _payload(**overrides) -> ProductCreate:
    """Construye un ProductCreate con valores por defecto sensatos."""
    defaults = {
        "marca": "Samsung",
        "referencia": "REF-001",
        "nombre": "Galaxy A55",
        "categoria": "gama media",
        "descripcion_breve": "Teléfono de gama media.",
        "cantidad_stock": 10,
        "precio_unitario": 499.99,
        "tamano_memoria_ram": "8GB",
        "rom": "128GB",
        "colores_disponibles": ["Negro", "Azul"],
        "conectividad": "5G, Wi-Fi 6",
        "procesador": "Exynos 1480",
        "dimensiones": "161.1 x 77.4 x 8.2 mm",
        "bateria": "5000mAh",
        "resolucion_camara_principal": "50MP",
        "resolucion_camara_frontal": "32MP",
        "capacidad_carga_rapida": "67W",
        "garantia_meses": 12,
        "is_active": True,
    }
    defaults.update(overrides)
    return ProductCreate(**defaults)


# ──────────────────────────────────────────────
# CREAR
# ──────────────────────────────────────────────


def test_create_product_guarda_todos_los_campos():
    """Crear un producto con todos los campos debe guardarlos correctamente."""
    db = create_test_db()
    try:
        product = create_product(db, _payload())

        assert product.id is not None
        assert product.marca == "Samsung"
        assert product.referencia == "REF-001"
        assert product.nombre == "Galaxy A55"
        assert product.categoria == "gama media"
        assert product.cantidad_stock == 10
        assert float(product.precio_unitario) == 499.99
        assert product.tamano_memoria_ram == "8GB"
        assert product.rom == "128GB"
        assert product.colores_disponibles == ["Negro", "Azul"]
        assert product.conectividad == "5G, Wi-Fi 6"
        assert product.procesador == "Exynos 1480"
        assert product.dimensiones == "161.1 x 77.4 x 8.2 mm"
        assert product.bateria == "5000mAh"
        assert product.resolucion_camara_principal == "50MP"
        assert product.resolucion_camara_frontal == "32MP"
        assert product.capacidad_carga_rapida == "67W"
        assert product.garantia_meses == 12
        assert product.is_active is True
    finally:
        db.close()


def test_create_product_referencia_duplicada_lanza_conflict():
    """Intentar crear un producto con referencia que ya existe debe lanzar ConflictError."""
    db = create_test_db()
    try:
        create_product(db, _payload(referencia="DUP-001"))

        try:
            create_product(db, _payload(referencia="DUP-001", nombre="Otro"))
            assert False, "Se esperaba ConflictError"
        except ConflictError as exc:
            assert "referencia" in exc.message.lower()
    finally:
        db.close()


def test_create_product_categoria_invalida_lanza_validation_error():
    """La categoría debe ser premium, gama media o economico."""
    try:
        _payload(categoria="ultra")
        assert False, "Se esperaba ValidationError"
    except ValidationError:
        pass


# ──────────────────────────────────────────────
# LISTAR
# ──────────────────────────────────────────────


def test_list_products_devuelve_todos():
    """Listar productos sin skip/limit debe devolver todos los productos disponibles."""
    db = create_test_db()
    try:
        create_product(db, _payload(referencia="REF-A"))
        create_product(db, _payload(referencia="REF-B"))
        create_product(db, _payload(referencia="REF-C"))

        products = list_products(db)

        assert len(products) == 3
    finally:
        db.close()


def test_list_products_paginacion():
    """Una consulta con skip y limit debe devolver la página correcta de resultados."""
    db = create_test_db()
    try:
        for i in range(5):
            create_product(db, _payload(referencia=f"PAG-{i}"))

        page = list_products(db, skip=2, limit=2)

        assert len(page) == 2
    finally:
        db.close()


# ──────────────────────────────────────────────
# OBTENER POR ID
# ──────────────────────────────────────────────


def test_get_product_by_id_devuelve_correcto():
    """Un producto creado puede ser obtenido por su ID con todos los campos correctos."""
    db = create_test_db()
    try:
        created = create_product(db, _payload())
        found = get_product_by_id(db, created.id)

        assert found.id == created.id
        assert found.referencia == "REF-001"
    finally:
        db.close()


def test_get_product_by_id_inexistente_lanza_not_found():
    """Intentar obtener un producto por ID que no existe debe lanzar NotFoundError."""
    db = create_test_db()
    try:
        try:
            get_product_by_id(db, 9999)
            assert False, "Se esperaba NotFoundError"
        except NotFoundError as exc:
            assert "Producto" in exc.message
    finally:
        db.close()


# ──────────────────────────────────────────────
# ACTUALIZAR
# ──────────────────────────────────────────────


def test_update_product_modifica_campos_enviados():
    """Actualizar un producto con algunos campos debe modificar solo esos campos."""
    db = create_test_db()
    try:
        product = create_product(db, _payload())
        updated = update_product(
            db,
            product.id,
            ProductUpdate(nombre="Galaxy A55 5G", cantidad_stock=25),
        )

        assert updated.nombre == "Galaxy A55 5G"
        assert updated.cantidad_stock == 25
        assert updated.marca == "Samsung"  # no cambió
    finally:
        db.close()


def test_update_product_referencia_duplicada_lanza_conflict():
    """Intentar actualizar la referencia a una que ya existe debe lanzar ConflictError."""
    db = create_test_db()
    try:
        p1 = create_product(db, _payload(referencia="UPD-001"))
        p2 = create_product(db, _payload(referencia="UPD-002"))

        try:
            update_product(db, p2.id, ProductUpdate(referencia="UPD-001"))
            assert False, "Se esperaba ConflictError"
        except ConflictError as exc:
            assert "referencia" in exc.message.lower()
    finally:
        db.close()


def test_update_product_referencia_misma_no_lanza_conflict():
    """Actualizar un producto con la misma referencia no debe lanzar conflicto."""
    db = create_test_db()
    try:
        product = create_product(db, _payload(referencia="SAME-001"))
        updated = update_product(
            db,
            product.id,
            ProductUpdate(referencia="SAME-001", nombre="Nuevo Nombre"),
        )

        assert updated.referencia == "SAME-001"
        assert updated.nombre == "Nuevo Nombre"
    finally:
        db.close()


def test_update_product_inexistente_lanza_not_found():
    """Intentar actualizar un producto que no existe debe lanzar NotFoundError."""
    db = create_test_db()
    try:
        try:
            update_product(db, 9999, ProductUpdate(nombre="X"))
            assert False, "Se esperaba NotFoundError"
        except NotFoundError:
            pass
    finally:
        db.close()


# ──────────────────────────────────────────────
# ELIMINAR
# ──────────────────────────────────────────────


def test_delete_product_elimina_correctamente():
    """Un producto creado puede ser eliminado y luego no encontrado."""
    db = create_test_db()
    try:
        product = create_product(db, _payload())
        product_id = product.id

        delete_product(db, product_id)

        try:
            get_product_by_id(db, product_id)
            assert False, "Se esperaba NotFoundError tras eliminar"
        except NotFoundError:
            pass
    finally:
        db.close()


def test_delete_product_inexistente_lanza_not_found():
    """Intentar eliminar un producto que no existe debe lanzar NotFoundError."""
    db = create_test_db()
    try:
        try:
            delete_product(db, 9999)
            assert False, "Se esperaba NotFoundError"
        except NotFoundError:
            pass
    finally:
        db.close()


# ──────────────────────────────────────────────
# ACTIVAR / DESACTIVAR
# ──────────────────────────────────────────────


def test_toggle_product_active_desactiva():
    """Un producto activo puede ser desactivado correctamente."""
    db = create_test_db()
    try:
        product = create_product(db, _payload())
        assert product.is_active is True

        deactivated = toggle_product_active(db, product.id, False)

        assert deactivated.is_active is False
    finally:
        db.close()


def test_toggle_product_active_reactiva():
    """Un producto desactivado puede ser reactivado correctamente."""
    db = create_test_db()
    try:
        product = create_product(db, _payload(is_active=False))
        toggle_product_active(db, product.id, False)

        reactivated = toggle_product_active(db, product.id, True)

        assert reactivated.is_active is True
    finally:
        db.close()


def test_toggle_product_active_inexistente_lanza_not_found():
    """Intentar activar/desactivar un producto inexistente debe lanzar NotFoundError."""
    db = create_test_db()
    try:
        try:
            toggle_product_active(db, 9999, False)
            assert False, "Se esperaba NotFoundError"
        except NotFoundError:
            pass
    finally:
        db.close()
