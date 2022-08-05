const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    info: " ng serve  to start the server berfore ",
    baseUrl: "http://localhost:4200/",
  },
});
