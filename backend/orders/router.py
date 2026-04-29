from typing import List

from auth.dependencies import get_current_admin, get_current_user
from fastapi import APIRouter, Depends, status
from orders.models import Order, OrderItem
from orders.schemas import OrderSchema
from orders.services import create_order_from_cart, update_order_status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from users.models import User

from database.core.database import get_db
from database.core.errors import NotFoundError

router = APIRouter(prefix="/orders", tags=["Orders"])

class UpdateStatusRequest(BaseModel):
    status: str

@router.get("/", response_model=List[OrderSchema])
def list_orders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Lista todas las órdenes del usuario autenticado."""
    return db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()

@router.get("/{order_id}", response_model=OrderSchema)
def get_order(order_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Obtiene una orden específica del usuario autenticado."""
    order = db.query(Order).filter(Order.id == order_id, Order.user_id == current_user.id).first()
    if not order:
        raise NotFoundError("Orden no encontrada.")
    return order

@router.post("/", response_model=OrderSchema, status_code=status.HTTP_201_CREATED)
def create_order(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Crea una orden a partir del carrito del usuario autenticado."""
    return create_order_from_cart(db, current_user)

@router.post("/paypal/mark-paid/{order_id}")
def mark_paypal_order_paid(order_id: int, db: Session = Depends(get_db)):
    """Marca una orden como pagada tras confirmación de PayPal."""
    update_order_status(db, order_id, "paid")
    return {"success": True}

@router.post("/epayco/mark-paid/{order_id}")
def mark_epayco_order_paid(order_id: int, db: Session = Depends(get_db)):
    """Marca una orden como pagada tras confirmación de ePayco."""
    update_order_status(db, order_id, "paid")
    return {"success": True}

@router.post("/order/mark-cancelled/{order_id}")
def mark_order_cancelled(order_id: int, db: Session = Depends(get_db)):
    """Marca una orden como cancelada si el pago falla."""
    update_order_status(db, order_id, "cancelled")
    return {"success": True}

# Admin routes
@router.get("/admin/", response_model=List[OrderSchema])
def list_all_orders(current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Lista todas las órdenes para administradores."""
    return db.query(Order).order_by(Order.created_at.desc()).all()

@router.put("/admin/{order_id}/status")
def update_order_status_admin(order_id: int, request: UpdateStatusRequest, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Actualiza el estado de una orden para administradores."""
    update_order_status(db, order_id, request.status)
    return {"success": True}

@router.get("/admin/{order_id}/items", response_model=OrderSchema)
def get_order_items_admin(order_id: int, current_admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    """Obtiene la orden (incluyendo sus items) para administradores."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        from database.core.errors import NotFoundError
        raise NotFoundError(f"Orden {order_id} no encontrada.")
    return order
