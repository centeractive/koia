export function workaround() {
  cy.log(" -- workaround --");
  cy.get(".select_data_type") // select Time
    .eq(1)
    .click()
    .get(".mat-option-text")
    .eq(1)
    .click({ force: true });
  cy.get(".select_data_type") // select Text
    .eq(1)
    .click()
    .get(".mat-option-text")
    .eq(0)
    .click({ force: true });
}
