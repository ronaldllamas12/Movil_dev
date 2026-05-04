"""Router composition for the main FastAPI application."""

from auth.router import router as auth_router
from cart.router import router as cart_router
from fastapi import APIRouter
from orders.router import router as orders_router
from orders.whatsapp_router import router as whatsapp_admin_router
from payments.router import router as payments_router
from products.router import router as products_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(products_router)
api_router.include_router(cart_router)
api_router.include_router(payments_router)
api_router.include_router(orders_router)
api_router.include_router(whatsapp_admin_router)
