# Estrategia de pruebas

La suite esta organizada por capa y por objetivo de negocio. La idea es que cada tipo de prueba responda a una pregunta distinta: si la logica interna esta bien, si la API responde como se espera, si el flujo completo de compra funciona y si la estructura publica no se rompio.

## Que valida cada suite

| Ruta | Proposito |
| --- | --- |
| `tests/auth/test_auth_services.py` | Registro, autenticacion local, reseteo de contrasena, login con Google, enlace de cuentas y permisos de administrador. |
| `tests/auth/test_security.py` | Hash de contrasenas, verificacion de hash y generacion/decodificacion de tokens JWT. |
| `tests/cart/test_cart_services.py` | Altas y bajas de items del carrito, validaciones de cantidad/stock, mezcla de carrito de invitado y calculo de totales. |
| `tests/products/test_product_services.py` | CRUD de productos, paginacion, validacion de categoria y manejo de referencias duplicadas. |
| `tests/unit/test_auth_dependencies.py` | Dependencias de autenticacion y validacion de roles en FastAPI. |
| `tests/unit/test_cart_router_helpers.py` | Funciones auxiliares del router de carrito. |
| `tests/unit/test_core_settings.py` | Parseo de variables de entorno y helpers de configuracion. |
| `tests/unit/test_core_cors.py` | Reglas CORS, origenes permitidos y middleware para requests OPTIONS. |
| `tests/unit/test_external_integrations.py` | Adaptadores y contratos de integraciones externas aisladas con mocks. |
| `tests/unit/test_orders_invoice_service.py` | Generacion y manejo de facturas. |
| `tests/unit/test_orders_services.py` | Creacion de orden desde carrito, total, rechazo de carrito vacio y cambio de estado. |
| `tests/unit/test_orders_status_service.py` | Transiciones de estado de pedidos y reglas asociadas. |
| `tests/unit/test_payments_services.py` | Calculo de montos y reglas de integracion para PayPal/ePayco sin salir a red. |
| `tests/integration/test_auth_api.py` | Flujo HTTP principal de auth: registro, login, perfil, shipping y logout. |
| `tests/integration/test_auth_extra_api.py` | Endpoints extra de auth: Google, forgot/reset password, avatar, cambio de password y logout. |
| `tests/integration/test_cart_api.py` | Comportamiento HTTP del carrito. |
| `tests/integration/test_products_api.py` | Catalogo HTTP: listado publico, filtros, detalle y CRUD de administrador. |
| `tests/integration/test_payments_api.py` | Flujo HTTP de checkout y creacion de pagos. |
| `tests/integration/test_payments_webhook_api.py` | Recepcion y procesamiento de webhooks de pago. |
| `tests/integration/test_orders_admin_api.py` | Endpoints administrativos de ordenes. |
| `tests/integration/test_orders_invoice_download_api.py` | Descarga de factura desde la API. |
| `tests/integration/test_orders_router_extra_api.py` | Rutas adicionales del router de ordenes. |
| `tests/e2e/test_checkout_flow.py` | Flujo completo de compra de extremo a extremo: registro, catalogo, carrito y orden. |
| `tests/e2e/test_user_admin_end_to_end_flow.py` | Escenario completo entre usuario y administrador. |
| `tests/maintainability/test_api_contracts.py` | Contratos publicos: rutas duplicadas y presencia de dominios en OpenAPI. |
| `tests/performance/test_backend_hotpaths_perf.py` | Hot paths de backend con umbrales amplios para detectar regresiones grandes. |
| `tests/test_register.py` | Smoke test manual del endpoint de registro contra un backend local. |
| `tests/test_smtp.py` | Prueba opcional de conectividad SMTP real. |
| `frontend/src/api/mappers/productMapper.test.js` | Mapeo entre el contrato del backend y el modelo interno del frontend. |

## Tipos de pruebas

- Unitarias: validan reglas de negocio internas sin depender de red ni de servicios externos.
- Integracion: ejercitan endpoints reales de FastAPI con base SQLite aislada.
- E2E: recorren flujos completos de negocio para comprobar que las piezas encajan entre si.
- Mantenibilidad: detectan roturas estructurales, como rutas duplicadas o contratos OpenAPI ausentes.
- Rendimiento: miden puntos calientes para detectar regresiones grandes, no microoptimizaciones.
- Frontend: comprueban transformaciones locales de datos antes de pintar o enviar a la API.

## Como ejecutarlas

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

Para una cobertura mas completa:

```powershell
.\.venv\Scripts\python.exe -m pytest --cov=backend --cov=database --cov-report=term-missing
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

## Convenciones

- Usar `tests/conftest.py` para crear usuarios, productos, tokens y clientes HTTP.
- No llamar PayPal, ePayco, Google ni Cloudinary en unitarias; usar `monkeypatch`.
- Mantener cada prueba enfocada en un comportamiento observable.
- Para endpoints protegidos, usar `auth_headers_for(user)`.
- Para nuevos flujos criticos de compra, agregar una prueba en `tests/e2e`.
- `tests/test_register.py` y `tests/test_smtp.py` son pruebas de apoyo; no forman parte del camino feliz principal de CI si no se activan manualmente.
