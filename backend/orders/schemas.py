from datetime import datetime
from typing import List, Literal

from pydantic import BaseModel, ConfigDict, Field


class OrderItemSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    price: float


class OrderStatusHistorySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    from_status: str | None
    to_status: str
    reason: str | None
    actor_user_id: int | None
    changed_at: datetime


class OrderRefundSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: float
    refund_type: str
    reason: str | None
    actor_user_id: int | None
    created_at: datetime


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
    cancelled_at: datetime | None = None
    cancellation_reason: str | None = None
    invoice_pdf_path: str | None = None
    invoice_email_sent_to: str | None = None
    invoice_email_sent_at: datetime | None = None
    items: List[OrderItemSchema]
    status_history: List[OrderStatusHistorySchema] = []
    refunds: List[OrderRefundSchema] = []
    user_full_name: str | None = None


class UpdateStatusRequest(BaseModel):
    status: str
    reason: str | None = None


class CancelOrderRequest(BaseModel):
    reason: str | None = None


class RefundOrderRequest(BaseModel):
    refund_type: Literal["partial", "total"]
    amount: float | None = Field(default=None, gt=0)
    reason: str | None = None
