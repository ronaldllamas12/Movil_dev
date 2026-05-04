from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.core.database import Base


class OrderStatus:
    PENDING = "pending"
    PAID = "paid"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"

    ALL = {
        PENDING,
        PAID,
        PROCESSING,
        SHIPPED,
        DELIVERED,
        CANCELLED,
        REFUNDED,
    }


class RefundType:
    PARTIAL = "partial"
    TOTAL = "total"


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    status: Mapped[str] = mapped_column(String(32), default=OrderStatus.PENDING)
    subtotal: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    total: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    customer_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    customer_phone: Mapped[str | None] = mapped_column(String(40), nullable=True)
    delivery_address: Mapped[str | None] = mapped_column(String(300), nullable=True)
    delivery_city: Mapped[str | None] = mapped_column(String(120), nullable=True)
    shipping_company: Mapped[str | None] = mapped_column(String(120), nullable=True)
    tracking_number: Mapped[str | None] = mapped_column(String(120), nullable=True)
    payment_provider: Mapped[str | None] = mapped_column(String(40), nullable=True)
    payment_method: Mapped[str | None] = mapped_column(String(80), nullable=True)
    paid_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancellation_reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    invoice_pdf_path: Mapped[str | None] = mapped_column(String(500), nullable=True)
    invoice_email_sent_to: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_email_sent_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    items = relationship("OrderItem", back_populates="order")
    status_history = relationship(
        "OrderStatusHistory",
        back_populates="order",
        cascade="all, delete-orphan",
    )
    refunds = relationship(
        "OrderRefund",
        back_populates="order",
        cascade="all, delete-orphan",
    )

    @property
    def refunded_total(self) -> Decimal:
        return sum((Decimal(str(r.amount)) for r in self.refunds), Decimal("0.00"))

    def to_invoice_dict(self) -> dict:
        return {
            "issuer": {
                "name": "Movil Dev S.A.S.",
                "nit": "123456789-0",
            },
            "buyer": {
                "name": self.customer_name or "Cliente",
                "nit": "No aplica",
                "email": self.customer_email or "No especificado",
                "delivery_address": self.delivery_address or "No especificada",
            },
            "numbering": {
                "prefix": "MDV",
                "number": str(self.id),
                "authorized_range": "",
                "validity": "",
            },
            "tax_quality": "Responsable de IVA",
            "tech_provider": {
                "software_name": "Sistema Movil Dev",
                "name": "",
                "nit": "",
            },
            "totals": {
                "subtotal": float(self.subtotal),
                "tax": float(self.tax),
                "iva": float(self.tax),
                "consumption_tax": 0.0,
                "plastic_bag_tax": 0.0,
                "line_count": len(self.items),
                "total": float(self.total),
            },
            "document_name": "Factura de venta",
            "invoice_number": str(self.id),
            "issued_at": str(self.created_at),
            "payment": {
                "form": self.payment_provider or "Pago electronico",
                "method": self.payment_method or "Online",
            },
            "items": [
                item.to_invoice_dict()
                if hasattr(item, "to_invoice_dict")
                else {
                    "line": idx + 1,
                    "name": getattr(item, "name", ""),
                    "quantity": getattr(item, "quantity", getattr(item, "qty", 1)),
                    "unit": getattr(item, "unit", "und"),
                    "description": getattr(item, "description", ""),
                    "code": getattr(item, "code", ""),
                    "taxes": getattr(item, "taxes", []),
                    "unit_price": float(
                        getattr(item, "unit_price", getattr(item, "price", 0))
                    ),
                    "line_total": float(
                        getattr(
                            item,
                            "line_total",
                            getattr(
                                item,
                                "total",
                                getattr(item, "price", 0)
                                * getattr(item, "quantity", getattr(item, "qty", 1)),
                            ),
                        )
                    ),
                }
                for idx, item in enumerate(self.items)
            ],
            "cufe": getattr(self, "cufe", ""),
        }


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    color_selected: Mapped[str | None] = mapped_column(String(50), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    from_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    to_status: Mapped[str] = mapped_column(String(32), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="status_history")


class OrderRefund(Base):
    __tablename__ = "order_refunds"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    refund_type: Mapped[str] = mapped_column(String(16), nullable=False)
    reason: Mapped[str | None] = mapped_column(String(300), nullable=True)
    actor_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    order = relationship("Order", back_populates="refunds")
