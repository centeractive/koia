# Koia data visualization

This project was generated with [Angular CLI](https://github.com/angular/angular-cli)

## Prerequisites

Node.js 24 LTS (≥ 24.15)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `npm test` to execute the unit tests with [Vitest](https://vitest.dev) in headless Chromium (one-time: `npx playwright install chromium`). `npm run test-debug` runs them headed with the Vitest UI. CouchDB backend tests and the integration tests in the `IT` folders require a CouchDB at `http://localhost:5984`; the integration tests fail rather than fall back to the browser IndexedDB when it is not running.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
