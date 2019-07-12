// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      require('karma-jasmine'),
      require('karma-chrome-launcher'),
      require('karma-jasmine-html-reporter'),
      require('karma-coverage-istanbul-reporter'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-spec-reporter')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      // following links are required for PivotTableComponent
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/jquery-ui-dist/jquery-ui.min.js',
      'node_modules/pivottable/dist/pivot.min.js'
    ],
    preprocessors: {

    },
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: config.angularCli && config.angularCli.codeCoverage
      ? ['spec', 'progress', 'coverage-istanbul']
      : ['spec', 'progress', 'kjhtml'],
    specReporter: {
      maxLogLines: 5,             // limit number of lines logged per test
      suppressErrorSummary: true, // do not print error summary
      suppressFailed: false,      // do not print information about failed tests
      suppressPassed: false,      // do not print information about passed tests
      suppressSkipped: true,      // do not print information about skipped tests
      showSpecTiming: false,      // print the time elapsed for each spec
      failFast: false             // test would finish with error when a first fail occurs. 
    },
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    customLaunchers: {
      ChromeDebug: {
        base: 'Chrome',
        flags: [
          '--remote-debugging-port=9222'
        ],
        debug: true
      },
      ChromeHeadless: {
        base: 'Chrome',
        flags: [
          '--headless',
          '--no-sandbox',
          '--disable-gpu',
          '--remote-debugging-port=9222'
        ],
        debug: false
      }
    },
    browsers: ['Chrome'],
    singleRun: false
  });
};
