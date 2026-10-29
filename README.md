# Koia Data Visualization

## What is Koia?

<img align="left" src="./.github/images/koialogo.png">

Koia is an [angular-based](https://angular.io/), a **privacy-focused open-source web application for visualizing and analyzing table-like data structures**. It offers a modern and minimalistic approach for creating flat tables, pivot-tables, summaries, relationship graphs and charts while having total control over your data.

Koia has originally been developed for analyzing and visualizing **log data** collected and structured with the [**Retrospective Log Analyzer**](https://retrospective.centeractive.com/)
![alt text](./src/assets/retrospective.png "Retrospective Log Analyzer") from files (local and remote), [Docker](https://www.docker.com/) and [Kubernetes](https://kubernetes.io/).

Use Koia straight away at [**https://www.koia.io**](https://www.koia.io) or continue reading. New to Koia? Read the [User Manual](docs/USER-MANUAL.md).

## Why Koia?

- **Your data stays under your control.** Koia runs in your browser and stores data only there (IndexedDB) or in your own CouchDB – it is never sent to a third-party server. No install, no account, open source (MIT).
- **From file to insight in a few clicks.** Load CSV, Excel, JSON or log files and turn them into raw data tables, pivot tables, charts, relationship graphs, summary tables and dashboards – or let Koia generate a dashboard.
- **Context to the original data.** A single click on a chart element, pivot table value or summary table count, or a double-click on a graph node, shows the raw data rows behind it.
- **Many data sets, one tab.** Each file becomes a scene; switch between scenes in one browser tab instead of opening many.

## How it works

Data is loaded from files (CSV, Excel, JSON or plain-text log files, whose stack traces stay together) to the browser's IndexedDB or your own CouchDB through Koia itself or it may be written to it by a third party program. Uploaded data from an individual file is represented by a **scene**.

The data can be viewed, filtered and sorted in a **raw data table** or it may be refined and displayed as **charts, relationship graphs, summary or pivot tables** with a few mouseclicks. To gain insights into your data, Koia offers a variety of chart types such as: Pie charts, doughnut charts, bar charts, line charts, area charts, scatter charts, radar charts and polar area charts.

Besides simply visualizing data, Koia also features **time and value filters** to take a closer look at the data. Each view has its own filters. A time range slider, for instance, narrows the raw data table to the selected period (Picture 1).

 <img align="center" width="880" src="./.github/images/rawdata-filter.webp" alt="Raw data filtered by a time range slider">

 **Picture 1:** Raw data table filtered by a time range slider on the date column.

Dashboards combine summary tables, charts, relationship graphs and formatted text boxes in a grid of customizable dimension. Summary tables group data by several hierarchy levels and aggregate values such as average, sum or maximum (Picture 2).

 <img align="center" width="880" src="./src/intro/screenshots/dashboard.webp" alt="Dashboard on a five column grid">

 **Picture 2:** Dashboard on a five column grid with a summary table of revenue grouped by region, channel and product (average, sum, max), a scatter chart of units and revenue over time, and bar, doughnut and polar area charts.

Further features help with the analysis (see the [User Manual](docs/USER-MANUAL.md)):

- **Explain** names the column values over-represented in the rows you selected.
- **Pattern columns** mask ids and numbers in log messages, so they can be grouped.
- **Saved views** keep all open tabs; **export** writes data as CSV, Excel or JSON and charts as PNG.
- **Share as file** packs a scene with its views and rows into one `.koia` file.

## Scene format

Third party programs writing scenes to CouchDB must follow the scene format specified in [SPEC.md](https://github.com/centeractive/koia-scene-schema/blob/main/docs/SPEC.md), which also covers the launch URL and the discovery of supported versions through `assets/scene-format/versions.json`. JSON schemas, types and example scenes per format version are published as npm package [@centeractive/koia-scene-schema](https://www.npmjs.com/package/@centeractive/koia-scene-schema), as Java library `com.centeractive.koia:koia-scene-model` on Maven Central and as Python package [koia-scene-model](https://pypi.org/project/koia-scene-model/) on PyPI.

Koia validates each scene when it is activated: it shows the violations of an invalid scene and lists the supported versions when a scene has an unsupported `schemaVersion`. Scenes without `schemaVersion` are treated as format 1.0 and are never refused, violations are only logged as a warning.

## Getting Started

It is recommended to use [CouchDB 3.n](http://couchdb.apache.org/) as described down below since the data scenes in Koia will be lost when the browser cache is emptied when using the IndexedDB.

### Installing

1. Download and install CouchDB 3.n from [http://couchdb.apache.org/#download](http://couchdb.apache.org/#download). Follow the installation wizard steps.
2. Open [http://127.0.0.1:5984/_utils#setup](http://127.0.0.1:5984/_utils#setup) and perform CouchDB single node setup according to [http://docs.couchdb.org/en/stable/setup/single-node.html](http://docs.couchdb.org/en/stable/setup/single-node.html). You will get asked for an admin username and password, choose the default admin/admin or whatever suits you.
3. Configure CORS by changing [http] and [cors] entries within the configuration file `$COUCHDB_HOME/etc/local.ini` as follows:

   ```text
   [httpd]
   enable_cors = true

   [cors]
   origins = *
   methods = GET,POST,PUT,DELETE
   credentials = true
   ```

4. After editing the configuration file, CouchDB should be restarted to have the changes applied.
5. Start Koia by opening [**https://www.koia.io**](https://www.koia.io).

A CouchDB on another machine must be reached through HTTPS (see [CouchDB TLS options](https://docs.couchdb.org/en/stable/config/http.html#https-ssl-tls-options)); choose HTTPS in Koia's CouchDB connection dialog.


## Building

Building and serving locally is a straightforward **npx ng build --prod** followed by **ng serve**.

## License

Koia is [MIT licensed](LICENSE). Copyright (c) 2026 centeractive ag.
