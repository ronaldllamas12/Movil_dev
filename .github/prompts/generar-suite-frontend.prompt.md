---
mode: "agent"
description: "Generate or improve complete frontend tests (unit, integration, performance checks, e2e with Cypress), review existing e2e coverage, and drive frontend coverage above 90%."
---

# Generar Suite Frontend

## Objetivo

Actua como experto profesional en testing frontend y completa una suite integral con cobertura mayor a 90%.

## Tareas obligatorias

1. Revisar setup actual de pruebas en frontend y adaptar tooling para medir cobertura real de componentes y rutas.
2. Generar o ampliar pruebas unitarias del frontend.
3. Generar o ampliar pruebas de integracion del frontend.
4. Incluir pruebas de rendimiento ligeras enfocadas en rutas o componentes criticos.
5. Revisar las e2e existentes y agregar casos faltantes usando Cypress cuando aplique.
6. Ejecutar pruebas, corregir fallos y reportar cobertura final.

## Flujos criticos minimos

- Catalogo y detalle.
- Carrito (agregar, remover, recalculo de total).
- Checkout success y cancel.
- Login/registro y estados autenticados.
- Dashboard admin (productos y ordenes).

## Entregable

Entrega una tabla con:

- archivo de prueba
- tipo de prueba (unitaria/integracion/e2e/rendimiento)
- estado
- cobertura impactada

Incluye tambien:

- comandos ejecutados
- resumen de fallos corregidos
- porcentaje final de cobertura frontend
- brechas restantes y plan concreto para cerrar al 100% de la meta solicitada

## Contexto

- [AGENTS.md](../../AGENTS.md)
- [docs/testing.md](../../docs/testing.md)
- [README.md](../../README.md)
