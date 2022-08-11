/// <reference types="cypress" />
// Welcome to Koia!
//

describe("first example", () => {
  beforeEach(() => {
    // Cypress starts Koia.io for each test

    cy.visit("https://www.koia.io/intro/index.html");
    cy.get(".promo > .container > .intro").should(
      "have.text",
      "Create graphs and pivot tables online from CSV, Excel or JSON data."
    );
    cy.get(".promo > .container > :nth-child(3) > .btn").click();
  });

  it("check CouchDb-Settings", () => {
    //cy.contains('button', ' IndexedDB ').click()
    cy.contains("button", " CouchDB ").click();

    //cy.get('#protocol').should('have.value', 'HTTP')
    cy.get("#host").should("have.value", "localhost");
    cy.get("#port").should("have.value", "5984");
    cy.get("#user").should("have.value", "admin");
    cy.get("#password").should("have.value", "admin");
    cy.contains("button", "Cancel").click();
  });
});
