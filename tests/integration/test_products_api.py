"""Pruebas de integración para endpoints de productos."""

from tests.conftest import auth_headers_for, product_payload
from users.constants import UserRole


def test_public_can_list_filter_and_get_products(client, make_product):
    premium = make_product(referencia="PRE-1", categoria="premium", nombre="Premium")
    make_product(referencia="ECO-1", categoria="economico", nombre="Economico")

    list_response = client.get("/products")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["total"] == 2
    assert len(body["items"]) == 2

    filtered_response = client.get("/products", params={"categoria": "premium"})
    assert filtered_response.status_code == 200
    filtered_body = filtered_response.json()
    assert filtered_body["total"] == 1
    assert [product["id"] for product in filtered_body["items"]] == [premium.id]

    detail_response = client.get(f"/products/{premium.id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["referencia"] == "PRE-1"


def test_admin_product_crud_flow(client, make_user):
    admin = make_user(email="admin-products@example.com", role=UserRole.ADMIN)
    headers = auth_headers_for(admin)

    create_response = client.post(
        "/products",
        headers=headers,
        json=product_payload(referencia="API-CRUD"),
    )
    assert create_response.status_code == 201
    product_id = create_response.json()["id"]

    update_response = client.patch(
        f"/products/{product_id}",
        headers=headers,
        json={"nombre": "Galaxy API Editado", "cantidad_stock": 4},
    )
    assert update_response.status_code == 200
    assert update_response.json()["nombre"] == "Galaxy API Editado"

    status_response = client.patch(
        f"/products/{product_id}/status",
        headers=headers,
        params={"is_active": False},
    )
    assert status_response.status_code == 200
    assert status_response.json()["is_active"] is False

    delete_response = client.delete(f"/products/{product_id}", headers=headers)
    assert delete_response.status_code == 204

    missing_response = client.get(f"/products/{product_id}")
    assert missing_response.status_code == 404


def test_regular_user_cannot_create_product(client, make_user):
    user = make_user(email="regular-products@example.com")

    response = client.post(
        "/products",
        headers=auth_headers_for(user),
        json=product_payload(referencia="DENIED"),
    )

    assert response.status_code == 403
