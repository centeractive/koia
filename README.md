# Koia Data Visualization

## What is Koia?

<img align="left" src="./.github/images/koialogo.png">

Koia is an [angular-based](https://angular.io/), a **privacy-focused open-source web application for visualizing and analyzing table-like data structures**. It offers a modern and minimalistic approach for creating flat tables, pivot-tables, summaries, relationship graphs and charts while having total control over your data.

Koia has originally been developed for analyzing and visualizing **log data** collected and structured with the [**Retrospective Log Analyzer**](https://retrospective.centeractive.com/)
![alt text](./src/assets/retrospective.png "Retrospective Log Analyzer") from files (local and remote), [Docker](https://www.docker.com/) and [Kubernetes](https://kubernetes.io/).

Use Koia straight away at [**https://www.koia.io**](https://www.koia.io) or continue reading.

## Why Koia?

Koia keeps the **context to the original data**. A single click on a chart element, pivot table value or summary table count, or a double-click on a graph node, shows the raw data rows behind it, right in your browser with no install or account.

**Explain** then tells you what makes these rows different: it ranks the column values that are clearly over-represented in them compared with the rest of the data, and one click on a finding narrows the rows to it. Picture 1 explains the ERROR rows of the log sample (*Or try log data* on the start page): 60% of them come from host node-7, compared with 5% of the other rows.

 <img align="center" width="880" src="./src/intro/screenshots/explain.webp" alt="Explained ERROR rows of the log sample naming host node-7">

 **Picture 1:** ERROR rows explained, host node-7 is over-represented by a factor of 11.8.

Log messages rarely repeat literally, they differ in request ids, numbers or addresses. A **pattern column** masks these variable parts (`Request r10042 failed: upstream timeout` becomes `Request <*> failed: upstream timeout`), so messages can be grouped in pivot tables and charts, filtered and explained. Add it to a free-text column, one whose values contain variable parts, while importing a file, or later to any scene, including scenes written by third party programs, through the scene details on the scenes page. Pattern columns cannot be removed yet.

A scene can be **shared as a file**: *Share as file* in the menu of a scene on the scenes page downloads it with its views and rows as `.koia` file, *Open a shared scene* on the start page adds it as new scene.

Next to this, Koia enables the **switch between multiple data sets**, so it is possible to create graphics based on different data without opening a lot of tabs in your browser but **switching between the data sets in one tab**.

## How it works

Data is loaded from files (CSV, Excel or JSON) to the browser's IndexedDB or a local CouchDB through Koia itself or it may be written to it by a third party program. Uploaded data from an individual file is represented by a **scene**. You can switch between different scenes as you please to create diagrams based on different data.

The data can be viewed, filtered and sorted in a **raw data table** or it may be refined and displayed as **charts, relationship graphs, summary or pivot tables** with a few mouseclicks. To gain insights into your data, Koia offers a variety of chart types such as: Pie charts, doughnut charts, bar charts, line charts, area charts, scatter charts, radar charts and polar area charts.

Besides simply visualizing data, Koia also features **time and value filters** to take a closer look at the data. Each view has its own filters. A time range slider, for instance, narrows the raw data table to the selected period (Picture 2).

 <img align="center" width="880" src="./.github/images/rawdata-filter.webp" alt="Raw data filtered by a time range slider">

 **Picture 2:** Raw data table filtered by a time range slider on the date column.

Dashboards combine summary tables, charts, relationship graphs and formatted text boxes in a grid of customizable dimension. Summary tables group data by several hierarchy levels and aggregate values such as average, sum or maximum (Picture 3).

 <img align="center" width="880" src="./src/intro/screenshots/dashboard.webp" alt="Dashboard on a five column grid">

 **Picture 3:** Dashboard on a five column grid with a summary table of revenue grouped by region, channel and product (average, sum, max), a scatter chart of units and revenue over time, and bar, doughnut and polar area charts.

When satisfied with the outcome, users can **save** all open tabs as a view or **export** data to use it elsewhere.

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
