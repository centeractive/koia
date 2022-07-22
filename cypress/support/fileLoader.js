export function fileLoader(fileName) {
  cy.fixture(fileName).then((fileContent) => {
    cy.get("#select_file_button")
      .attachFile(
        { filePath: fileName },
        { fileContent, mimeType: "text/csv" },
        { subjectType: "input" }
      )
      .trigger("submit");
  });
  cy.get("#select_file_button").click();
  cy.get("#fileInput").attachFile(fileName);
  cy.get("#but_detect_columns").click();
}
