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
      require('karma-coverage'),
      require('@angular-devkit/build-angular/plugins/karma'),
      require('karma-spec-reporter')
    ],
    client: {
      clearContext: false // leave Jasmine Spec Runner output visible in browser
    },
    files: [
      { pattern: 'src/assets/*.gif', included: false, watched: false, served: true },
      { pattern: 'src/assets/*.ico', included: false, watched: false, served: true },
      { pattern: 'src/assets/*.png', included: false, watched: false, served: true },
      { pattern: 'src/assets/mat-icons/*.png', included: false, watched: false, served: true },
      { pattern: 'src/assets/svg-icons/*.svg', included: false, watched: false, served: true },
      { pattern: 'src/app/shared/services/reader/excel/test.xlsx', included: false, watched: false, served: true },
      
      // following links are required for PivotTableComponent
      'node_modules/jquery/dist/jquery.min.js',
      'node_modules/jquery-ui-dist/jquery-ui.min.js',
      'node_modules/pivottable/dist/pivot.min.js'
    ],
    proxies: {
      '/assets/': '/assets/'
    },
    preprocessors: {

    },    
    mime: {
      'text/x-typescript': ['ts', 'tsx']
    },
    coverageReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      subdir: '.',
      reports: ['html', 'lcovonly'],
      fixWebpackSourcePaths: true
    },
    reporters: config.angularCli && config.angularCli.codeCoverage
      ? ['spec', 'progress']
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
    singleRun: false,
    formatError: msg => msg.replace(/http:\/\/localhost:9876\/_karma_webpack_\//g, ''),
    browserNoActivityTimeout: 400000
  });
};
