"""Additional integration tests for orders router endpoints."""

from decimal import Decimal

from orders.models import Order, OrderStatus
from tests.conftest import auth_headers_for
from users.constants import UserRole


def _create_order_for_user(client, user, product_id):
    add = client.post(
        "/cart/add",
        headers=auth_headers_for(user),
        json={"product_id": product_id, "quantity": 1},
    )
    assert add.status_code == 201
    create = client.post("/orders/", headers=auth_headers_for(user))
    assert create.status_code == 201
    return create.json()["id"]


def test_get_order_success_and_not_found(client, make_user, make_product):
    user = make_user(email="order-get@example.com")
    product = make_product(referencia="ORDER-GET", cantidad_stock=4)
    order_id = _create_order_for_user(client, user, product.id)

    ok = client.get(f"/orders/{order_id}", headers=auth_headers_for(user))
    assert ok.status_code == 200
    assert ok.json()["id"] == order_id

    missing = client.get("/orders/999999", headers=auth_headers_for(user))
    assert missing.status_code == 404


def test_mark_paid_and_cancelled_endpoints(client, db_session, make_user, make_product, monkeypatch):
    user = make_user(email="order-mark@example.com")
    product = make_product(referencia="ORDER-MARK", cantidad_stock=4)
    order_id = _create_order_for_user(client, user, product.id)

    paid_calls = []
    cancel_calls = []

    def fake_mark(db, order_id, provider=None, payment_method=None):
        paid_calls.append((order_id, provider, payment_method))

    def fake_update(db, order_id, status, **kwargs):
        cancel_calls.append((order_id, status))

    monkeypatch.setattr("orders.router.mark_order_paid", fake_mark)
    monkeypatch.setattr("orders.router.update_order_status", fake_update)

    paypal = client.post(f"/orders/paypal/mark-paid/{order_id}")
    epayco = client.post(f"/orders/epayco/mark-paid/{order_id}")
    cancelled = client.post(f"/orders/order/mark-cancelled/{order_id}")

    assert paypal.status_code == 200
    assert epayco.status_code == 200
    assert cancelled.status_code == 200
    assert paid_calls[0][1] == "paypal"
    assert paid_calls[1][1] == "epayco"
    assert cancel_calls == [(order_id, OrderStatus.CANCELLED)]


def test_cancel_my_order_endpoint_calls_service(client, make_user, make_product, monkeypatch):
    user = make_user(email="order-cancel-api@example.com")
    product = make_product(referencia="ORDER-CANCEL", cantidad_stock=4)
    order_id = _create_order_for_user(client, user, product.id)

    def fake_cancel(db, order_id, user_id, reason=None):
        order = db.query(Order).filter(Order.id == order_id).first()
        order.status = OrderStatus.CANCELLED
        db.commit()
        db.refresh(order)
        return order

    monkeypatch.setattr("orders.router.cancel_order_by_user", fake_cancel)

    response = client.post(
        f"/orders/{order_id}/cancel",
        headers=auth_headers_for(user),
        json={"reason": "Cliente"},
    )

    assert response.status_code == 200
    assert response.json()["status"] == OrderStatus.CANCELLED


def test_admin_endpoints_refund_items_send_invoice(client, make_user, make_product, monkeypatch):
    admin = make_user(email="admin-extra@example.com", role=UserRole.ADMIN)
    user = make_user(email="customer-extra@example.com")
    product = make_product(referencia="ORDER-ADMIN-EXTRA", cantidad_stock=4)
    order_id = _create_order_for_user(client, user, product.id)

    def fake_refund(db, order_id, actor_user_id, refund_type, amount, reason):
        order = db.query(Order).filter(Order.id == order_id).first()
        order.status = OrderStatus.REFUNDED
        db.commit()
        db.refresh(order)
        return order

    def fake_send(db, order_id, force=False):
        order = db.query(Order).filter(Order.id == order_id).first()
        return order

    monkeypatch.setattr("orders.router.refund_order", fake_refund)
    monkeypatch.setattr("orders.router.send_order_invoice_email", fake_send)

    refund_resp = client.post(
        f"/orders/admin/{order_id}/refund",
        headers=auth_headers_for(admin),
        json={"refund_type": "total", "amount": None, "reason": "Admin"},
    )
    items_resp = client.get(
        f"/orders/admin/{order_id}/items",
        headers=auth_headers_for(admin),
    )
    send_resp = client.post(
        f"/orders/admin/{order_id}/invoice/send",
        headers=auth_headers_for(admin),
    )

    assert refund_resp.status_code == 200
    assert refund_resp.json()["status"] == OrderStatus.REFUNDED
    assert items_resp.status_code == 200
    assert send_resp.status_code == 200


def test_admin_reports_endpoint_returns_metrics(client, db_session, make_user):
    admin = make_user(email="admin-report@example.com", role=UserRole.ADMIN)
    user = make_user(email="customer-report@example.com")

    order = Order(
        user_id=user.id,
        status=OrderStatus.PAID,
        subtotal=Decimal("100000"),
        tax=Decimal("19000"),
        total=Decimal("119000"),
        customer_name="Cliente",
        customer_email="customer-report@example.com",
    )
    db_session.add(order)
    db_session.commit()

    response = client.get("/orders/admin/reports/sales", headers=auth_headers_for(admin))

    assert response.status_code == 200
    body = response.json()
    assert body["total_orders"] >= 1
    assert "status_breakdown" in body
    assert "recent_orders" in body
