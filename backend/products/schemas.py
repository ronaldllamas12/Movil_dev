"""Schemas Pydantic para el dominio de productos."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ProductCategory = Literal["premium", "gama media", "economico"]


class ProductColorVariant(BaseModel):
    """Variante de producto por color para detalle visual e inventario."""

    color: str = Field(..., min_length=1, max_length=50)
    image_url: str | None = Field(default=None, max_length=500)
    stock: int = Field(..., ge=0)


class ProductBase(BaseModel):
    """Campos base compartidos para creación y actualización de productos."""

    marca: str = Field(..., min_length=1, max_length=100)
    referencia: str = Field(..., min_length=1, max_length=100)
    nombre: str = Field(..., min_length=1, max_length=200)
    categoria: ProductCategory
    descripcion_breve: str = Field(..., min_length=1, max_length=500)
    cantidad_stock: int = Field(..., ge=0)
    precio_unitario: float = Field(..., ge=0)
    tamano_memoria_ram: str = Field(..., min_length=1, max_length=50)
    rom: str = Field(..., min_length=1, max_length=50)
    colores_disponibles: list[str] = Field(default_factory=list)
    color_variants: list[ProductColorVariant] = Field(default_factory=list)
    conectividad: str = Field(..., min_length=1, max_length=120)
    procesador: str = Field(..., min_length=1, max_length=120)
    dimensiones: str = Field(..., min_length=1, max_length=120)
    bateria: str = Field(..., min_length=1, max_length=120)
    resolucion_camara_principal: str = Field(..., min_length=1, max_length=80)
    resolucion_camara_frontal: str = Field(..., min_length=1, max_length=80)
    capacidad_carga_rapida: str = Field(..., min_length=1, max_length=40)
    garantia_meses: int = Field(..., ge=0)
    imagen_url: str | None = Field(default=None, max_length=500)
    is_active: bool = True
    is_featured: bool = False


class ProductCreate(ProductBase):
    """Schema para crear productos."""


class ProductUpdate(BaseModel):
    """Schema para actualización parcial de productos."""

    marca: str | None = Field(default=None, min_length=1, max_length=100)
    referencia: str | None = Field(default=None, min_length=1, max_length=100)
    nombre: str | None = Field(default=None, min_length=1, max_length=200)
    categoria: ProductCategory | None = None
    descripcion_breve: str | None = Field(default=None, min_length=1, max_length=500)
    cantidad_stock: int | None = Field(default=None, ge=0)
    precio_unitario: float | None = Field(default=None, ge=0)
    tamano_memoria_ram: str | None = Field(default=None, min_length=1, max_length=50)
    rom: str | None = Field(default=None, min_length=1, max_length=50)
    colores_disponibles: list[str] | None = None
    color_variants: list[ProductColorVariant] | None = None
    conectividad: str | None = Field(default=None, min_length=1, max_length=120)
    procesador: str | None = Field(default=None, min_length=1, max_length=120)
    dimensiones: str | None = Field(default=None, min_length=1, max_length=120)
    bateria: str | None = Field(default=None, min_length=1, max_length=120)
    resolucion_camara_principal: str | None = Field(
        default=None,
        min_length=1,
        max_length=80,
    )
    resolucion_camara_frontal: str | None = Field(
        default=None, min_length=1, max_length=80
    )
    capacidad_carga_rapida: str | None = Field(
        default=None, min_length=1, max_length=40
    )
    garantia_meses: int | None = Field(default=None, ge=0)
    imagen_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    is_featured: bool | None = None


class ProductResponse(ProductBase):
    """Schema de respuesta para productos."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class ProductImageUploadResponse(BaseModel):
    """Respuesta de subida de imagen de producto."""

    url: str
    public_id: str | None = None
    format: str | None = None
