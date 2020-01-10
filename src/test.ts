// This file is required by karma.conf.js and loads recursively all the .spec and framework files

import 'zone.js/dist/long-stack-trace-zone';
import 'zone.js/dist/proxy.js';
import 'zone.js/dist/sync-test';
import 'zone.js/dist/jasmine-patch';
import 'zone.js/dist/async-test';
import 'zone.js/dist/fake-async-test';
import { getTestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting} from '@angular/platform-browser-dynamic/testing';
import 'd3';

// Unfortunately there's no typing for the `__karma__` variable. Just declare it as any.
declare var __karma__: any;
declare var require: any;

// Prevent Karma from running prematurely.
__karma__.loaded = function () {};

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting()
);

// Then we find all the tests.
const context = require.context('./', true, /\.spec\.ts$/);

// const context = require.context('./', true, /view-launcher-dialog.component\.spec\.ts$/);

// const context = require.context('./', true, /shared\/model.*\.spec\.ts$/);
// const context = require.context('./', true, /front.component\.spec\.ts$/);
// const context = require.context('./', true, /query-param-extractor\.spec\.ts$/);
// const context = require.context('./', true, /connection-dialog.component\.spec\.ts$/);

// const context = require.context('./', true, /backend\/db\.service\.spec\.ts$/);
// const context = require.context('./', true, /couchdb-config\.spec\.ts$/);
// const context = require.context('./', true, /couchdb\.service\.spec\.ts$/);
// const context = require.context('./', true, /pouchdb-access\.spec\.ts$/);
// const context = require.context('./', true, /view-persistence\.service\.spec\.ts$/);
// const context = require.context('./', true, /mango-query-builder\.spec\.ts$/);
// const context = require.context('./', true, /query-converter\.spec\.ts$/);

// const context = require.context('./', true, /scene.*\.spec\.ts$/);
// const context = require.context('./', true, /column-mapping-generator\.spec\.ts$/);
// const context = require.context('./', true, /time-guesser\.spec\.ts$/);
// const context = require.context('./', true, /scene.component\.spec\.ts$/);
// const context = require.context('./', true, /scenes.component\.spec\.ts$/);
// const context = require.context('./', true, /scene-details-dialog.component\.spec\.ts$/)
// const context = require.context('./', true, /scene-utils.*\.spec\.ts$/);
// const context = require.context('./', true, /column-mapping.component.*\.spec\.ts$/);
// const context = require.context('./', true, /reader.service\.spec\.ts$/);
// const context = require.context('./', true, /csv-reader\.spec\.ts$/);
// const context = require.context('./', true, /excel-reader\.spec\.ts$/);
// const context = require.context('./', true, /json-reader\.spec\.ts$/);
// const context = require.context('./', true, /path-converter\.spec\.ts$/);
// const context = require.context('./', true, /entry-mapper\.spec\.ts$/);
// const context = require.context('./', true, /entry-persister\.spec\.ts$/);

// const context = require.context('./', true, /front.component\.spec\.ts$/);
// const context = require.context('./', true, /raw-data.service\.spec\.ts$/);
// const context = require.context('./', true, /raw-data.component\.spec\.ts$/);
// const context = require.context('./', true, /raw-data-dialog.component\.spec\.ts$/);
// const context = require.context('./', true, /query\.spec\.ts$/);
// const context = require.context('./', true, /admin.component\.spec\.ts$/);
// const context = require.context('./', true, /main-toolbar.*\.spec\.ts$/);
// const context = require.context('./', true, /main-toolbar.component\.spec\.ts$/);
// const context = require.context('./', true, /value-filter.component\.spec\.ts$/);
// const context = require.context('./', true, /filter-value-input.directive\.spec\.ts$/);
// const context = require.context('./', true, /filter-value-parser\.spec\.ts$/);
// const context = require.context('./', true, /range-filter.component\.spec\.ts$/);
// const context = require.context('./', true, /property-filter-validator\.spec\.ts$/);
// const context = require.context('./', true, /property-filter-customizer\.spec\.ts$/);

// const context = require.context('./', true, /time-range-filter\.spec\.ts$/);
// const context = require.context('./', true, /flex-canvas.component\.spec\.ts$/);
// const context = require.context('./', true, /grid.component\.spec\.ts$/);
// const context = require.context('./', true, /aggregation.service\.spec\.ts$/);

