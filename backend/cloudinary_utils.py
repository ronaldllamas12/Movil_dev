"""Utilidades para subida de imágenes a Cloudinary."""

import os
from typing import Any

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024


def _configure_cloudinary() -> None:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not cloud_name or not api_key or not api_secret:
        raise HTTPException(
            status_code=500,
            detail=(
                "Cloudinary no esta configurado. Define CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET en .env"
            ),
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


def _validate_image_file(file: UploadFile, raw_data: bytes) -> None:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, detail="El archivo debe ser una imagen valida."
        )

    if len(raw_data) > MAX_IMAGE_SIZE_BYTES:
        raise HTTPException(
            status_code=400, detail="La imagen excede el limite de 5MB."
        )


async def upload_image_to_cloudinary(file: UploadFile, folder: str) -> dict[str, Any]:
    """Sube una imagen a Cloudinary y retorna metadata relevante."""
    _configure_cloudinary()

    raw_data = await file.read()
    _validate_image_file(file, raw_data)

    try:
        result = cloudinary.uploader.upload(
            raw_data,
            folder=folder,
            resource_type="image",
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(
            status_code=502,
            detail="No se pudo subir la imagen a Cloudinary.",
        ) from exc

    return {
        "url": result.get("secure_url"),
        "public_id": result.get("public_id"),
        "format": result.get("format"),
    }
