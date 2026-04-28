from datetime import datetime
from typing import List

from pydantic import BaseModel


class OrderItemSchema(BaseModel):
    id: int
    product_id: int
    quantity: int
    price: float

    class Config:
        orm_mode = True

class OrderSchema(BaseModel):
    id: int
    user_id: int
    created_at: datetime
    status: str
    subtotal: float
    tax: float
    total: float
    items: List[OrderItemSchema]

    class Config:
        orm_mode = True
    class Config:
        orm_mode = True
