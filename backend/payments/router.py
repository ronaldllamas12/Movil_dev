"""Rutas para crear y confirmar pagos."""

from auth.dependencies import get_current_user
from fastapi import APIRouter, Depends, Query, Request
from payments.schemas import (
    CheckoutCustomerData,
    EpaycoSessionResponse,
    PayPalCaptureResponse,
    PayPalCreateOrderResponse,
)
from payments.services import (
    capture_paypal_order,
    create_epayco_session,
    create_paypal_order,
)
from sqlalchemy.orm import Session
from users.models import User

from database.core.database import get_db

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.post("/paypal/create-order", response_model=PayPalCreateOrderResponse)
def create_paypal_checkout_order(
    payload: CheckoutCustomerData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PayPalCreateOrderResponse:
    """Crea una orden PayPal usando el total real del carrito del usuario."""
    return PayPalCreateOrderResponse(
        **create_paypal_order(db=db, user=current_user, customer=payload)
    )


@router.post("/paypal/capture-order", response_model=PayPalCaptureResponse)
def capture_paypal_checkout_order(
    token: str = Query(...),
) -> PayPalCaptureResponse:
    """Captura una orden PayPal aprobada por el comprador."""
    return PayPalCaptureResponse(**capture_paypal_order(token))


@router.post("/epayco/create-session", response_model=EpaycoSessionResponse)
def create_epayco_checkout_session(
    payload: CheckoutCustomerData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> EpaycoSessionResponse:
    """Crea una sesion de Smart Checkout ePayco usando el carrito del usuario."""
    return EpaycoSessionResponse(
        **create_epayco_session(db=db, user=current_user, customer=payload)
    )


@router.api_route("/epayco/confirmation", methods=["GET", "POST"])
async def receive_epayco_confirmation(request: Request) -> dict[str, bool]:
    """Recibe la confirmacion enviada por ePayco."""
    if request.method == "POST":
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            await request.json()
        else:
            await request.form()

    return {"received": True}
