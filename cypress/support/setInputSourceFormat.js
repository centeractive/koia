export function setInputSourceFormat(inputSourceFormat) {
  cy.get(".input_source_format").eq(0).clear().type(inputSourceFormat).click(); //SourceDateFormat
  cy.get(".select_data_type").click;
}
