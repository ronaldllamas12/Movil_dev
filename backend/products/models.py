"""Modelo de productos para el catálogo de Movil-Dev."""

from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    CheckConstraint,
    DateTime,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from database.core.database import Base


class Product(Base):
    """Representa un producto del catálogo."""

    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint(
            "categoria IN ('premium', 'gama media', 'economico')",
            name="ck_products_categoria",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    marca: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    referencia: Mapped[str] = mapped_column(
        String(100), nullable=False, unique=True, index=True
    )
    nombre: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    categoria: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    descripcion_breve: Mapped[str] = mapped_column(String(500), nullable=False)

    cantidad_stock: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    precio_unitario: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)

    tamano_memoria_ram: Mapped[str] = mapped_column(String(50), nullable=False)

    rom: Mapped[str] = mapped_column(String(50), nullable=False)

    colores_disponibles: Mapped[list[str]] = mapped_column(
        JSON, nullable=False, default=list
    )

    conectividad: Mapped[str] = mapped_column(String(120), nullable=False)

    procesador: Mapped[str] = mapped_column(String(120), nullable=False)

    dimensiones: Mapped[str] = mapped_column(String(120), nullable=False)

    bateria: Mapped[str] = mapped_column(String(120), nullable=False)

    resolucion_camara_principal: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
    )

    resolucion_camara_frontal: Mapped[str] = mapped_column(
        String(80),
        nullable=False,
    )

    capacidad_carga_rapida: Mapped[str] = mapped_column(
        String(40),
        nullable=False,
    )

    garantia_meses: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    imagen_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True,
        default=None,
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
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
