# Frontend — Movil Dev

Tienda React (Vite) con pruebas automáticas en **Vitest** (unitarias / componente) y **Cypress** (E2E en navegador).

---

## Cómo ejecutar las pruebas

| Comando | Qué hace |
|---------|----------|
| `npm run test` | Ejecuta **todas** las pruebas Vitest una vez (CI). |
| `npm run test:watch` | Vitest en modo watch (se re-ejecutan al guardar). |
| `npm run test:coverage` | Vitest + informe de **cobertura** (ver sección Cobertura). |
| `npm run dev` | Servidor de desarrollo en `http://localhost:5173`. |
| `npm run cy:open` | Abre la UI de Cypress (hay que tener **Vite corriendo** antes). |
| `npm run cy:run` | Cypress en modo headless (misma condición: **Vite en 5173**). |
| `npm run dev:coverage` | Vite con **instrumentación Istanbul** (para cobertura E2E). |
| `npm run cy:coverage` | Levanta `dev:coverage`, espera al puerto 5173 y lanza `cy:run`. |

**Cypress:** el `baseUrl` es `http://127.0.0.1:5173`. Si no arranca Vite, Cypress fallará al verificar el servidor.

---

## Stack de testing (Vitest)

- **Vitest** — mismo entorno que Vite (ESM, JSX, alias `@`).
- **jsdom** — DOM simulado.
- **@testing-library/react** — renderiza componentes y comprueba lo que vería el usuario (roles, texto, clicks).
- **@testing-library/user-event** — interacciones más realistas (teclado/ratón).
- **`src/test/setupTests.js`** — matchers extra (`toBeInTheDocument`, etc.) y polyfill de `window.matchMedia` (necesario para `ThemeContext` / `App`).
- **`src/test/testUtils.jsx`** — `renderWithProviders()` envuelve con `CarritoProvider`, `MemoryRouter` y `ThemeProvider` para pruebas que lo necesitan.

Los archivos de prueba llevan sufijo **`.test.js`** o **`.test.jsx`** junto al código (o en la misma carpeta).

---

## Qué prueba cada archivo (Vitest)

### API y datos

| Archivo | Qué valida |
|---------|------------|
| `src/api/axiosClient.test.js` | `getApiErrorMessage`: orden de prioridad entre `detail`, `message`, `Error.message` y mensaje por defecto. |
| `src/api/mappers/productMapper.test.js` | Mapeo API ↔ UI: precios formateados, colores (incl. JSON en string), listas seguras, `mapProductToApi`, `toProductCardModel`, JSON inválido en colores/variantes. |
| `src/api/services/authService.test.js` | Login, registro, Google, perfil, contraseña, logout, forgot/reset, envío y **upload de avatar**; comprobación de rutas y `localStorage` del token. |
| `src/api/services/cartService.test.js` | Endpoints del carrito: items, total, impuestos, add/remove/merge y cuerpos esperados. |
| `src/api/services/productsService.test.js` | `getProducts` con distintas formas de respuesta; CRUD; estado del producto; **subida de imagen**. |
| `src/api/services/paymentService.test.js` | PayPal create/capture y sesión ePayco (timeouts y parámetros). |
| `src/api/services/ordersService.test.js` | Pedidos admin, factura PDF (petición + click en enlace), reembolsos, ePayco mark-paid. |
| `src/api/services/whatsappService.test.js` | Estado, QR, connect/disconnect de WhatsApp admin. |
| `src/api/services/salesReportService.test.js` | GET del reporte de ventas. |

### Utilidades

| Archivo | Qué valida |
|---------|------------|
| `src/utils/formatters.test.js` | `formatCurrency` (locale COP y valores vacíos). |

### Hooks

| Archivo | Qué valida |
|---------|------------|
| `src/hooks/useAsyncAction.test.js` | Patrón async: loading, éxito, error + `clearError`; cliente de error mockeado. |
| `src/hooks/useAuthValidation.test.js` | Validación de email/contraseña y flujo de registro sin errores. |
| `src/hooks/useGoogleAuth.test.js` | Con `VITE_GOOGLE_CLIENT_ID` vacío, Google queda deshabilitado (`isGoogleEnabled`). |

### Contexto

