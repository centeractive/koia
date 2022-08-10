const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "d7bpee",
  reporter: "mochawesome",
  reporterOptions: {
    configFile: "./reporter-config.json",
  },

  e2e: {
    baseUrl: "http://localhost:4200",
    defaultCommandTimeout: 10000,
  },
});
