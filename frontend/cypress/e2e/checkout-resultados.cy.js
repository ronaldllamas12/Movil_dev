describe('Checkout resultados', () => {
  it('renderiza pantalla success', () => {
    cy.visit('/success');
    cy.location('pathname').should('eq', '/success');
    cy.get('body').should('be.visible');
  });

  it('renderiza pantalla cancel', () => {
    cy.visit('/cancel');
    cy.location('pathname').should('eq', '/cancel');
    cy.get('body').should('be.visible');
  });
});