| Archivo | Qué valida |
|---------|------------|
| `src/context/ThemeContext.test.jsx` | `ThemeProvider` + `toggleTheme` alterna claro/oscuro. |
| `src/context/CarritoContext.test.jsx` | Modo **invitado**: hidratar sesión, `agregarAlCarrito`, `localStorage` y suma de cantidades por mismo producto/color. |

### Componentes UI y auth

| Archivo | Qué valida |
|---------|------------|
| `src/components/ui/PrimaryButton.test.jsx` | Click, estado `loading` (deshabilitado + spinner), `type="submit"`. |
| `src/components/Alert.test.jsx` | Variantes y lista de mensajes en `Alert`. |
| `src/components/LoadingSpinner.test.jsx` | Texto por defecto “Cargando…”. |
| `src/components/auth/AuthErrorMessage.test.jsx` | String, array y objeto con `.msg`. |
| `src/components/AuthTabs.test.jsx` | Cambio de pestaña login/registro. |
| `src/components/PasswordInput.test.jsx` | Toggle mostrar/ocultar y `onChange`. |
| `src/components/InputWithIcon.test.jsx` | Mensaje de error y borde. |

### Componentes de página / layout

| Archivo | Qué valida |
|---------|------------|
| `src/App.test.jsx` | Rutas con `MemoryRouter` + `CarritoProvider`: `/login` y home “Más vendidos”; `getProducts` mockeado. |
| `src/components/Cancel.test.jsx` | Botones navegan a `/carrito` y `/catalogo` con rutas declaradas. |
| `src/components/MarketingBlocks.test.jsx` | `Features`, `Footer`, `Categories`, `ContactBanner` renderizan secciones/enlaces clave. |
| `src/components/Hero.test.jsx` | Con `products=[]`, aparece el slide por defecto (“Promociones en celulares”). |
| `src/components/Navbar.test.jsx` | Marca “Movil Dev” y enlaces de navegación con proveedores. |
| `src/components/ProductCard.test.jsx` | Tarjeta + modal de detalle; `getProductById` mockeado. |
| `src/components/Sidebar.test.jsx` | Admin: clic en módulo llama a `onSelect`. |
| `src/components/EpaycoCheckoutWindow.test.jsx` | Sin `session_id` en la URL muestra el error configurado. |
| `src/components/AdminDashboard.test.jsx` | Con `useCarrito` y servicios mockeados, panel admin visible para rol administrador. |
| `src/components/admin/productFormConfig.test.js` | Constantes de formulario (`CATEGORY_OPTIONS`, `BASE_CREATE_FORM`). |

---

## Pruebas E2E (Cypress)

Archivos en `cypress/e2e/`. Usan **`cy.intercept`** contra rutas `/api/...` para no depender del backend real (deben coincidir host/puerto con tu app).

| Archivo | Qué hace |
|---------|----------|
| `home.cy.js` | Home: espera carga de productos, comprueba “Más vendidos” y enlace al catálogo; navegación a login vía `aria-label`. |
| `catalog.cy.js` | Con **usuario simulado** (token + `user.json` + mocks de carrito): catálogo y carrito vacío. |
| `checkout-pages.cy.js` | **Cancel:** pantalla de pago cancelado y “Volver al carrito” con sesión mockeada (sin login, la app manda a `/login`). **Success:** PayPal sin token muestra “Token no encontrado”. |

**Fixtures** (`cypress/fixtures/`): `products.json`, `user.json` — respuestas estables para los intercepts.

**Cobertura en Cypress:** el aviso de “instrument your application” aparece si corres Cypress contra `npm run dev` normal. Para recoger cobertura Istanbul usa `npm run cy:coverage` o `npm run dev:coverage` + Cypress.

---

## Cobertura (Vitest)

`npm run test:coverage` aplica **umbrales** sobre un conjunto acotado de archivos (servicios, mappers, utils, hooks clave, `ThemeContext`, UI y piezas de auth pequeñas). Las pantallas muy grandes (admin completo, checkout largo, etc.) se complementan con **Cypress** y pruebas puntuales; el detalle del `include`/`thresholds` está comentado en `vite.config.js`.

Los informes HTML suelen generarse en `coverage/vitest/`.

---

## Desarrollo local rápido

1. PostgreSQL accesible según tu `.env` (`DATABASE_URL`).
2. Backend en el puerto que use el proxy de Vite (por defecto **8000**).
3. `npm run dev` en esta carpeta `frontend/`.

Si el backend no está levantado, en consola verás errores de **proxy** al llamar `/api/...`.
