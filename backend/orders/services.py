"""Re-exports de compatibilidad para orders/services.py.

Las implementaciones se han dividido en módulos especializados (Fase 2 — SRP):
  - creation_service.py  → creación de órdenes
  - status_service.py    → transiciones de estado y reembolsos
  - invoice_service.py   → generación de facturas y envío de email
"""

from orders.creation_service import (  # noqa: F401
    create_order_from_cart,
    get_or_create_pending_order_for_checkout,
    save_checkout_customer,
)
from orders.status_service import (  # noqa: F401
    _ALLOWED_TRANSITIONS,
    _as_utc,
    _CANCELLATION_WINDOW_MINUTES,
    _create_status_history,
    _refunded_total,
    _transition_order_status,
    _whatsapp_product_names,
    cancel_order_by_user,
    mark_order_paid,
    refund_order,
    update_order_status,
)
from orders.invoice_service import (  # noqa: F401
    _ensure_paid_invoice,
    ensure_order_invoice_pdf,
    send_order_invoice_email,
)
