from datetime import datetime
from typing import List

from pydantic import BaseModel, ConfigDict


class OrderItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    price: float

class OrderSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    status: str
    subtotal: float
    tax: float
    total: float
    customer_name: str | None = None
    customer_email: str | None = None
    customer_phone: str | None = None
    delivery_address: str | None = None
    delivery_city: str | None = None
    payment_provider: str | None = None
    payment_method: str | None = None
    paid_at: datetime | None = None
    invoice_pdf_path: str | None = None
    invoice_email_sent_to: str | None = None
    invoice_email_sent_at: datetime | None = None
    items: List[OrderItemSchema]
