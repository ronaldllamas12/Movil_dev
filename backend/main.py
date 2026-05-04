"""Archivo principal de la aplicación FastAPI para la API."""

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

# Import side effects ensure all SQLAlchemy models are registered in Base metadata.
import cart.models  # noqa: F401
import orders.models  # noqa: F401
import products.models  # noqa: F401

from api.router import api_router
from core.bootstrap import initialize_database_schema
from core.cors import ensure_cors_headers_middleware
from core.settings import Settings
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.core.database import get_engine
from database.core.errors import (AppError, ConflictError, ForbiddenError,NotFoundError, UnauthorizedError)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Inicializa la base de datos al arrancar la aplicación."""
    engine = get_engine()
    initialize_database_schema(engine)
    yield


app = FastAPI(title="API de Autenticación", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=Settings.cors_origins,
    allow_origin_regex=Settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.middleware("http")(ensure_cors_headers_middleware)


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


app.include_router(api_router)
