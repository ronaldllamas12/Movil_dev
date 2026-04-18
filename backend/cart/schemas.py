"""Schemas del dominio de carrito."""

from pydantic import BaseModel, Field


class CartAddRequest(BaseModel):
    """Payload para agregar un producto al carrito."""

    product_id: int = Field(..., ge=1)
    quantity: int = Field(default=1, ge=1)


class CartItemResponse(BaseModel):
    """Representación de un ítem del carrito para respuesta."""

    id: int
    product_id: int
    referencia: str
    nombre: str
    imagen_url: str | None = None
    quantity: int
    price: float
    line_total: float


class CartAddResponse(BaseModel):
    """Respuesta de agregado de ítem al carrito."""

    source: str
    item: CartItemResponse


class CartTotalResponse(BaseModel):
    """Totales de negocio del carrito."""

    source: str
    item_count: int
    subtotal: float
    tax_percent: float
    tax_amount: float
    shipping_fee: float
    total: float


class CartTaxSettingsResponse(BaseModel):
    """Configuración actual de impuesto del carrito."""

    tax_percent: float


class CartTaxSettingsUpdate(BaseModel):
    """Payload para actualizar impuesto del carrito."""

    tax_percent: float = Field(..., ge=0, le=100)
