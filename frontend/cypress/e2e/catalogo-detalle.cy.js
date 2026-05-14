describe('Catalogo y navegacion', () => {
  it('abre catalogo y renderiza la pagina', () => {
    cy.visit('/catalogo');
    cy.location('pathname').should('eq', '/catalogo');
    cy.get('body').should('be.visible');
  });

  it('abre ruta por categoria', () => {
    cy.visit('/catalogo/premium');
    cy.location('pathname').should('eq', '/catalogo/premium');
    cy.get('body').should('be.visible');
  });
});
