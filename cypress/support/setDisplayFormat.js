export function setDisplayFormat(displayFormat) {
  cy.get(".select_display_format")
    .eq(0)
    .click()
    .get(".mat-option-text")
    .eq(displayFormat)
    .click();
}
