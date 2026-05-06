"""Flujo E2E backend: registro, catálogo, carrito y orden."""

from tests.conftest import product_payload


def test_customer_can_complete_backend_checkout_flow(client, make_product):
    product = make_product(
        referencia="E2E-001",
        nombre="Telefono E2E",
        precio_unitario=900000,
        cantidad_stock=3,
    )

    register = client.post(
        "/auth/register",
        json={
            "email": "e2e@example.com",
            "password": "ClaveSegura123",
            "full_name": "Cliente E2E",
        },
    )
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": "e2e@example.com", "password": "ClaveSegura123"},
    )
    assert login.status_code == 200
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    catalog = client.get("/products", params={"categoria": "gama media"})
    assert catalog.status_code == 200
    catalog_payload = catalog.json()
    catalog_items = catalog_payload.get("items", []) if isinstance(catalog_payload, dict) else catalog_payload
    assert any(item["id"] == product.id for item in catalog_items)

    add = client.post(
        "/cart/add",
        headers=headers,
        json={"product_id": product.id, "quantity": 2},
    )
    assert add.status_code == 201
    assert add.json()["item"]["quantity"] == 2

    total = client.get("/cart/total", headers=headers)
    assert total.status_code == 200
    assert total.json()["total"] == 1800000

    create_order = client.post("/orders/", headers=headers)
    assert create_order.status_code == 201
    order = create_order.json()
    assert order["status"] == "pending"
    assert order["total"] == 1800000
    assert order["items"][0]["product_id"] == product.id

    orders = client.get("/orders/", headers=headers)
    assert orders.status_code == 200
    assert [item["id"] for item in orders.json()] == [order["id"]]


def test_admin_can_create_product_used_by_customer_checkout(client, make_user):
    admin = make_user(email="e2e-admin@example.com", role="administrador")
    admin_login = client.post(
        "/auth/login",
        json={"email": admin.email, "password": "ClaveSegura123"},
    )
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    created_product = client.post(
        "/products",
        headers=admin_headers,
        json=product_payload(referencia="E2E-ADMIN", precio_unitario=750000),
    )
    assert created_product.status_code == 201

    client.post(
        "/auth/register",
        json={
            "email": "buyer@example.com",
            "password": "ClaveSegura123",
            "full_name": "Comprador",
        },
    )
    buyer_login = client.post(
        "/auth/login",
        json={"email": "buyer@example.com", "password": "ClaveSegura123"},
    )
    buyer_headers = {"Authorization": f"Bearer {buyer_login.json()['access_token']}"}

    add = client.post(
        "/cart/add",
        headers=buyer_headers,
        json={"product_id": created_product.json()["id"], "quantity": 1},
    )
    assert add.status_code == 201

    order = client.post("/orders/", headers=buyer_headers)
    assert order.status_code == 201
    assert order.json()["items"][0]["quantity"] == 1
