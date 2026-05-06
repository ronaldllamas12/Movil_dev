"""Integration tests for order/admin endpoints."""

from tests.conftest import auth_headers_for
from users.constants import UserRole


def test_admin_can_list_and_update_orders(client, make_user, make_product):
    admin = make_user(email="admin-orders@example.com", role=UserRole.ADMIN)
    customer = make_user(email="customer-orders@example.com")
    product = make_product(referencia="ORDER-ADM-1", precio_unitario=120000, cantidad_stock=5)

    add = client.post(
        "/cart/add",
        headers=auth_headers_for(customer),
        json={"product_id": product.id, "quantity": 1},
    )
    assert add.status_code == 201

    create_order = client.post("/orders/", headers=auth_headers_for(customer))
    assert create_order.status_code == 201
    order_id = create_order.json()["id"]

    list_admin = client.get("/orders/admin/", headers=auth_headers_for(admin))
    assert list_admin.status_code == 200
    assert any(order["id"] == order_id for order in list_admin.json())

    update_status = client.put(
        f"/orders/admin/{order_id}/status",
        headers=auth_headers_for(admin),
        json={"status": "cancelled", "reason": "Prueba administrativa"},
    )
    assert update_status.status_code == 200
    assert update_status.json()["status"] == "cancelled"


def test_regular_user_cannot_access_admin_orders_endpoint(client, make_user):
    regular = make_user(email="user-no-admin@example.com")

    response = client.get("/orders/admin/", headers=auth_headers_for(regular))

    assert response.status_code == 403
