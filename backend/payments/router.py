"""Rutas para crear y confirmar pagos."""

from auth.dependencies import get_current_user
import requests
from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from orders.services import mark_order_paid, update_order_status
from payments.schemas import (CheckoutCustomerData, EpaycoSessionResponse,
                              PayPalCaptureResponse, PayPalCreateOrderResponse)
from payments.services import (_paypal_access_token, _paypal_api_base,
                               capture_paypal_order, create_epayco_session,
                               create_paypal_order)
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
    db_order_id: int | None = Query(None),
    db: Session = Depends(get_db),
) -> PayPalCaptureResponse:
    """Captura una orden PayPal aprobada por el comprador."""
    result = capture_paypal_order(token)
    if result["success"] and db_order_id:
        mark_order_paid(
            db,
            db_order_id,
            provider="paypal",
            payment_method="Tarjeta/PayPal",
        )
    return PayPalCaptureResponse(**result)


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


async def _handle_epayco_confirmation(
    request: Request, db: Session
) -> dict[str, bool]:
    """Recibe la confirmacion enviada por ePayco y actualiza la orden automáticamente."""
    data = (
        await request.json() if request.headers.get("content-type", "").startswith("application/json")
        else dict(await request.form())
    )
    x_invoice_id = data.get("x_id_invoice") or data.get("x_invoice_id") or data.get("invoice")
    x_cod_response = str(data.get("x_cod_response") or data.get("cod_response") or "").strip()
    x_response = str(data.get("x_response") or data.get("response") or "").lower()
    order_id = (
        data.get("order_id")
        or data.get("x_order_id")
        or data.get("x_extra6")
        or data.get("extra6")
        or x_invoice_id
    )

    try:
        order_id_int = int(str(order_id).replace("order_", ""))
    except (TypeError, ValueError):
        return {"received": False}

    # Estados exitosos: 1 = aprobado
    if x_cod_response == "1" or "aprob" in x_response:
        mark_order_paid(
            db=db,
            order_id=order_id_int,
            provider="epayco",
            payment_method="Tarjeta/transferencia ePayco",
        )
    else:
        update_order_status(db, order_id_int, "cancelled")

    return {"received": True}


@router.post("/epayco/confirmation")
async def receive_epayco_confirmation_post(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    return await _handle_epayco_confirmation(request, db)


@router.get("/epayco/confirmation")
async def receive_epayco_confirmation_get(
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, bool]:
    return await _handle_epayco_confirmation(request, db)


@router.api_route("/paypal/webhook", methods=["POST"])
async def paypal_webhook(
    request: Request,
    db: Session = Depends(get_db),
    paypal_auth_algo: str = Header(None, alias="Paypal-Auth-Algo"),
    paypal_cert_url: str = Header(None, alias="Paypal-Cert-Url"),
    paypal_transmission_id: str = Header(None, alias="Paypal-Transmission-Id"),
    paypal_transmission_sig: str = Header(None, alias="Paypal-Transmission-Sig"),
    paypal_transmission_time: str = Header(None, alias="Paypal-Transmission-Time"),
    paypal_webhook_id: str = Header(None, alias="Paypal-Webhook-Id"),
) -> dict:
    """Webhook para notificaciones de PayPal. Valida firma, consulta la API y actualiza la orden."""
    data = await request.json()
    resource = data.get("resource", {})
    custom_id = resource.get("custom_id") or resource.get("invoice_id")
    capture_id = resource.get("id")
    amount = resource.get("amount", {}).get("value")
    currency = resource.get("amount", {}).get("currency_code")

    # 1. Validar firma del webhook (PayPal recomienda hacerlo con su API)
    verify_url = f"{_paypal_api_base()}/v1/notifications/verify-webhook-signature"
    access_token = _paypal_access_token()
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
    }
    verify_payload = {
        "auth_algo": paypal_auth_algo,
        "cert_url": paypal_cert_url,
        "transmission_id": paypal_transmission_id,
        "transmission_sig": paypal_transmission_sig,
        "transmission_time": paypal_transmission_time,
        "webhook_id": paypal_webhook_id,
        "webhook_event": data,
    }
    resp = requests.post(verify_url, headers=headers, json=verify_payload, timeout=15)
    if resp.status_code != 200 or resp.json().get("verification_status") != "SUCCESS":
        raise HTTPException(status_code=400, detail="Webhook signature invalid")

    # 2. Consultar la API de PayPal para obtener el estado real del pago
    if capture_id:
        capture_url = f"{_paypal_api_base()}/v2/payments/captures/{capture_id}"
        capture_resp = requests.get(capture_url, headers=headers, timeout=15)
        if capture_resp.status_code == 200:
            capture_data = capture_resp.json()
            real_status = capture_data.get("status", "").upper()
            real_amount = capture_data.get("amount", {}).get("value")
            real_currency = capture_data.get("amount", {}).get("currency_code")
            # 3. Comparar datos
            if (
                real_status == "COMPLETED"
                and real_amount == amount
                and real_currency == currency
            ):
                try:
                    order_id_int = int(str(custom_id).replace("order_", ""))
                except (TypeError, ValueError):
                    return {"received": False}
                mark_order_paid(
                    db,
                    order_id_int,
                    provider="paypal",
                    payment_method="Tarjeta/PayPal",
                )
                return {"received": True}
            else:
                # Si el pago no es válido, cancela la orden
                try:
                    order_id_int = int(str(custom_id).replace("order_", ""))
                except (TypeError, ValueError):
                    return {"received": False}
                update_order_status(db, order_id_int, "cancelled")
                return {"received": True}
    return {"received": False}
