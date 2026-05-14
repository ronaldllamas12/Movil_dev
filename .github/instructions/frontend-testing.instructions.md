---
applyTo: "frontend/src/**,frontend/**/{*.test.*,*.spec.*}"
description: "Use when working on frontend code, frontend tests, or requests for unit/integration/e2e/performance frontend coverage."
---

# Frontend Testing Instructions

## Scope

Apply these rules when editing frontend code, tests, or test tooling.

## Primary Goal

- Preserve and improve reliability of the ecommerce frontend flows.
- For explicit testing requests, target frontend coverage above 90%.

## Required Validation Flow

1. Add or update unit tests first for local logic (mappers, hooks, formatters, component behavior).
2. Add integration-style frontend tests for component + routing/data boundaries.
3. Review existing e2e tests and add missing critical flows.
4. Run lint, build, tests, and coverage before finishing.

## E2E Policy

- Prefer Cypress for frontend e2e browser flows when requested.
- Keep backend e2e under [tests/e2e](../../tests/e2e) untouched unless the task explicitly includes backend e2e changes.

## Critical Flows to Cover

- Catalog listing and product detail behavior.
- Cart add/remove and totals rendering.
- Checkout happy path and cancel path views.
- Auth flows (login/register) and session-dependent UI behavior.
- Admin dashboard essentials (products and orders surfaces).

## Tooling Notes

- Current frontend test script in [frontend/package.json](../../frontend/package.json) uses node test runner.
- If component/e2e coverage is requested, add or adjust frontend test tooling and include commands in your report.

## Output Contract

Always report:

1. Test files added or updated.
2. Commands run.
3. Test results summary.
4. Coverage result and remaining gap, if any.

## References

- [AGENTS.md](../../AGENTS.md)
- [docs/testing.md](../../docs/testing.md)
- [README.md](../../README.md)
