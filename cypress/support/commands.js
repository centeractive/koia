// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
Cypress.Commands.add("clearIndexedDB", async () => {
  const databases = await window.indexedDB.databases();

  await Promise.all(
    databases.map(
      ({ name }) =>
        new Promise((resolve, reject) => {
          const request = window.indexedDB.deleteDatabase(name);

          request.addEventListener("success", resolve);
          // Note: we need to also listen to the "blocked" event
          // (and resolve the promise) due to https://stackoverflow.com/a/35141818
          request.addEventListener("blocked", resolve);
          request.addEventListener("error", reject);
        })
    )
  );
});

Cypress.Commands.add("checkCellData", (expectedtext) => {
  var userDetails = [];
  cy.get("#div_preview_table tr:nth-child(1) td:nth-child(1)")
    .each(($el, index, $list) => {
      userDetails[index] = $el.text();
    })
    .then(() => {
      var i;
      for (i = 0; i < userDetails.length; i++) {
        cy.log(userDetails[i]);
        expect(userDetails[i]).equal(expectedtext);
      }
    });
});

//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
import "cypress-file-upload";
