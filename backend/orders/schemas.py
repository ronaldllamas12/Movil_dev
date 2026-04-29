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
    items: List[OrderItemSchema]

    cancelled_at: datetime | None = None
    cancelled_reason: str | None = None
    delivered_at: datetime | None = None
    refunded_at: datetime | None = None
    refunded_reason: str | None = None


class SalesReportStatusRow(BaseModel):
    status: str
    orders_count: int
    total_amount: float


class SalesReportResponse(BaseModel):
    start_date: datetime | None = None
    end_date: datetime | None = None
    orders_count: int
    items_count: int
    gross_sales: float
    refunded_amount: float
    net_sales: float
    by_status: list[SalesReportStatusRow]
