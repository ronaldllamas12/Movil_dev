"""Archivo principal de la aplicación FastAPI para la autenticación de usuarios."""

from auth.router import router as auth_router
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from database.core.database import Base, get_engine
from database.core.errors import (
    AppError,
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
)

app = FastAPI(title="API de Autenticación")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:5173",
    ],
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


Base.metadata.create_all(bind=get_engine())
app.include_router(auth_router)
