# Fases del Proyecto

## Fase 1: Diseño

- **Dominio:** La app es un ecommerce para Movil-Dev, donde los usuarios pueden comprar celulares y accesorios.
- **Requisitos:**
  - Ya definidos: gestión de usuarios (registro, login, recuperación), catálogo de productos, carrito, pagos, pedidos, panel admin. (Hecho)
  - Pendiente: Detallar reglas de negocio para promociones y devoluciones. (Por hacer)
- **Modelo de datos:**
  - Ya diseñado: usuarios, productos, pedidos, carrito, pagos. (Hecho)
  - Pendiente: Ajustar modelo para cupones y reportes avanzados. (Por hacer)

## Fase 2: Backend

- **API:**
  - Ya implementado: endpoints de usuarios (registro, login, perfil), productos (CRUD), carrito (agregar/eliminar), pedidos (seguimiento), pagos (integración básica). (Hecho)
  - Pendiente: endpoints para reportes, devoluciones y notificaciones avanzadas. (Por hacer)
- **Base de datos:**
  - Ya creada: estructura principal en PostgreSQL, migraciones con Flask-Migrate. (Hecho)
  - Pendiente: optimizar índices y agregar tablas para promociones. (Por hacer)

## Fase 3: Frontend

- **Interfaces:**
  - Ya implementado: pantallas de login, registro, catálogo, carrito, perfil, dashboard admin básico. (Hecho)
  - Pendiente: mejorar diseño responsive y agregar panel de devoluciones. (Por hacer)
- **Integración:**
  - Ya hecho: consumo de API para mostrar productos, gestionar carrito y pedidos. (Hecho)
  - Pendiente: integración de notificaciones en tiempo real y validación avanzada de formularios. (Por hacer)

## Fase 4: Validación y Pruebas

- **Validación funcional:**
  - Ya realizado: pruebas unitarias de autenticación, pruebas básicas de carrito y productos. (Hecho)
  - Pendiente: pruebas de integración completas y validación de pagos/devoluciones. (Por hacer)
- **Corrección de errores:**
  - Ya hecho: corrección de bugs en login, registro y carrito. (Hecho)
  - Pendiente: pruebas de carga, seguridad y validación de campos obligatorios en todos los formularios. (Por hacer)

## Fase 5: Despliegue y Producción

- **Producción:**
  - Ya hecho: despliegue inicial en Render y Vercel para pruebas internas. (Hecho)
  - Pendiente: despliegue final para usuarios reales y monitoreo en producción. (Por hacer)
- **Despliegue:** - Ya hecho: backend subido a Render, frontend publicado en Vercel. (Hecho) - Pendiente: automatizar backups y configurar alertas de monitoreo. (Por hacer)
  Cliente (Frontend) → API Gateway (Backend) → Base de Datos → Servicios externos (pagos, notificaciones, envío)
  CI/CD Pipeline automatiza pruebas y despliegues.

Movil-Dev/
├── backend/
│ ├── auth/
│ │ ├── dependencies.py
│ │ ├── email_service.py
│ │ ├── models.py
│ │ ├── router.py
│ │ ├── schemas.py
│ │ └── services.py
│ ├── cart/
│ │ ├── models.py
│ │ ├── router.py
│ │ ├── schemas.py
│ │ └── services.py
│ ├── orders/
│ │ ├── models.py
│ │ ├── router.py
│ │ ├── schemas.py
│ │ └── services.py
│ ├── payments/
│ │ ├── router.py
│ │ ├── schemas.py
│ │ └── services.py
│ ├── products/
│ │ ├── models.py
│ │ ├── router.py
│ │ ├── schemas.py
│ │ └── services.py
│ ├── users/
│ │ ├── constants.py
│ │ ├── models.py
│ │ └── schemas.py
│ ├── cloudinary_utils.py
│ ├── flask_migrate_app.py
│ └── main.py
├── database/
│ └── core/
│ ├── database.py
│ ├── errors.py
│ └── security.py
├── frontend/
│ ├── public/
│ │ ├── favicon.png
│ │ └── icons.svg
│ ├── src/
│ │ ├── api/
│ │ │ ├── mappers/
│ │ │ │ ├── productMapper.js
│ │ │ │ └── productMapper.test.js
│ │ │ ├── services/
│ │ │ │ ├── authService.js
│ │ │ │ ├── cartService.js
│ │ │ │ ├── ordersService.js
│ │ │ │ ├── paymentService.js
│ │ │ │ └── productsService.js
│ │ │ └── axiosClient.js
│ │ ├── assets/
│ │ ├── components/
│ │ ├── context/
│ │ ├── App.jsx
│ │ ├── index.css
│ │ └── main.jsx
│ ├── package.json
│ ├── package-lock.json
│ ├── vite.config.js
│ └── vercel.json
├── migrations/
│ ├── versions/
│ │ ├── 20240424_add_discount_percent_to_product.py
│ │ └── c1844c8af97e_create_cart_items_table.py
│ ├── alembic.ini
│ ├── env.py
│ └── script.py.mako
├── tests/
│ ├── auth/
│ ├── cart/
│ ├── e2e/
│ ├── integration/
│ ├── maintainability/
│ ├── products/
│ ├── unit/
│ └── conftest.py
├── docs/
│ ├── dominio-modelo-negocio.md
│ └── testing.md
├── Dockerfile
├── README.md
├── requirements.txt
├── pyproject.toml
└── varios docs/scripts sueltos
