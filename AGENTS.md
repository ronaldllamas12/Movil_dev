# AGENTS

## Objetivo de este repositorio
Movil-Dev es un ecommerce con backend FastAPI y frontend React/Vite.

Como agente, prioriza seguridad funcional del flujo de compra y estabilidad de contratos API.

## Inicio rapido para agentes
1. Lee el contexto general en [README.md](README.md).
2. Para estrategia de pruebas, usa [docs/testing.md](docs/testing.md).
3. Si tocas reglas de negocio de backend, revisa las suites en [tests](tests).
4. Si tocas frontend, valida mapper, componentes y flujos de checkout/admin.

## Comandos canónicos
Backend:
- `python -m pytest -q`
- `python -m pytest --cov=backend --cov=database --cov-report=term-missing`

Frontend:
- `cd frontend && npm test`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

## Instrucciones de testing para tareas de frontend
Cuando el usuario pida crear o ampliar pruebas frontend, sigue este orden:
1. Inventario de cobertura actual y gaps por capa (unitaria, integración, E2E, rendimiento).
2. Generación de pruebas empezando por lógica de negocio y mapeos, luego UI crítica.
3. Revisión de E2E existentes y ampliación de flujos faltantes de compra y panel admin.
4. Ejecución de pruebas, corrección de fallos y reporte de cobertura final.

### Criterio de cobertura
- Meta por defecto para frontend en solicitudes de testing: mayor a 90%.
- Si la infraestructura actual no permite medir cobertura frontend, agrega/ajusta tooling de pruebas antes de finalizar (por ejemplo, runner con coverage) y documenta el comando de ejecución.

### Política E2E
- Puedes usar Cypress cuando se pidan E2E frontend o validación de flujos en navegador.
- No reemplaces E2E backend de [tests/e2e](tests/e2e) sin motivo; complétalos con E2E de frontend cuando aplique.

### Flujos críticos mínimos a cubrir
- Catálogo y detalle de producto.
- Carrito (agregar, remover, recalcular total).
- Checkout por pasos y resultados success/cancel.
- Login/registro y persistencia de sesión.
- Rutas y acciones principales de admin (productos y órdenes).

## Convenciones del repositorio
- No duplicar documentación extensa: enlazar [docs/testing.md](docs/testing.md) y [README.md](README.md).
- Mantener pruebas aisladas de servicios externos con mocks/fakes.
- En cambios de API, validar que frontend mappers/servicios sigan alineados.

## Pitfalls conocidos
- El script actual `npm test` del frontend usa `node --test src`; esto no cubre por sí solo pruebas de componentes React ni cobertura detallada de frontend.
- Si se requiere cobertura >90% en frontend, normalmente será necesario usar tooling específico de test para React + reporter de cobertura.

## Resultado esperado de cualquier tarea de testing
Entrega siempre:
1. Lista de archivos de prueba agregados/actualizados.
2. Comandos ejecutados.
3. Resultado de tests.
4. Cobertura obtenida y brecha pendiente (si existe), con plan concreto para cerrarla.

## Customizaciones disponibles
- Instruccion de alcance frontend: [.github/instructions/frontend-testing.instructions.md](.github/instructions/frontend-testing.instructions.md)
- Agente especializado QA frontend/E2E: [.github/agents/qa-frontend-e2e.agent.md](.github/agents/qa-frontend-e2e.agent.md)
- Prompt operativo para generar suite completa: [.github/prompts/generar-suite-frontend.prompt.md](.github/prompts/generar-suite-frontend.prompt.md)
