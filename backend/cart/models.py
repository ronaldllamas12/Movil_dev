"""Modelo de persistencia del carrito de compras."""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from database.core.database import Base


class CartItem(Base):
    """Ítem del carrito para un usuario autenticado."""

    __tablename__ = "cart_items"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            "color_selected",
            name="uq_cart_items_user_product_color",
        ),
        UniqueConstraint(
            "session_id",
            "product_id",
            "color_selected",
            name="uq_cart_items_session_product_color",
        ),
        Index("ix_cart_items_session_id", "session_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
    )

    session_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    color_selected: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="",
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class CartSettings(Base):
    """Configuración global del carrito (impuesto/envío)."""

    __tablename__ = "cart_settings"

    id: Mapped[int] = mapped_column(primary_key=True)

    tax_percent: Mapped[float] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=19,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
