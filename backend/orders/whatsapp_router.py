"""Router admin para gestión del estado de conexión de WhatsApp."""

from __future__ import annotations

import os

import requests
from auth.dependencies import get_current_admin
from fastapi import APIRouter, Depends
from fastapi.responses import Response
from users.models import User

router = APIRouter(prefix="/admin/whatsapp", tags=["WhatsApp Admin"])

_TIMEOUT = 6


def _wa_url(path: str) -> str:
    base = os.getenv("WA_SERVICE_URL", "").rstrip("/")
    if not base:
        raise RuntimeError("WA_SERVICE_URL no configurada.")
    if not base.startswith("http://") and not base.startswith("https://"):
        if "localhost" in base or "127.0.0.1" in base:
            base = f"http://{base}"
        else:
            base = f"https://{base}"
    return f"{base}{path}"


@router.get("/status")
def whatsapp_status(
    _admin: User = Depends(get_current_admin),
):
    """Devuelve { ready, hasQR } del microservicio WhatsApp."""
    try:
        resp = requests.get(_wa_url("/api/whatsapp/status"), timeout=_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception:
        return {"ready": False, "hasQR": False, "error": "Microservicio no disponible"}


@router.get("/qr")
def whatsapp_qr(
    _admin: User = Depends(get_current_admin),
):
    """Devuelve la imagen PNG del QR para vincular WhatsApp."""
    try:
        resp = requests.get(_wa_url("/api/whatsapp/qr"), timeout=_TIMEOUT)
        if resp.status_code == 404:
            return {"qr": None, "message": "WhatsApp ya está conectado o aún no genera QR."}
        resp.raise_for_status()
        # El microservicio devuelve PNG binario; lo convertimos a base64 data-URI
        import base64
        data_uri = f"data:image/png;base64,{base64.b64encode(resp.content).decode()}"
        return {"qr": data_uri}
    except Exception:
        return {"qr": None, "message": "Microservicio no disponible"}


@router.post("/connect")
def whatsapp_connect(
    _admin: User = Depends(get_current_admin),
):
    """Conecta el servicio WhatsApp."""
    try:
        resp = requests.post(_wa_url("/api/whatsapp/connect"), timeout=_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"status": "error", "message": f"Error al conectar: {str(e)}"}


@router.post("/disconnect")
def whatsapp_disconnect(
    _admin: User = Depends(get_current_admin),
):
    """Desconecta el servicio WhatsApp."""
    try:
        resp = requests.post(_wa_url("/api/whatsapp/disconnect"), timeout=_TIMEOUT)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"status": "error", "message": f"Error al desconectar: {str(e)}"}
