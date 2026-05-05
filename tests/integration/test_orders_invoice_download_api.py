from __future__ import annotations

from pathlib import Path

from tests.conftest import auth_headers_for

from cart.services import add_item_for_user
from orders.models import OrderStatus
from orders.services import create_order_from_cart


def _create_paid_order(db_session, make_user, make_product):
    user = make_user(email="invoice-admin@example.com")
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)
    order = create_order_from_cart(db_session, user)
    order.status = OrderStatus.PAID
    db_session.commit()
    db_session.refresh(order)
    return order


def test_download_order_invoice_admin_rejects_not_found(client, make_user):
    admin = make_user(email="admin-invoice-notfound@example.com", role="administrador")

    resp = client.get("/orders/admin/999999/invoice", headers=auth_headers_for(admin))

    assert resp.status_code == 404


def test_download_order_invoice_admin_rejects_unpaid(client, db_session, make_user, make_product):
    admin = make_user(email="admin-invoice-unpaid@example.com", role="administrador")
    user = make_user(email="buyer-unpaid@example.com")
    product = make_product(precio_unitario=100000, cantidad_stock=5)
    add_item_for_user(db_session, user_id=user.id, product_id=product.id, quantity=1)
    order = create_order_from_cart(db_session, user)

    resp = client.get(f"/orders/admin/{order.id}/invoice", headers=auth_headers_for(admin))

    assert resp.status_code == 404


def test_download_order_invoice_admin_generates_and_returns_pdf(
    monkeypatch,
    tmp_path,
    client,
    db_session,
    make_user,
    make_product,
):
    admin = make_user(email="admin-invoice-ok@example.com", role="administrador")
    order = _create_paid_order(db_session, make_user, make_product)

    pdf_path = tmp_path / "invoice.pdf"
    pdf_path.write_bytes(b"%PDF-1.4\n%fake\n")

    def fake_ensure(db, current_order):
        current_order.invoice_pdf_path = str(pdf_path)
        return pdf_path

    monkeypatch.setattr("orders.router.ensure_order_invoice_pdf", fake_ensure)
    monkeypatch.setattr("orders.router.resolve_invoice_pdf_path", lambda value: Path(value) if value else None)

    resp = client.get(f"/orders/admin/{order.id}/invoice", headers=auth_headers_for(admin))

    assert resp.status_code == 200
    assert resp.headers["content-type"].startswith("application/pdf")
