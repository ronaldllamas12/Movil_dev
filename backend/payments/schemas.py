"""Esquemas para pasarelas de pago."""

from pydantic import BaseModel, EmailStr


class CheckoutCustomerData(BaseModel):
    nombre: str
    correo: EmailStr
    telefono: str
    direccion: str
    ciudad: str


class PayPalCreateOrderResponse(BaseModel):
    order_id: str
    url: str
    amount: str
    currency: str
    invoice: str


class PayPalCaptureResponse(BaseModel):
    success: bool
    order_id: str
    status: str
    provider: str = "paypal"


class EpaycoSessionResponse(BaseModel):
    session_id: str
    token: str | None = None
    invoice: str
    amount: float
    currency: str = "COP"
    provider: str = "epayco"
