"""Rutas REST para la gestión de productos."""

from auth.dependencies import get_current_admin
from cloudinary_utils import upload_image_to_cloudinary
from fastapi import APIRouter, Depends, File, Query, UploadFile, status
from products.schemas import (
    ProductCreate,
    ProductImageUploadResponse,
    ProductResponse,
    ProductUpdate,
)
from products.services import (
    create_product,
    delete_product,
    get_product_by_id,
    list_products,
    toggle_product_active,
    update_product,
)
from sqlalchemy.orm import Session
from users.models import User

from database.core.database import get_db

router = APIRouter(prefix="/products", tags=["Products"])


@router.post("/upload-image", response_model=ProductImageUploadResponse)
async def upload_product_image(
    file: UploadFile = File(...),
    _: User = Depends(get_current_admin),
) -> ProductImageUploadResponse:
    """Sube una imagen de producto a Cloudinary. Solo administradores."""
    upload_result = await upload_image_to_cloudinary(file, folder="movil-dev/products")
    return ProductImageUploadResponse(
        url=upload_result.get("url") or "",
        public_id=upload_result.get("public_id"),
        format=upload_result.get("format"),
    )


@router.get("", response_model=list[ProductResponse])
def get_products(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=200),
    db: Session = Depends(get_db),
) -> list[ProductResponse]:
    """Lista productos disponibles."""
    products = list_products(db, skip=skip, limit=limit)
    return [
        ProductResponse.model_validate(product, from_attributes=True)
        for product in products
    ]


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductResponse:
    """Obtiene un producto por su ID."""
    product = get_product_by_id(db, product_id)
    return ProductResponse.model_validate(product, from_attributes=True)


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_new_product(
    payload: ProductCreate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Crea un producto. Solo administradores."""
    product = create_product(db, payload)
    return ProductResponse.model_validate(product, from_attributes=True)


@router.patch("/{product_id}", response_model=ProductResponse)
def patch_product(
    product_id: int,
    payload: ProductUpdate,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Actualiza parcialmente un producto. Solo administradores."""
    product = update_product(db, product_id, payload)
    return ProductResponse.model_validate(product, from_attributes=True)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_product(
    product_id: int,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> None:
    """Elimina un producto. Solo administradores."""
    delete_product(db, product_id)


@router.patch("/{product_id}/status", response_model=ProductResponse)
def set_product_status(
    product_id: int,
    is_active: bool,
    _: User = Depends(get_current_admin),
    db: Session = Depends(get_db),
) -> ProductResponse:
    """Activa o desactiva un producto. Solo administradores."""
    product = toggle_product_active(db, product_id, is_active)
    return ProductResponse.model_validate(product, from_attributes=True)
