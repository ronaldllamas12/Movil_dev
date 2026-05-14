/**
 * Catálogo y carrito con API mockeada y sesión simulada (token en localStorage antes del load).
 */
describe("Catálogo y carrito", () => {
  beforeEach(() => {
    cy.intercept({ method: "GET", pathname: /\/api\/products$/ }, { fixture: "products.json" })
    cy.intercept({ method: "GET", pathname: /\/api\/auth\/me$/ }, { fixture: "user.json" })
    cy.intercept({ method: "GET", pathname: /\/api\/cart\/items$/ }, { body: [] })
    cy.intercept({ method: "GET", pathname: /\/api\/cart\/total$/ }, {
      body: { subtotal: 0, tax_percent: 0, tax_amount: 0, shipping_fee: 0, total: 0 },
    })
  })

  const visitAuthed = (path) => {
    cy.visit(path, {
      onBeforeLoad(win) {
        win.localStorage.setItem("access_token", "test-token-cypress")
      },
    })
  }

  it("carga catálogo y muestra título", () => {
    visitAuthed("/catalogo")
    cy.contains("Catálogo de Celulares", { timeout: 15000 }).should("be.visible")
  })

  it("muestra carrito vacío para usuario autenticado", () => {
    visitAuthed("/carrito")
    cy.contains("Tu carrito está vacío", { timeout: 15000 }).should("be.visible")
  })
})
