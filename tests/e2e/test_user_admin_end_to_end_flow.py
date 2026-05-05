"""End-to-end backend flows across customer/admin roles."""

from tests.conftest import product_payload


def _register_and_login(client, *, email: str, password: str = "ClaveSegura123", full_name: str = "Usuario"):
    register = client.post(
        "/auth/register",
        json={
            "email": email,
            "password": password,
            "full_name": full_name,
        },
    )
    assert register.status_code == 201

    login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_e2e_admin_manages_customer_order(client, make_user):
    admin = make_user(email="e2e-admin-flow@example.com", role="administrador")

    admin_login = client.post(
        "/auth/login",
        json={"email": admin.email, "password": "ClaveSegura123"},
    )
    assert admin_login.status_code == 200
    admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    create_product = client.post(
        "/products",
        headers=admin_headers,
        json=product_payload(referencia="E2E-FLOW-1", precio_unitario=550000, cantidad_stock=8),
    )
    assert create_product.status_code == 201
    product_id = create_product.json()["id"]

    customer_headers = _register_and_login(
        client,
        email="e2e-customer-flow@example.com",
        full_name="Cliente Flujo",
    )

    add = client.post(
        "/cart/add",
        headers=customer_headers,
        json={"product_id": product_id, "quantity": 2},
    )
    assert add.status_code == 201

    create_order = client.post("/orders/", headers=customer_headers)
    assert create_order.status_code == 201
    order_id = create_order.json()["id"]
    assert create_order.json()["status"] == "pending"

    admin_orders = client.get("/orders/admin/", headers=admin_headers)
    assert admin_orders.status_code == 200
    assert any(order["id"] == order_id for order in admin_orders.json())

    cancel = client.put(
        f"/orders/admin/{order_id}/status",
        headers=admin_headers,
        json={"status": "cancelled", "reason": "Pago no confirmado"},
    )
    assert cancel.status_code == 200
    assert cancel.json()["status"] == "cancelled"

    my_orders = client.get("/orders/", headers=customer_headers)
    assert my_orders.status_code == 200
    assert my_orders.json()[0]["id"] == order_id
    assert my_orders.json()[0]["status"] == "cancelled"


def test_e2e_guest_cart_merge_then_checkout(client, make_product):
    product = make_product(referencia="E2E-MERGE-1", precio_unitario=210000, cantidad_stock=12)

    guest_add = client.post(
        "/cart/add",
        json={"product_id": product.id, "quantity": 3},
    )
    assert guest_add.status_code == 201

    guest_items = client.get("/cart/items")
    assert guest_items.status_code == 200
    assert len(guest_items.json()) == 1
    assert guest_items.json()[0]["quantity"] == 3

    user_headers = _register_and_login(
        client,
        email="e2e-merge-user@example.com",
        full_name="Cliente Merge",
    )

    merge = client.post(
        "/cart/merge",
        headers=user_headers,
        json={
            "items": [
                {
                    "product_id": product.id,
                    "quantity": 3,
                    "color_selected": None,
                }
            ]
        },
    )
    assert merge.status_code == 200
    assert merge.json()[0]["quantity"] == 3

    total = client.get("/cart/total", headers=user_headers)
    assert total.status_code == 200
    assert total.json()["source"] == "authenticated"
    assert total.json()["item_count"] == 3

    create_order = client.post("/orders/", headers=user_headers)
    assert create_order.status_code == 201
    assert create_order.json()["items"][0]["quantity"] == 3
