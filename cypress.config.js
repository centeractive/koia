const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: "d7bpee",
  reporter: "junit",
  reporterOptions: {
    reporterEnabled: "cypress-mochawesome-reporter, mocha-junit-reporter",
    mochaJunitReporterReporterOptions: {
      mochaFile: "cypress/reports/junit/results-[hash].xml",
    },
    cypressMochawesomeReporterReporterOptions: {
      charts: true,
      reportPageTitle: "Koia.io date test",
    },
  },
  video: false,
  e2e: {
    setupNodeEvents(on, config) {
      require("cypress-mochawesome-reporter/plugin")(on);
    },
    baseUrl: "http://localhost:4200",
  },
});
