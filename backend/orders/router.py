from pathlib import Path
from typing import List

from auth.dependencies import get_current_admin, get_current_user
from fastapi import APIRouter, Depends, status
from fastapi.responses import FileResponse
from orders.models import Order, OrderStatus
from orders.schemas import (
    CancelOrderRequest,
    OrderSchema,
    RefundOrderRequest,
    UpdateStatusRequest,
)
from orders.services import (
    cancel_order_by_user,
    create_order_from_cart,
    ensure_order_invoice_pdf,
    mark_order_paid,
    refund_order,
    send_order_invoice_email,
    update_order_status,
)
from sqlalchemy.orm import Session
from users.models import User

from database.core.database import get_db
from database.core.errors import NotFoundError

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.get("/", response_model=List[OrderSchema])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Order)
        .filter(Order.user_id == current_user.id)
        .order_by(Order.created_at.desc())
        .all()
    )


@router.get("/{order_id}", response_model=OrderSchema)
def get_order(
    order_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.user_id == current_user.id)
        .first()
    )
    if not order:
        raise NotFoundError("Orden no encontrada.")
    return order


@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
def create_order(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return create_order_from_cart(db, current_user)


@router.post("/paypal/mark-paid/{order_id}")
def mark_paypal_order_paid(order_id: int, db: Session = Depends(get_db)):
    mark_order_paid(db, order_id, provider="paypal", payment_method="Tarjeta/PayPal")
    return {"success": True}


@router.post("/epayco/mark-paid/{order_id}")
def mark_epayco_order_paid(order_id: int, db: Session = Depends(get_db)):
    mark_order_paid(
        db,
        order_id,
        provider="epayco",
        payment_method="Tarjeta/transferencia ePayco",
    )
    return {"success": True}


@router.post("/order/mark-cancelled/{order_id}")
def mark_order_cancelled(order_id: int, db: Session = Depends(get_db)):
    update_order_status(db, order_id, OrderStatus.CANCELLED, reason="Fallo de pago")
    return {"success": True}


@router.post("/{order_id}/cancel", response_model=OrderSchema)
def cancel_my_order(
    order_id: int,
    payload: CancelOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return cancel_order_by_user(
        db,
        order_id=order_id,
        user_id=current_user.id,
        reason=payload.reason,
    )


@router.get("/admin/", response_model=List[OrderSchema])
def list_all_orders(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    user_ids = [order.user_id for order in orders]
    users = db.query(User).filter(User.id.in_(user_ids)).all()
    user_map = {user.id: user.full_name for user in users}
    for order in orders:
        order.user_full_name = user_map.get(order.user_id)
    return orders


@router.put("/admin/{order_id}/status", response_model=OrderSchema)
def update_order_status_admin(
    order_id: int,
    request: UpdateStatusRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return update_order_status(
        db,
        order_id,
        request.status,
        actor_user_id=current_admin.id,
        reason=request.reason,
    )


@router.post("/admin/{order_id}/refund", response_model=OrderSchema)
def refund_order_admin(
    order_id: int,
    request: RefundOrderRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return refund_order(
        db,
        order_id=order_id,
        actor_user_id=current_admin.id,
        refund_type=request.refund_type,
        amount=request.amount,
        reason=request.reason,
    )


@router.get("/admin/{order_id}/items", response_model=OrderSchema)
def get_order_items_admin(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError(f"Orden {order_id} no encontrada.")
    user = db.query(User).filter(User.id == order.user_id).first()
    order.user_full_name = user.full_name if user else None
    return order


@router.get("/admin/{order_id}/invoice")
def download_order_invoice_admin(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise NotFoundError(f"Orden {order_id} no encontrada.")

    if order.status != OrderStatus.PAID:
        raise NotFoundError("La orden aun no tiene pago exitoso.")

    if not order.invoice_pdf_path:
        ensure_order_invoice_pdf(db, order)
        db.commit()
        db.refresh(order)

    base_dir = Path(__file__).parent.parent.parent.resolve()
    invoices_dir = base_dir / "generated" / "invoices"
    pdf_path = Path(order.invoice_pdf_path)
    if not pdf_path.is_absolute() or invoices_dir not in pdf_path.parents:
        pdf_path = invoices_dir / pdf_path.name
    if not pdf_path.exists() or not pdf_path.is_file():
        pdf_path = ensure_order_invoice_pdf(db, order)
        db.commit()
        db.refresh(order)

    return FileResponse(
        path=str(pdf_path.resolve()),
        media_type="application/pdf",
        filename=pdf_path.name,
    )


@router.post("/admin/{order_id}/invoice/send", response_model=OrderSchema)
def send_order_invoice_admin(
    order_id: int,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    return send_order_invoice_email(db, order_id, force=True)

