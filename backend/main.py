"""Archivo principal de la aplicación FastAPI para la API."""

import os
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

# Evita colisión con el paquete externo `auth` (site-packages) asegurando
# que el `backend/` local quede primero en sys.path cuando ejecutamos `uvicorn main:app`.
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
load_dotenv(PROJECT_ROOT / ".env")
load_dotenv(BACKEND_DIR / ".env", override=False)
for path in (BACKEND_DIR, PROJECT_ROOT):
    path_str = str(path)
    if path_str not in sys.path:
        sys.path.insert(0, path_str)

from auth.router import router as auth_router
from cart.models import CartItem
from cart.router import router as cart_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from orders.models import Order, OrderItem, OrderRefund, OrderStatusHistory
from payments.router import router as payments_router
from products.models import Product
from products.router import router as products_router

from database.core.database import (Base, ensure_cart_items_session_column,
                                    ensure_orders_invoice_columns,
                                    ensure_products_new_columns,
                                    ensure_user_role_column, get_engine)
from database.core.errors import (AppError, ConflictError, ForbiddenError,
                                  NotFoundError, UnauthorizedError)


def _parse_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ALLOW_ORIGINS", "")
    configured_origins = [
        origin.strip() for origin in raw_origins.split(",") if origin.strip()
    ]

    if configured_origins:
        return configured_origins

    return [
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "https://movil-dev.vercel.app",
        "https://movil-dev.onrender.com"
    ]


def _parse_cors_origin_regex() -> str | None:
    configured_regex = os.getenv("CORS_ALLOW_ORIGIN_REGEX", "").strip()
    if configured_regex:
        return configured_regex

    # Permite dominios de preview/branch en Vercel.
    return r"https://.*\.vercel\.app"


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Inicializa la base de datos al arrancar la aplicación."""
    engine = get_engine()
    Base.metadata.create_all(bind=engine)
    ensure_user_role_column(engine)
    ensure_products_new_columns(engine)
    ensure_orders_invoice_columns(engine)
    ensure_cart_items_session_column(engine)
    yield


app = FastAPI(title="API de Autenticación", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_cors_origins(),
    allow_origin_regex=_parse_cors_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    """Ruta raíz para verificar que la API está funcionando."""
    return {"message": "¡Bienvenido a la API de Autenticación!"}


def _error_response(status_code: int, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=status_code, content={"detail": exc.message})


@app.exception_handler(UnauthorizedError)
def handle_unauthorized(_: Request, exc: UnauthorizedError):
    """Manejador de errores para UnauthorizedError."""
    return _error_response(401, exc)


@app.exception_handler(ForbiddenError)
def handle_forbidden(_: Request, exc: ForbiddenError):
    """Manejador de errores para ForbiddenError."""
    return _error_response(403, exc)


@app.exception_handler(NotFoundError)
def handle_not_found(_: Request, exc: NotFoundError):
    """Manejador de errores para NotFoundError."""
    return _error_response(404, exc)


@app.exception_handler(ConflictError)
def handle_conflict(_: Request, exc: ConflictError):
    """Manejador de errores para ConflictError."""
    return _error_response(409, exc)


app.include_router(auth_router)
app.include_router(products_router)
app.include_router(cart_router)
app.include_router(payments_router)

# Importa y registra el router de órdenes
from orders.router import router as orders_router
from orders.whatsapp_router import router as whatsapp_admin_router

app.include_router(orders_router)
app.include_router(whatsapp_admin_router)
