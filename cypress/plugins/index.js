/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

// promisified fs module
const fs = require("fs-extra");
const path = require("path");

function getConfigurationByFile(file) {
  const pathToConfigFile = path.resolve(
    "cypress/cypress",
    "config",
    `${file}.json`
  );
  if (!fs.existsSync(pathToConfigFile)) {
    console.log("no Config file found at " + pathToConfigFile);
    return {};
  }
  return fs.readJson(pathToConfigFile);
}

// plugins file
module.exports = (on, config) => {
  // accept a configFile value
  const file = config.env.configFile;

  return getConfigurationByFile(file);
};
