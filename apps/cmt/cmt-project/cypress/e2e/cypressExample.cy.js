it('Create Course', function() {
   cy.visit('http://localhost:3000/cmt')
   
   cy.get('#root input[autocomplete="username"]').click();
   cy.get('#root input[autocomplete="username"]').type('prof1@rit.edu');
   cy.get('#root input[autocomplete="current-password"]').type('test123');
   cy.get('#root button.dev-login-submit').click();
   cy.get('#root li:nth-child(1) span').click();
   cy.get('#root a[href="/cmt/coursebuilder"]').click();
   cy.get('#root div.list-header button.btn').click();
   cy.get('#root input[placeholder="e.g., SWEN101"]').click();
   cy.get('#root input[placeholder="e.g., SWEN101"]').type('SWEN101');
   cy.get('#root input[placeholder="e.g., Freshman Seminar"]').type('Freshman Seminar');
   cy.get('#root input[placeholder="e.g., Fall 2025"]').type('Fall 2025');
   cy.get('#root input[placeholder="e.g., 30"]').type('30');
   cy.get('#root select.form-select').select('orange');
   cy.get('#root button.btn-primary').click();
   cy.get('#root button.btn-primary').click();
   cy.get('#root button.btn-success').click();
   cy.get('#root svg.lucide-trash2').click();
   // Solution 1, increase timeout. Doesn't work
   // cy.get('#root span.site-nav__profile-name').click();
   // cy.get('#root button.site-nav__logout-button', { timeout: 10000 }).click();
   
   // Solution 2, increase timeout, but for a better reason
   // cy.get('[role="alert"]', { timeout: 10000 }).should('not.exist');
   // cy.get('#root span.site-nav__profile-name').click();
   // cy.get('#root button.site-nav__logout-button').click();
   
   // Solution 3, use the app quickly!
   cy.get('[role="alert"]')
     .should('be.visible')
     .find('button')
     .click()
   cy.get('#root span.site-nav__profile-name').click();
   cy.get('#root button.site-nav__logout-button').click();
});