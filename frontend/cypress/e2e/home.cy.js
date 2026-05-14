/**
 * Flujo principal de la tienda: API simulada para no depender del backend.
 * Interceptamos /api/products y /api/auth/me para respuestas estables.
 */
describe("Home", () => {
  beforeEach(() => {
    cy.intercept({ method: "GET", pathname: /\/api\/products$/ }, {
      fixture: "products.json",
    }).as("products")
    cy.intercept({ method: "GET", pathname: /\/api\/auth\/me$/ }, { statusCode: 401, body: {} }).as(
      "me",
    )
  })

  it("muestra secciones del home y enlaces al catálogo", () => {
    cy.visit("/")
    cy.wait("@products")
    cy.contains("Más Vendidos", { matchCase: false }).should("be.visible")
    cy.contains("a", "Ver todos").first().click()
    cy.location("pathname").should("eq", "/catalogo")
  })

  it("navega a login desde la barra", () => {
    cy.visit("/")
    cy.wait("@products")
    cy.get('a[aria-label="Iniciar sesión"]').first().click()
    cy.location("pathname").should("eq", "/login")
    cy.contains("h2", /iniciar sesión/i).should("be.visible")
  })
})
