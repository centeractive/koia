# Koia Data Visualization

## What is Koia?

<img align="left" src="./doc/koialogo.png">

Koia is an [Angular based](https://angular.io/), open-source web-tool for everyone to create simple graphics in minutes.
It offers a modern and minimalistic approach for creating tables, charts, graphs and pivot tables of your data.

Koia has originally been created for analyzing and visualizing **log data** fetched with stunning [**Retrospective Log Analyzer**](https://retrospective.centeractive.com/)
![alt text](./doc/retrospective.png "Retrospective Log Analyzer") from files (local and remote), [Docker](https://www.docker.com/) and [Kubernetes](https://kubernetes.io/).

Use it straight away at [**https://www.koia.io**](https://www.koia.io) or continue reading.

## Why Koia?

 Koia differs from similar programs mainly in that the context to the original data is never lost. A mouse click on a chart element or a summary value, for example, opens a dialog that shows the raw data on which the displayed element or value is based.

## How it works 
 
 Data is loaded from files (CSV, Excel or JSON) to the browser's IndexedDB or a local CouchDB through Koia itself or it may be written to it by a third party program. Uploaded data from an individual file are represented by a **scene**. You can switch between different scenes as you please.

The data can be viewed, filtered and sorted in the **raw data table** or it may be refined and displayed as **charts, relationship graphs, summary or pivot tables**. A few mouseclicks give you insights into data sets. Koia offers a variety of chart types such as: Pie charts, donut charts, bar charts, line charts, area charts, scatter charts and sunburst charts.

 Besides simply visualizing data, Koia also features **time and value filters** to present a closer look at diagrams and the numbers behind them.

 When satisfied with the outcome, users can **save** the current view or **export** data to be used elsewhere.

 <img align="center" src="./doc/lemon_marketprice.png">

 **Picture 1:** Line chart of market prices over the course of several years and the according summmaries with the average prices for each year and in total.

 <img align="center" src="./doc/log_levels.png">

 **Picture 2:** Relationship graph showing the time/log level relation of log entries and a pie/scatter chart showing the occurance of the log levels.

## Getting Started

It is recommended to use [CouchDB](http://couchdb.apache.org/) as described down below since the data scenes in Koia will be lost when the browser cache is emptied when using the IndexedDB.

### Installing

1. Download and install CouchDB from http://couchdb.apache.org/#download. Follow the installation wizard steps. Be sure to install CouchDB to a path with no spaces, such as `C:\CouchDB`.
2. Open http://127.0.0.1:5984/_utils#setup and perform CouchDB single node setup according to http://docs.couchdb.org/en/stable/setup/single-node.html. You will get asked for an admin username and password, choose admin / admin.
3. Configure CORS by changing [http], [chttpd] and [cors] entries within `$COUCHDB_HOME/etc/local.ini` as follows:
```
[httpd]
enable_cors = true

[chttpd]
require_valid_user = true (required only if CouchDB is not installed on the local computer)

[cors]
origins = *
methods = GET,POST,PUT,DELETE
credentials = true
```
4. Start Koia by opening http://koia.io.

## Development

### Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

### Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive/pipe/service/class/module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Testing

### Unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### End-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).

## Built With

* [Angular CLI](https://cli.angular.io/) version 1.0.0
* [Node.js](https://nodejs.org/en/)

## License

Koia is [MIT licensed](LICENSE). Copyright (c) 2019 centeractive ag.
