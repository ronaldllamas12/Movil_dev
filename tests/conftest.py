"""Fixtures compartidas para pruebas unitarias, integración y E2E."""

import os
import sys
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
for path in (str(BACKEND), str(ROOT)):
    if path not in sys.path:
        sys.path.insert(0, path)

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("ALGORITHM", "HS256")
os.environ["CART_SHIPPING_MODE"] = "fixed"
os.environ["CART_SHIPPING_FIXED_FEE"] = "0"
os.environ["CART_FREE_SHIPPING_FROM"] = "-1"

from auth.services import create_token_for_user, register_user
from orders.models import Order, OrderItem
from products.models import Product
from users.constants import UserRole
from users.models import User

from database.core.database import Base, get_db


@pytest.fixture()
def db_session() -> Session:
    """Crea una base SQLite en memoria aislada por test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    testing_session_local = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    session = testing_session_local()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture()
def client(db_session: Session) -> TestClient:
    """Cliente FastAPI usando la misma sesión transaccional del test."""
    import database.core.database as database_module
    from backend.main import app

    previous_engine = database_module._engine
    database_module._engine = db_session.get_bind()

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.clear()
        database_module._engine = previous_engine


def product_payload(**overrides: Any) -> dict[str, Any]:
    payload = {
        "marca": "Samsung",
        "referencia": "REF-TEST",
        "nombre": "Galaxy Test",
        "categoria": "gama media",
        "descripcion_breve": "Telefono de prueba",
        "cantidad_stock": 10,
        "precio_unitario": 1190000,
        "tamano_memoria_ram": "8GB",
        "rom": "128GB",
        "colores_disponibles": ["Negro", "Azul"],
        "conectividad": "5G",
        "procesador": "Test Chip",
        "dimensiones": "160x70x8",
        "bateria": "5000mAh",
        "resolucion_camara_principal": "50MP",
        "resolucion_camara_frontal": "32MP",
        "capacidad_carga_rapida": "67W",
        "garantia_meses": 12,
        "imagen_url": "https://example.com/phone.jpg",
        "is_active": True,
        "is_featured": False,
    }
    payload.update(overrides)
    return payload


@pytest.fixture()
def make_user(db_session: Session):
    def _make_user(
        *,
        email: str = "user@example.com",
        password: str = "ClaveSegura123",
        full_name: str = "Usuario Test",
        role: UserRole = UserRole.USER,
    ) -> User:
        return register_user(db_session, email, password, full_name, role)

    return _make_user


@pytest.fixture()
def make_product(db_session: Session):
    def _make_product(**overrides: Any) -> Product:
        payload = product_payload(**overrides)
        product = Product(**payload)
        db_session.add(product)
        db_session.commit()
        db_session.refresh(product)
        return product

    return _make_product


def auth_headers_for(user: User) -> dict[str, str]:
    token, _, _ = create_token_for_user(user)
    return {"Authorization": f"Bearer {token}"}
