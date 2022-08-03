export function navigateToStartPage() {
  //cy.visit("http://koia.io/intro/index.html");
  cy.visit("http://localhost:8000/intro/index.html");
  cy.get(".promo > .container > .intro").should(
    "have.text",
    "Create graphs and pivot tables online from CSV, Excel or JSON data."
  );
  cy.get(".promo > .container > :nth-child(3) > .btn").click();

  cy.get("#start_button").click();
}