// const context = require.context('./', true, /element-context\.spec\.ts$/);
// const context = require.context('./', true, /chart-context\.spec\.ts$/);
// const context = require.context('./', true, /chart.component\.spec\.ts$/);
// const context = require.context('./', true, /chart-data.service\.spec\.ts$/);
// const context = require.context('./', true, /chart-data-helper.service\.spec\.ts$/);
// const context = require.context('./', true, /series-name-converter\.spec\.ts$/);
// const context = require.context('./', true, /chart-margin.service\.spec\.ts$/);
// const context = require.context('./', true, /chart-side-bar.component\.spec\.ts$/);
// const context = require.context('./', true, /chart-options-provider\.spec\.ts$/);
// const context = require.context('./', true, /force-y-computer\.spec\.ts$/);
// const context = require.context('./', true, /raw-data-revealer\.spec\.ts$/);


// const context = require.context('./', true, /graph.*\.spec\.ts$/);
// const context = require.context('./', true, /graph-data.service\.spec\.ts$/);
// const context = require.context('./', true, /graph-utils\.spec\.ts$/);
// const context = require.context('./', true, /graph-data.service\.spec\.ts$/);
// const context = require.context('./', true, /graph-options-provider\.spec\.ts$/);
// const context = require.context('./', true, /graph.component\.spec\.ts$/);
// const context = require.context('./', true, /graph-side-bar.component\.spec\.ts$/);
// const context = require.context('./', true, /node-double-click-handler\.spec\.ts$/);

// const context = require.context('./', true, /pivot-table.component\.spec\.ts$/);
// const context = require.context('./', true, /pivot-table-side-bar.component\.spec\.ts$/);
// const context = require.context('./', true, /pivot-options-provider\.spec\.ts$/);
// const context = require.context('./', true, /query-enhancer\.spec\.ts$/);
// const context = require.context('./', true, /cell-click-handler\.spec\.ts$/);
// const context = require.context('./', true, /pivot.*\.spec\.ts$/);
// const context = require.context('./', true, /rawdata-link-factory\.spec\.ts$/);
// const context = require.context('./', true, /value-range-filter\.spec\.ts$/);
// const context = require.context('./', true, /value-grouping-generator\.spec\.ts$/);
// const context = require.context('./', true, /value-range-grouping.service\.spec\.ts$/);
// const context = require.context('./', true, /value-range-converter\.spec\.ts$/);
// const context = require.context('./', true, /value-range-filter-merger\.spec\.ts$/);
// const context = require.context('./', true, /value-range-filter-sorter\.spec\.ts$/);
// const context = require.context('./', true, /time-grouping.service\.spec\.ts$/);
// const context = require.context('./', true, /value-range-label-comparator\.spec\.ts$/);
// const context = require.context('./', true, /summary-table.component\.spec\.ts$/);
// const context = require.context('./', true, /summary-table-side-bar.component\.spec\.ts$/);
// const context = require.context('./', true, /summary.*\.spec\.ts$/);
// const context = require.context('./', true, /view.controller\.spec\.ts$/);
// const context = require.context('./', true, /data-frame-sorter\.spec\.ts$/);
// const context = require.context('./', true, /side-bar.controller\.spec\.ts$/);

// const context = require.context('./', true, /dialog.service\.spec\.ts$/);
// const context = require.context('./', true, /export.service\.spec\.ts$/);
// const context = require.context('./', true, /raw-data-reveal\.service\.spec\.ts$/);

// const context = require.context('./', true, /array-utils\.spec\.ts$/);
// const context = require.context('./', true, /string-utils\.spec\.ts$/);
// const context = require.context('./', true, /chart-utils\.spec\.ts$/);
// const context = require.context('./', true, /common-utils\.spec\.ts$/);
// const context = require.context('./', true, /column-name-converter\.spec\.ts$/);
// const context = require.context('./', true, /date-time-utils\.spec\.ts$/);
// const context = require.context('./', true, /data-type-utils\.spec\.ts$/);
// const context = require.context('./', true, /number-utils\.spec\.ts$/);
// const context = require.context('./', true, /query-utils\.spec\.ts$/);
// const context = require.context('./', true, /query-sanitizer\.spec\.ts$/);
// const context = require.context('./', true, /test-utils\.spec\.ts$/);
// const context = require.context('./', true, /value-formatter\.spec\.ts$/);


// And load the modules.
context.keys().map(context);

// Finally, start Karma to run the tests.
__karma__.start();
