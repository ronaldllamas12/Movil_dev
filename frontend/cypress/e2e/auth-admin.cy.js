describe('Auth y dashboard admin', () => {
  it('abre login', () => {
    cy.visit('/login');
    cy.location('pathname').should('eq', '/login');
    cy.get('body').should('be.visible');
  });

  it('abre dashboard', () => {
    cy.visit('/dashboard');
    cy.location('pathname').should('eq', '/dashboard');
    cy.get('body').should('be.visible');
  });
});
