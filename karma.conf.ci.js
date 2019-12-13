// Karma configuration file, see link for more information
// https://karma-runner.github.io/0.13/config/configuration-file.html
const process = require('process');
process.env.CHROME_BIN = require('puppeteer').executablePath();
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
      require('karma-junit-reporter')
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
    coverageIstanbulReporter: {
      dir: require('path').join(__dirname, 'coverage'),
      reports: ['html', 'lcovonly', 'text-summary', 'cobertura'],
      fixWebpackSourcePaths: true
    },
    reporters: ['progress', 'kjhtml', 'junit'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    customLaunchers: {
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
    browsers: ['ChromeHeadless'],
    singleRun: false
  });
};
