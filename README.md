# Movil-Dev Ecommerce

Movil-Dev es una aplicacion ecommerce para vender celulares y productos tecnologicos. El sistema cubre el flujo principal de compra: registro e inicio de sesion, catalogo, carrito, checkout, pagos, ordenes, facturas, panel administrativo y notificaciones por WhatsApp.

## Contenido

- [Vision general](#vision-general)
- [Tecnologias](#tecnologias)
- [Arquitectura](#arquitectura)
- [Instalacion y ejecucion](#instalacion-y-ejecucion)
- [Variables de entorno](#variables-de-entorno)
- [API principal](#api-principal)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Backend en detalle](#backend-en-detalle)
- [Frontend en detalle](#frontend-en-detalle)
- [Base de datos y migraciones](#base-de-datos-y-migraciones)
- [Microservicio de WhatsApp](#microservicio-de-whatsapp)
- [Pruebas](#pruebas)

## Vision general

El objetivo del proyecto es construir un MVP funcional de ecommerce para Movil-Dev.

Funcionalidades principales:

- Registro, login local con JWT y login con Google.
- Perfil de usuario, avatar, informacion de envio y recuperacion de contrasena.
- Catalogo de productos con informacion tecnica, imagenes, categorias, stock y variantes por color.
- Carrito para usuarios autenticados en base de datos.
- Carrito para invitados mediante cookies.
- Calculo de subtotal, impuesto y envio.
- Checkout con PayPal y ePayco.
- Creacion y gestion de ordenes.
- Estados de pedido: `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`.
- Facturas PDF generadas con ReportLab.
- Envio de facturas por SMTP.
- Panel administrador para productos, pedidos, reportes, impuestos y WhatsApp.
- Microservicio Node.js para envio de mensajes de WhatsApp con Baileys.

## Tecnologias

Backend:

- Python 3.12
- FastAPI
- SQLAlchemy 2
- Pydantic 2
- PostgreSQL mediante `psycopg`
- JWT con `python-jose`
- Hash de contrasenas con `passlib` y `bcrypt`
- Cloudinary para imagenes
- PayPal y ePayco para pagos
- ReportLab y QRCode para facturas
- Pytest y pytest-cov

Frontend:

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React y React Icons
- Sentry React

WhatsApp:

- Node.js
- Express
- Baileys
- QRCode
- Pino

Infraestructura:

- Docker
- GitHub Actions
- Vercel para frontend
- Render o servicio compatible para backend/microservicio
- Alembic/Flask-Migrate para migraciones

## Arquitectura

```text
Usuario navegador
    |
    v
Frontend React/Vite
    |
    v
API REST FastAPI
    |
    +--> Modulo Auth
    +--> Modulo Products
    +--> Modulo Cart
    +--> Modulo Orders
    +--> Modulo Payments
    +--> Modulo WhatsApp Admin
    |
    v
SQLAlchemy + PostgreSQL
    |
    +--> Cloudinary
    +--> PayPal
    +--> ePayco
    +--> SMTP
    +--> Microservicio WhatsApp Node/Baileys
```

Separacion principal:

- `frontend/`: interfaz de usuario, rutas, componentes, contexto y consumo de API.
- `backend/`: API REST, reglas de negocio, validaciones, integraciones y orquestacion.
- `database/`: configuracion compartida de SQLAlchemy, seguridad y errores de dominio.
- `migrations/`: migraciones de base de datos.
- `whatsapp-service/`: microservicio independiente para WhatsApp.
- `tests/`: pruebas unitarias, integracion, E2E backend, performance y contratos.
- `docs/` e `info_project/`: documentacion funcional y del dominio.

## Instalacion y ejecucion

### Backend

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

La API queda disponible en:

```text
http://localhost:8000
http://localhost:8000/docs
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

La aplicacion queda disponible normalmente en:

```text
http://localhost:5173
```

### WhatsApp service

```powershell
cd whatsapp-service
npm install
npm run dev
```

El servicio escucha por defecto en:

```text
http://localhost:3001
```

### Docker backend

```powershell
docker build -t movil-dev-backend .
docker run --env-file .env -p 8000:8000 movil-dev-backend
```

## Variables de entorno

Variables principales usadas por el backend:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | URL de conexion PostgreSQL. |
| `APP_JWT_SECRET` | Secreto obligatorio para firmar JWT. |
| `APP_JWT_ALGORITHM` | Algoritmo JWT. Por defecto `HS256`. |
| `APP_JWT_EXPIRATION` | Expiracion de tokens/cookie. |
| `CORS_ALLOW_ORIGINS` | Lista CSV de origenes permitidos. |
| `CORS_ALLOW_ORIGIN_REGEX` | Regex para origenes CORS, por defecto Vercel. |
| `AUTO_APPLY_SCHEMA_CHANGES` | Aplica parches de esquema al arrancar. |
| `GOOGLE_CLIENT_ID` | Cliente OAuth de Google. |
| `CLOUDINARY_CLOUD_NAME` | Cuenta Cloudinary. |
| `CLOUDINARY_API_KEY` | API key de Cloudinary. |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary. |
| `CART_TAX_PERCENT` | Porcentaje de impuesto inicial. |
| `CART_SHIPPING_MODE` | Modo de envio: `fixed` o `dynamic`. |
| `CART_SHIPPING_FIXED_FEE` | Tarifa fija de envio. |
| `CART_SHIPPING_DYNAMIC_PER_ITEM` | Tarifa dinamica por item. |
| `CART_FREE_SHIPPING_FROM` | Subtotal desde el que el envio es gratis. |
| `CART_COOKIE_SAMESITE` | SameSite de cookie del carrito invitado. |
| `CART_COOKIE_SECURE` | Cookie segura para carrito invitado. |
| `FRONTEND_URL` | URL base del frontend para retornos de pasarela. |
| `BACKEND_URL` | URL base del backend para webhooks/confirmaciones. |
| `PAYPAL_MODE` | `sandbox` o `live`. |
| `PAYPAL_CLIENT_ID` | Credencial PayPal. |
| `PAYPAL_CLIENT_SECRET` | Credencial PayPal. |
| `PAYPAL_CURRENCY` | Moneda PayPal. Por defecto `USD`. |
| `PAYPAL_COP_TO_USD_RATE` | Tasa de conversion COP a USD. |
| `EPAYCO_PUBLIC_KEY` | Llave publica ePayco. |
| `EPAYCO_PRIVATE_KEY` | Llave privada ePayco. |
| `EPAYCO_CONFIRMATION_URL` | URL publica de confirmacion ePayco. |
| `SMTP_PROVIDER` | Proveedor SMTP. |
| `SMTP_HOST_GMAIL` | Host SMTP para Gmail. |
| `SMTP_PORT` | Puerto SMTP. |
| `SMTP_USER_GMAIL` | Usuario SMTP. |
| `SMTP_PASSWORD_GMAIL` | Password/app password SMTP. |
| `GMAIL_APP_PASSWORD` | Alternativa para password SMTP. |
| `MAIL_FROM_GMAIL` | Remitente de correos. |
| `MAIL_FROM_NAME` | Nombre del remitente. |
| `ORDER_CANCELLATION_WINDOW_MINUTES` | Minutos permitidos para cancelar orden. |
| `WA_SERVICE_URL` | URL del microservicio WhatsApp. |

Variables principales del frontend:

| Variable | Uso |
| --- | --- |
| `VITE_API_BASE_URL` | URL base de la API. |
| `VITE_BASE_URL` | Fallback de URL base de API. |

Variables principales de WhatsApp service:

| Variable | Uso |
| --- | --- |
| `WA_SERVICE_PORT` | Puerto HTTP. Por defecto `3001`. |
| `WA_AUTH_DIR` | Directorio persistente de sesion Baileys. |
| `WA_AUTH_FALLBACK_DIR` | Directorio fallback de sesion. |
| `WA_RECONNECT_DELAY_MS` | Retardo entre reconexiones. |
| `WA_MAX_RETRIES` | Maximo de reintentos antes de enfriar. |
| `WA_RESET_SESSION_ON_LOGOUT` | Borra sesion si WhatsApp reporta logout. |
| `WA_WATCHDOG_INTERVAL_MS` | Intervalo del watchdog de conexion. |
| `WA_CONNECT_TIMEOUT_MS` | Timeout de conexion. |
| `WA_KEEPALIVE_INTERVAL_MS` | Keep alive del socket. |
| `WA_RETRY_COOLDOWN_MS` | Enfriamiento despues de maximos reintentos. |
| `WA_AUTO_INIT` | Inicia conexion automaticamente si no es `false`. |

## API principal

### Health

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/` | Mensaje de bienvenida de la API. |
| `GET` | `/health` | Verifica API y conexion a base de datos. |

### Auth

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/auth/register` | Registro publico de usuario normal. |
| `POST` | `/auth/admin/register` | Registro de usuarios por administrador. |
| `POST` | `/auth/login` | Login local, retorna token y crea cookie httpOnly. |
| `POST` | `/auth/google` | Login o registro mediante Google ID token. |
| `POST` | `/auth/forgot-password` | Solicita recuperacion de contrasena. |
| `POST` | `/auth/reset-password` | Cambia contrasena usando token temporal. |
| `GET` | `/auth/me` | Perfil del usuario autenticado. |
| `POST` | `/auth/password` | Agrega o cambia contrasena. |
| `POST` | `/auth/me/avatar` | Sube avatar a Cloudinary. |
| `PATCH` | `/auth/me/shipping` | Guarda datos frecuentes de envio. |
| `POST` | `/auth/logout` | Revoca token y limpia cookie. |

### Products

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/products` | Lista productos con paginacion y filtro por categoria. |
| `GET` | `/products/{product_id}` | Consulta producto por ID. |
| `POST` | `/products` | Crea producto. Solo admin. |
| `PATCH` | `/products/{product_id}` | Actualiza producto. Solo admin. |
| `DELETE` | `/products/{product_id}` | Elimina producto. Solo admin. |
| `PATCH` | `/products/{product_id}/status` | Activa o desactiva producto. Solo admin. |
| `POST` | `/products/upload-image` | Sube imagen de producto a Cloudinary. Solo admin. |

### Cart

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/cart/items` | Lista items del carrito autenticado o invitado. |
| `POST` | `/cart/add` | Agrega producto con validacion de stock/color. |
| `DELETE` | `/cart/remove/{item_id}` | Elimina item del carrito. |
| `GET` | `/cart/total` | Calcula subtotal, impuesto, envio y total. |
| `POST` | `/cart/merge` | Fusiona carrito invitado en carrito autenticado. |
| `GET` | `/cart/settings/tax` | Consulta impuesto vigente. |
| `PUT` | `/cart/settings/tax` | Actualiza impuesto. Solo admin. |

### Orders

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/orders/` | Lista ordenes del usuario autenticado. |
| `GET` | `/orders/{order_id}` | Consulta orden propia. |
| `POST` | `/orders/` | Crea orden desde carrito. |
| `POST` | `/orders/paypal/mark-paid/{order_id}` | Marca orden pagada por PayPal. |
| `POST` | `/orders/epayco/mark-paid/{order_id}` | Marca orden pagada por ePayco. |
| `POST` | `/orders/order/mark-cancelled/{order_id}` | Marca orden cancelada por fallo de pago. |
| `POST` | `/orders/{order_id}/cancel` | Cancela orden propia dentro de la ventana permitida. |
| `GET` | `/orders/admin/` | Lista todas las ordenes. Solo admin. |
| `PUT` | `/orders/admin/{order_id}/status` | Cambia estado de una orden. Solo admin. |
| `POST` | `/orders/admin/{order_id}/refund` | Registra reembolso parcial o total. Solo admin. |
| `GET` | `/orders/admin/{order_id}/items` | Consulta detalle de orden. Solo admin. |
| `GET` | `/orders/admin/{order_id}/invoice` | Descarga factura PDF. Solo admin. |
| `POST` | `/orders/admin/{order_id}/invoice/send` | Envia factura por correo. Solo admin. |
| `GET` | `/orders/admin/reports/sales` | Reporte basico de ventas. Solo admin. |

### Payments

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `POST` | `/payments/paypal/create-order` | Crea orden PayPal desde carrito real. |
| `POST` | `/payments/paypal/capture-order` | Captura orden aprobada por PayPal. |
| `POST` | `/payments/epayco/create-session` | Crea sesion Smart Checkout ePayco. |
| `POST` | `/payments/epayco/confirmation` | Webhook/confirmacion ePayco. |
| `GET` | `/payments/epayco/confirmation` | Confirmacion ePayco por query/form. |
| `POST` | `/payments/paypal/webhook` | Webhook PayPal con verificacion de firma. |

### WhatsApp Admin

| Metodo | Ruta | Descripcion |
| --- | --- | --- |
| `GET` | `/admin/whatsapp/status` | Estado de conexion del microservicio. Solo admin. |
| `GET` | `/admin/whatsapp/qr` | QR para vincular WhatsApp. Solo admin. |
| `POST` | `/admin/whatsapp/connect` | Inicia conexion WhatsApp. Solo admin. |
| `POST` | `/admin/whatsapp/disconnect` | Cierra conexion WhatsApp. Solo admin. |

## Estructura del proyecto

```text
Movil-Dev/
|-- .github/
|   `-- workflows/
|-- backend/
|   |-- api/
|   |-- auth/
|   |-- cart/
|   |-- core/
|   |-- orders/
|   |-- payments/
|   |-- products/
|   |-- users/
|   |-- cloudinary_utils.py
|   |-- flask_migrate_app.py
|   `-- main.py
|-- database/
|   `-- core/
|-- docs/
|-- frontend/
|   |-- public/
|   `-- src/
|-- generated/
|   `-- invoices/
|-- info_project/
|-- migrations/
|   `-- versions/
|-- tests/
|-- whatsapp-service/
|-- Dockerfile
|-- pyproject.toml
|-- requirements.txt
`-- README.md
```

Carpetas principales:

| Carpeta | Proposito |
| --- | --- |
| `.github/workflows/` | Flujos CI/CD de GitHub Actions. |
| `.vscode/` | Configuracion local de editor. |
| `backend/` | API FastAPI y modulos de negocio. |
| `database/` | Base declarativa, engine, sesiones, seguridad y errores compartidos. |
| `docs/` | Documentos tecnicos del dominio y pruebas. |
| `frontend/` | Aplicacion web React/Vite. |
| `generated/invoices/` | Salida canonica de facturas PDF generadas. |
| `htmlcov/` | Reporte HTML de cobertura generado por pytest-cov. |
| `info_project/` | Documentos de alcance, fases, evaluacion y guias. |
| `migrations/` | Configuracion y versiones de migraciones. |
| `tests/` | Suite de pruebas backend y frontend mapper. |
| `whatsapp-service/` | Servicio Express/Baileys para WhatsApp. |

Archivos raiz:

| Archivo | Proposito |
| --- | --- |
| `.env` | Variables locales de entorno. No debe versionarse con secretos reales. |
| `.gitignore` | Excluye entornos, caches, builds y archivos generados. |
| `Dockerfile` | Imagen del backend FastAPI. |
| `diagnostico_ordenes.py` | Script auxiliar para diagnostico/manual de ordenes. |
| `Informacion-del-proyecto.txt` | Documento inicial con objetivo, requisitos y ruta de trabajo. |
| `pyproject.toml` | Configuracion de pylint y pytest. |
| `requirements.txt` | Dependencias Python del backend y pruebas. |
| `cov_backend.json` | Reporte JSON de cobertura generado. |
| `cov_run_output.txt` | Salida de una ejecucion de cobertura. |

## Backend en detalle

### `backend/main.py`

Punto de entrada de FastAPI.

- Carga variables de `.env`.
- Ajusta `sys.path` para evitar colisiones con paquetes externos.
- Importa modelos para registrar metadata de SQLAlchemy.
- Crea `app = FastAPI(...)`.
- Configura CORS.
- Expone `/` y `/health`.
- Inicializa esquema de base de datos al arrancar mediante `lifespan`.
- Registra handlers para `UnauthorizedError`, `ForbiddenError`, `NotFoundError` y `ConflictError`.
- Incluye el router principal `api_router`.

### `backend/api/`

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca la carpeta como paquete Python. |
| `router.py` | Compone todos los routers de dominio: auth, products, cart, payments, orders y WhatsApp admin. |

### `backend/auth/`

Modulo de autenticacion, sesiones, contrasenas, tokens y perfil.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `dependencies.py` | Dependencias FastAPI para obtener usuario actual, admin actual y usuario opcional. Extrae token desde header Bearer o cookie `access_token`. |
| `email_service.py` | Envia correo de recuperacion de contrasena usando SMTP. |
| `models.py` | Modelos `RevokedToken` y `PasswordResetToken` para logout y recuperacion de contrasena. |
| `router.py` | Endpoints `/auth`: registro, login, Google, recuperacion, perfil, avatar, shipping y logout. |
| `schemas.py` | Schemas Pydantic para login, registro, token, Google, reset password, mensajes y datos de envio. |
| `services.py` | Reglas de autenticacion: validar credenciales, Google ID token, crear JWT, revocar token, registrar usuario, resetear contrasena y agregar/cambiar contrasena. |

Reglas importantes:

- El registro publico solo permite rol `usuario`.
- Solo un admin puede crear usuarios con rol diferente.
- El logout guarda el `jti` en `revoked_tokens`.
- Las cuentas creadas con Google pueden convertirse en `hybrid` al agregar contrasena.

### `backend/users/`

Modulo de usuario compartido por auth, pedidos y admin.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `constants.py` | Define enum `UserRole` con `usuario` y `administrador`. |
| `models.py` | Modelo SQLAlchemy `User`: email, nombre, rol, password hash, proveedor auth, Google sub, avatar, estado, preferencias y timestamps. |
| `schemas.py` | Schemas `UserCreate`, `UserUpdate` y `UserResponse`. |

### `backend/products/`

Modulo de catalogo e inventario.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `models.py` | Modelo `Product` con marca, referencia unica, nombre, categoria, stock, precio, especificaciones tecnicas, colores, variantes, imagen, estado y timestamps. |
| `schemas.py` | Schemas para crear, actualizar, responder y paginar productos. Define categorias permitidas: `premium`, `gama media`, `economico`. |
| `services.py` | CRUD de productos, validacion de referencia unica, normalizacion de colores y variantes, activacion/desactivacion. |
| `router.py` | Endpoints `/products`; lectura publica y escritura solo para admin. Tambien sube imagenes a Cloudinary. |

Reglas importantes:

- `referencia` debe ser unica.
- `categoria` se limita a valores permitidos.
- Si se envian variantes por color, el stock total se recalcula como suma de variantes.
- No se permiten colores repetidos en variantes.

### `backend/cart/`

Modulo de carrito autenticado e invitado.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `models.py` | Modelos `CartItem` y `CartSettings`. Soporta carrito por `user_id` o `session_id`, con unicidad por producto y color. |
| `schemas.py` | Schemas para agregar item, respuesta de item, totales, impuesto y fusion de carrito. |
| `services.py` | Reglas de carrito: agregar/eliminar/listar items, validar producto activo, validar stock/color, calcular envio, calcular totales, fusionar carrito anonimo y descontar stock por color. |
| `router.py` | Endpoints `/cart`: items, add, remove, total, merge y configuracion de impuesto. Tambien maneja cookie `guest_cart`. |

Reglas importantes:

- Cantidad debe ser mayor que cero.
- No se agrega producto inexistente o inactivo.
- No se puede superar stock general ni stock por color.
- Usuarios autenticados usan tabla `cart_items`.
- Invitados usan cookie httpOnly `guest_cart`.
- Impuesto se guarda en `cart_settings`, con default desde `CART_TAX_PERCENT`.
- Envio puede ser fijo, dinamico o gratis desde cierto subtotal.

### `backend/orders/`

Modulo de ordenes, estados, facturas, reembolsos y WhatsApp.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `models.py` | Modelos `Order`, `OrderItem`, `OrderStatusHistory` y `OrderRefund`. Define estados y tipos de reembolso. |
| `schemas.py` | Schemas de orden, items, historial, reembolsos y requests de estado/cancelacion/reembolso. |
| `router.py` | Endpoints `/orders` para usuarios y administradores: crear, listar, cancelar, cambiar estado, reembolsar, descargar/enviar factura y reportes. |
| `services.py` | Re-exporta funciones de servicios especializados para mantener compatibilidad. |
| `creation_service.py` | Crea orden desde carrito, valida stock/precios, crea items, descuenta inventario y guarda datos de checkout. |
| `status_service.py` | Maquina de estados de ordenes, pago, cancelacion, reembolso, historial y notificaciones WhatsApp. |
| `invoice_service.py` | Genera factura PDF, asegura factura para orden pagada y envia factura por email. |
| `invoice_template.py` | Plantilla ReportLab para construir el PDF de factura. Incluye generador `ReportLabInvoiceGenerator`. |
| `email_service.py` | Envio SMTP de facturas con PDF adjunto. |
| `interfaces.py` | Contrato `InvoiceGenerator` para inyectar generadores de factura. |
| `path_utils.py` | Resuelve rutas de facturas y migra archivos legacy a `generated/invoices`. |
| `whatsapp_router.py` | Endpoints admin para consultar estado, QR, conectar y desconectar el microservicio WhatsApp. |
| `whatsapp_service.py` | Cliente HTTP para enviar notificaciones de estado de pedido al microservicio WhatsApp. |

Estados permitidos:

```text
pending -> paid | cancelled
paid -> processing | cancelled | refunded
processing -> shipped | cancelled | refunded
shipped -> delivered | refunded
delivered -> refunded
cancelled -> final
refunded -> final
```

Reglas importantes:

- No se crea orden si el carrito esta vacio.
- Si el precio del producto cambio respecto al carrito, se bloquea la orden.
- Al crear la orden se descuenta stock.
- Al marcar como pagada se limpia el carrito del usuario.
- La cancelacion de usuario solo aplica en estados `pending` o `paid` dentro de la ventana configurada.
- Para marcar como `shipped` se exige transportadora y numero de guia.
- Las facturas solo se descargan/envian para ordenes con pago exitoso o estados posteriores.

### `backend/payments/`

Modulo de pasarelas de pago.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `interfaces.py` | Interface `PaymentProviderClient` para clientes de pasarela inyectables en tests. |
| `paypal_client.py` | Cliente HTTP real para PayPal: token, crear orden y capturar orden. |
| `epayco_client.py` | Cliente HTTP real para ePayco: token y creacion de sesion. |
| `schemas.py` | Schemas de checkout y respuestas PayPal/ePayco. |
| `services.py` | Orquesta pagos: calcula total real del carrito, crea/reusa orden pendiente, guarda cliente, construye payloads y normaliza respuestas. |
| `router.py` | Endpoints `/payments` para crear/capturar pagos y recibir webhooks/confirmaciones. |

Reglas importantes:

- El total se calcula desde el carrito real del usuario, no desde el frontend.
- PayPal puede convertir COP a otra moneda usando `PAYPAL_COP_TO_USD_RATE`.
- ePayco usa COP.
- Webhooks actualizan la orden a pagada o cancelada.
- PayPal webhook verifica firma con API de PayPal antes de marcar pago.

### `backend/core/`

Configuracion transversal de la aplicacion FastAPI.

| Archivo | Que hace |
| --- | --- |
| `__init__.py` | Marca el modulo como paquete. |
| `settings.py` | Centraliza CORS, origenes permitidos y flag `AUTO_APPLY_SCHEMA_CHANGES`. |
| `cors.py` | Helpers y middleware para aplicar headers CORS incluso en preflight. |
| `bootstrap.py` | Inicializa metadata y aplica parches de compatibilidad al esquema existente. |

### `backend/cloudinary_utils.py`

Utilidad compartida para subir imagenes a Cloudinary.

- Configura Cloudinary desde variables de entorno.
- Valida tamano maximo de imagen.
- Valida tipo de archivo.
- Sube imagenes de producto o avatar.
- Retorna URL, public ID y formato.

### `backend/flask_migrate_app.py`

Aplicacion auxiliar Flask para usar Flask-Migrate/Alembic con los modelos SQLAlchemy del proyecto.

- Carga `.env`.
- Configura URI de base de datos.
- Importa modelos para registrar metadata.
- Expone `app` y `db` para comandos de migracion.

## `database/` en detalle

| Archivo | Que hace |
| --- | --- |
| `database/__init__.py` | Marca la carpeta como paquete. |
| `database/core/__init__.py` | Marca el submodulo como paquete. |
| `database/core/database.py` | Define `Base`, crea engine y sesiones, lee `DATABASE_URL`, expone `get_db` y contiene parches de esquema para usuarios, productos, ordenes y carrito. |
| `database/core/security.py` | Hash/verificacion de contrasenas y creacion/decodificacion de JWT. Exige `APP_JWT_SECRET`. |
| `database/core/errors.py` | Errores de dominio: `AppError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`. |

## Frontend en detalle

### Estructura principal

```text
frontend/
|-- public/
|-- imgs/
|-- src/
|   |-- api/
|   |-- assets/
|   |-- components/
|   |-- context/
|   |-- hooks/
|   |-- utils/
|   |-- App.jsx
|   |-- main.jsx
|   `-- index.css
|-- package.json
|-- vite.config.js
|-- tailwind.config.js
|-- eslint.config.js
`-- vercel.json
```

Archivos y carpetas:

| Ruta | Que hace |
| --- | --- |
| `frontend/index.html` | HTML base donde Vite monta React. |
| `frontend/package.json` | Scripts y dependencias frontend. |
| `frontend/vite.config.js` | Configuracion Vite, proxy/build segun proyecto. |
| `frontend/tailwind.config.js` | Configuracion Tailwind. |
| `frontend/eslint.config.js` | Reglas ESLint. |
| `frontend/vercel.json` | Configuracion de deploy en Vercel. |
| `frontend/public/` | Assets publicos como favicon e iconos. |
| `frontend/imgs/` | Imagenes estaticas adicionales. |
| `frontend/src/main.jsx` | Punto de entrada React. Monta `App`, `BrowserRouter` y `CarritoProvider`. |
| `frontend/src/App.jsx` | Define layout, rutas principales, carga productos y boton flotante de WhatsApp. |
| `frontend/src/index.css` | Estilos globales. |
| `frontend/src/api/axiosClient.js` | Cliente Axios, base URL, cookies y token Bearer desde localStorage. |
| `frontend/src/api/services/` | Servicios HTTP para auth, carrito, ordenes, pagos, productos, reportes y WhatsApp. |
| `frontend/src/api/mappers/productMapper.js` | Mapea productos del backend al modelo visual de tarjetas. |
| `frontend/src/context/CarritoContext.jsx` | Estado global de carrito y usuario actual. |
| `frontend/src/context/ThemeContext.jsx` | Estado global de tema. |
| `frontend/src/hooks/` | Hooks reutilizables para autenticacion, Google y acciones asincronas. |
| `frontend/src/utils/formatters.js` | Helpers de formato. |

Rutas React principales:

| Ruta | Componente | Uso |
| --- | --- | --- |
| `/` | Home en `App.jsx` | Hero, features, categorias y productos. |
| `/catalogo` | `Catalogo` | Listado general de productos. |
| `/catalogo/:categoriaUrl` | `Catalogo` | Listado filtrado por categoria URL. |
| `/dashboard` | `AdminDashboard` | Panel administrador. |
| `/login` | `Login` | Login, registro y recuperacion. |
| `/perfil` | `Perfil` | Perfil de usuario. |
| `/carrito` | `Carrito` | Carrito de compras. |
| `/checkout-steps` | `CheckoutSteps` | Flujo de checkout. |
| `/checkout/epayco` | `EpaycoCheckoutWindow` | Checkout ePayco. |
| `/success` | `Success` | Confirmacion de pago exitoso. |
| `/cancel` | `Cancel` | Pago cancelado. |

Componentes principales:

| Carpeta/archivo | Uso |
| --- | --- |
| `components/AdminDashboard.jsx` | Contenedor del panel administrativo. |
| `components/Catalogo.jsx` | Catalogo y filtros. |
| `components/ProductCard.jsx` | Tarjeta de producto. |
| `components/ProductDetailModal.jsx` | Detalle de producto. |
| `components/Carrito.jsx` | Vista del carrito. |
| `components/Checkout.jsx` y `CheckoutSteps.jsx` | Flujo de compra. |
| `components/Login.jsx` | Pantalla de autenticacion. |
| `components/Perfil.jsx` | Perfil y datos del usuario. |
| `components/Navbar.jsx`, `Footer.jsx`, `Sidebar.jsx` | Navegacion y layout. |
| `components/admin/ProductsPanel.jsx` | CRUD visual de productos. |
| `components/admin/OrdersPanel.jsx` | Gestion de ordenes. |
| `components/admin/SalesReportPanel.jsx` | Reportes de ventas. |
| `components/admin/CartSettingsPanel.jsx` | Configuracion de impuestos. |
| `components/admin/WhatsAppPanel.jsx` | Estado, QR y conexion WhatsApp. |
| `components/auth/` | Formularios y piezas de autenticacion. |
| `components/ui/` | Componentes UI reutilizables. |

## Base de datos y migraciones

### Entidades principales

| Entidad | Tabla | Responsabilidad |
| --- | --- | --- |
| `User` | `users` | Usuarios, roles, credenciales, Google, avatar y preferencias. |
| `RevokedToken` | `revoked_tokens` | Tokens JWT revocados por logout. |
| `PasswordResetToken` | `password_reset_tokens` | Tokens temporales de recuperacion. |
| `Product` | `products` | Catalogo, inventario, precios, especificaciones y variantes. |
| `CartItem` | `cart_items` | Items de carrito autenticado o sesion invitada. |
| `CartSettings` | `cart_settings` | Configuracion global de impuesto. |
| `Order` | `orders` | Compra, estado, totales, datos cliente, pago, envio y factura. |
| `OrderItem` | `order_items` | Productos incluidos en una orden. |
| `OrderStatusHistory` | `order_status_history` | Historial de transiciones de estado. |
| `OrderRefund` | `order_refunds` | Reembolsos parciales o totales. |

### Migraciones

| Archivo | Proposito |
| --- | --- |
| `migrations/alembic.ini` | Configuracion de Alembic. |
| `migrations/env.py` | Entorno de migraciones y metadata. |
| `migrations/script.py.mako` | Plantilla para nuevas migraciones. |
| `migrations/README` | Nota base de Alembic/Flask. |
| `migrations/versions/c1844c8af97e_create_cart_items_table.py` | Crea tabla de items de carrito. |
| `migrations/versions/20240424_add_discount_percent_to_product.py` | Agrega descuento a producto. |
| `migrations/versions/20260430_expand_order_cart_product_scope.py` | Expande alcance de ordenes/carrito/productos. |
| `migrations/versions/20260430_order_state_machine_and_refunds.py` | Agrega maquina de estados e informacion de reembolsos. |
| `migrations/versions/20260503_cart_color_selected.py` | Agrega color seleccionado en carrito. |
| `migrations/versions/20260503_product_color_variants.py` | Agrega variantes por color a productos. |

## Microservicio de WhatsApp

Carpeta: `whatsapp-service/`

| Archivo | Que hace |
| --- | --- |
| `package.json` | Dependencias y scripts Node. |
| `package-lock.json` | Lockfile de dependencias. |
| `server.js` | Servidor Express y conexion Baileys. Maneja QR, estado, reconexion, envio de mensajes y plantillas por estado de pedido. |
| `vercel.json` | Configuracion de despliegue si aplica. |
| `render.yaml` | Configuracion para Render. |
| `DEPLOYMENT.md` | Guia de despliegue del microservicio. |

Endpoints del microservicio:

| Metodo | Ruta | Uso |
| --- | --- | --- |
| `GET` | `/api/whatsapp/status` | Estado de conexion y diagnostico de sesion. |
| `GET` | `/api/whatsapp/qr` | Imagen PNG del QR. |
| `POST` | `/api/whatsapp/connect` | Inicia conexion. |
| `POST` | `/api/whatsapp/disconnect` | Cierra conexion y limpia sesion. |
| `POST` | `/api/whatsapp/send-order-status` | Envia mensaje de estado de pedido. |

## Pruebas

La suite esta organizada asi:

| Carpeta | Que valida |
| --- | --- |
| `tests/auth/` | Seguridad, hash, JWT y servicios auth. |
| `tests/cart/` | Servicios de carrito. |
| `tests/products/` | Servicios de productos. |
| `tests/unit/` | Pruebas unitarias transversales: pagos, ordenes, CORS, settings, dependencias, integraciones externas. |
| `tests/integration/` | Endpoints reales de FastAPI con base aislada. |
| `tests/e2e/` | Flujos backend completos de checkout y admin. |
| `tests/maintainability/` | Contratos OpenAPI y rutas duplicadas. |
| `tests/performance/` | Hot paths de backend. |
| `tests/conftest.py` | Fixtures compartidas, cliente FastAPI y base de pruebas. |
| `tests/test_register.py` | Smoke/manual de registro contra API local. |
| `tests/test_smtp.py` | Prueba opcional de conexion SMTP. |

Comandos:

```powershell
python -m pytest -q
python -m pytest --cov=backend --cov=database --cov-report=term-missing
```

Frontend:

```powershell
cd frontend
npm test
npm run lint
npm run build
```

## Documentacion adicional

| Archivo | Contenido |
| --- | --- |
| `docs/dominio-modelo-negocio.md` | Dominio, reglas de negocio y diagramas ER. |
| `docs/testing.md` | Guia/documentacion de pruebas. |
| `info_project/estructura_movil_dev.md` | Alcance, MVP, arquitectura y estructura. |
| `info_project/Fases-del-proyecto.md` | Fases o sprints del proyecto. |
| `info_project/GUIA_REGISTRO.md` | Guia relacionada con registro/autenticacion. |
| `info_project/evaluacion_movil-dev.md` | Evaluacion del proyecto. |
| `info_project/dominio-modelo-negocio.md` | Copia o version del dominio de negocio. |

## Flujo de compra resumido

1. El usuario navega el catalogo.
2. Agrega productos al carrito.
3. El backend valida producto, estado, color y stock.
4. El carrito calcula subtotal, impuesto, envio y total.
5. El usuario inicia checkout.
6. El backend crea o reutiliza una orden pendiente.
7. PayPal o ePayco crea la sesion de pago.
8. La pasarela confirma el pago por captura o webhook.
9. La orden cambia a `paid`.
10. Se limpia el carrito, se genera factura PDF y se intenta enviar por correo.
11. Los cambios de estado posteriores pueden notificar por WhatsApp.

## Notas de mantenimiento

- Mantener las reglas de negocio en `services.py` o servicios especializados, no en componentes frontend.
- No confiar en totales enviados por el cliente: el backend recalcula desde base de datos.
- Las rutas de escritura administrativa deben usar `get_current_admin`.
- Las llamadas externas deben estar detras de clientes inyectables para facilitar pruebas.
- Los archivos generados como cobertura, facturas y caches no deberian mezclarse con codigo fuente.
