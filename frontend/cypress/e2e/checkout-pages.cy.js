/**
 * Rutas auxiliares (cancelación / éxito) para ejercitar layout y router.
 *
 * Nota: /carrito exige sesión; si no hay token, la app redirige a /login.
 * Por eso el caso "Volver al carrito" usa el mismo patrón que catalog.cy.js
 * (token + mocks de /api/auth/me y carrito).
 */
describe("Rutas de pago", () => {
  beforeEach(() => {
    cy.intercept({ method: "GET", pathname: /\/api\/products$/ }, { fixture: "products.json" })
  })

  const setupAuthedSession = () => {
    cy.intercept({ method: "GET", pathname: /\/api\/auth\/me$/ }, { fixture: "user.json" })
    cy.intercept({ method: "GET", pathname: /\/api\/cart\/items$/ }, { body: [] })
    cy.intercept({ method: "GET", pathname: /\/api\/cart\/total$/ }, {
      body: { subtotal: 0, tax_percent: 0, tax_amount: 0, shipping_fee: 0, total: 0 },
    })
  }

  const visitAuthed = (path) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", "test-token-cypress")
      },
    })
  }

  it("muestra pantalla de pago cancelado y puede ir al carrito (usuario logueado)", () => {
    setupAuthedSession()
    visitAuthed("/cancel")
    cy.contains("Pago cancelado").should("be.visible")
    cy.contains("button", "Volver al carrito").click()
    cy.location("pathname", { timeout: 10000 }).should("eq", "/carrito")
    cy.contains("Tu carrito está vacío", { timeout: 15000 }).should("be.visible")
  })

  it("sin token de PayPal muestra error controlado", () => {
    cy.intercept({ method: "GET", pathname: /\/api\/auth\/me$/ }, { statusCode: 401, body: {} })
    cy.visit("/success")
    cy.contains("Token no encontrado", { timeout: 15000 }).should("be.visible")
  })
})
