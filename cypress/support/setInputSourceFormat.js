export function setInputSourceFormat(inputSourceFormat) {
  if (
    Object.values(cy.get(".input_source_format").eq(0)).includes(
      inputSourceFormat
    )
  ) {
  } else {
    var flattened = flatval(cy.get(".input_source_format").eq(0));
    cy.log("flat : " + flattened); // ALL VALUES IN FLAT ARRAY
    cy.log("falt : " + flattened.includes("Pizza")); // true

    cy.get(".input_source_format")
      .eq(0)
      .clear()
      .type(inputSourceFormat)
      .click(); //SourceDateFormat
    cy.get(".select_data_type").click;
  }
}
