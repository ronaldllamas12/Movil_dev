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
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
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

    PAID_STATUSES = {OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.REFUNDED}
    if order.status not in PAID_STATUSES:
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


@router.get("/admin/reports/sales")
def get_sales_report(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
):
    """
    Endpoint para obtener un reporte básico de ventas.
    Devuelve métricas de ventas, estados de órdenes y últimas órdenes.
    Optimizado con joins y agregados SQL para evitar N+1 queries.
    """
    # Total de órdenes (usando SQL count)
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    
    # Definir estados pagados
    paid_statuses = {OrderStatus.PAID, OrderStatus.PROCESSING, OrderStatus.SHIPPED, OrderStatus.DELIVERED}
    
    # Cálculos con agregados SQL para órdenes pagadas
    paid_aggregates = db.query(
        func.sum(Order.total).label("total_revenue"),
        func.sum(Order.tax).label("total_tax"),
        func.count(Order.id).label("paid_count")
    ).filter(Order.status.in_(paid_statuses)).first()
    
    total_revenue = float(paid_aggregates.total_revenue or 0)
    total_tax = float(paid_aggregates.total_tax or 0)
    paid_count = paid_aggregates.paid_count or 0
    
    # Cálculo de total reembolsado
    total_refunded = 0.0
    refund_query = db.query(
        func.sum(Order.refunded_total).label("total_refunded")
    ).filter(Order.status.in_(paid_statuses)).first()
    if refund_query.total_refunded:
        total_refunded = float(refund_query.total_refunded)
    
    # Desglose por estado usando agregados SQL
    status_breakdown = {}
    for status in OrderStatus.ALL:
        count = db.query(func.count(Order.id)).filter(Order.status == status).scalar() or 0
        status_breakdown[status] = count
    
    # Últimas 10 órdenes con usuario prefetched via join
    recent_orders_query = (
        db.query(Order, User)
        .outerjoin(User, Order.user_id == User.id)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )
    
    recent_orders_data = []
    for order, user in recent_orders_query:
        # Fijar operator precedence: customer_name > user.full_name > "Unknown"
        customer_name = order.customer_name or (user.full_name if user else "Unknown")
        recent_orders_data.append({
            "id": order.id,
            "customer_name": customer_name,
            "total": float(order.total),
            "status": order.status,
            "created_at": order.created_at.isoformat() if order.created_at else None,
        })
    
    return {
        "total_orders": total_orders,
        "total_revenue": round(total_revenue, 2),
        "total_tax": round(total_tax, 2),
        "total_refunded": round(total_refunded, 2),
        "average_order_value": round(total_revenue / paid_count, 2) if paid_count > 0 else 0,
        "status_breakdown": status_breakdown,
        "recent_orders": recent_orders_data,
    }

