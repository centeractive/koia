# Koia User Manual

Koia turns table-like data – CSV, Excel, JSON or log files – into raw data tables, pivot tables, charts, relationship graphs and dashboards, right in your browser. Your data stays in the browser or in your own CouchDB, it is never sent to a third-party server.

Labels in **bold** are the texts and tooltips of the English user interface. Each chapter that has a short video links it; all videos are on the [videos page](https://www.koia.io/intro/videos.html). The **User Manual** icon in the page headers and the link on the start page open this manual.

## Contents

1. [Quick start](#1-quick-start)
2. [Concepts](#2-concepts)
3. [Start page and storage](#3-start-page-and-storage)
4. [Create a scene from a file](#4-create-a-scene-from-a-file)
5. [Manage scenes](#5-manage-scenes)
6. [Raw data and filters](#6-raw-data-and-filters)
7. [Tabs and saved views](#7-tabs-and-saved-views)
8. [Drill down to the rows](#8-drill-down-to-the-rows)
9. [Explain these rows](#9-explain-these-rows)
10. [Message patterns](#10-message-patterns)
11. [Pivot tables](#11-pivot-tables)
12. [Dashboards](#12-dashboards)
13. [Charts](#13-charts)
14. [Summary tables](#14-summary-tables)
15. [Relationship graphs](#15-relationship-graphs)
16. [Share and export](#16-share-and-export)
17. [Launch from other programs](#17-launch-from-other-programs)
18. [Reference](#18-reference)

## 1. Quick start

Five minutes from the sample data to an explained finding:

1. Open [www.koia.io](https://www.koia.io) and choose **Log sample** on the start page. The raw data of 2,000 log rows opens.
2. Click **Add Filter** (funnel with plus), choose the column *Level*, type `ERROR` and press Enter. 100 rows are left.
3. Click the **Explain these rows** icon in the table toolbar. Koia lists what makes the error rows different: 60% of them come from host *node-7*, against 5% of the other rows.
4. Click **+** (**Add view**) in the tab bar, choose **New Dashboard** and then **Generate Dashboard**.
5. Click a bar of any chart. A dialog shows the rows behind the bar – and offers **Explain these rows** again.

## 2. Concepts

| Term | Meaning |
|---|---|
| Scene | The data of one imported file (or of one sample, shared file or third-party program), with its column definitions, tabs and saved views. |
| Tab (view) | One way to look at the active scene: the fixed **Raw Data** tab, plus any number of pivot tables and dashboards. |
| Element | A tile on a dashboard: chart, relationship graph, summary table, text tile or note. |
| Filter | Restricts the rows of one tab. Every tab has its own filters unless you link them. |
| Computed column | A column computed from two number columns, e.g. *Quantity × Unit Price*; usable in every view ([chapter 6](#computed-columns)). |
| Drill-down | A click on a chart bar, pivot cell, summary count or graph node opens a dialog with the rows behind it. |
| Saved view | A named snapshot of all tabs of a scene that can be restored later. |
| Storage | Where scenes live: this browser (IndexedDB) or a CouchDB. |

## 3. Start page and storage

The start page is where everything begins:

| Entry | What it does |
|---|---|
| **Load a file** | Creates a scene from a CSV, Excel, JSON or log file ([chapter 4](#4-create-a-scene-from-a-file)). |
| **Open a shared scene** | Adds a scene from a `.koia` file ([chapter 16](#16-share-and-export)). |
| **Sales sample** | Fruit sales per region, 2,000 rows with prepared tabs. |
| **Log sample** | App logs by level and host, 2,000 rows with prepared tabs. |
| **Continue with your scene** | Shown once scenes exist; opens the scenes page. |

The language button (**EN**, **DE**, **日**) in every page header switches between English, German and Japanese and is remembered. Besides the texts, the language also decides which language version of a sample opens, which log level names are recognized at import, and the suffix of new pattern columns.

### 3a. Storage

The line under the start entries tells where data is stored. **Change storage** switches between:

- **IndexedDB** – this browser. Nothing to install, up to 10,000 rows per scene. Data is lost when the browser data is cleared.
- **CouchDB** – faster with larger data, up to 100,000 rows per scene, survives clearing the browser and can be shared. Choosing it opens the **CouchDB Access** dialog with **Protocol**, **Host**, **Port**, **User** and **Password**.

Good to know:

- For a CouchDB on another machine, use HTTPS. Its password is kept only for the current browser tab unless you tick **Remember password in this browser** – it is then stored unencrypted.
- If a saved CouchDB cannot be reached at startup, Koia falls back to IndexedDB and says so.
- How to install CouchDB and configure CORS is described in the [README](../README.md#getting-started).

Video: [Managing scenes and navigating](https://www.koia.io/intro/videos.html)

## 4. Create a scene from a file

**Load a file** on the start page, or the **Add Scene** icon in any page header, opens the **New Scene** page. Name and description (**Scene Name**, **Short Description**) are filled in from the file; change them as you like.

<img width="880" src="../src/intro/screenshots/scene.webp" alt="New Scene page with column definitions and preview">

1. **Data Source** – choose the **Source Type** (CSV, Excel, JSON or Log), click **Select File** and check the **Character Encoding** (CSV and Log). The **Data Sample** shows the start of the file.
2. Source attributes – set what the file needs, then click **Detect Columns**:

   | Source | Attributes |
   |---|---|
   | CSV | **First row contains column names**, **Separator** – both detected. |
   | Excel | **Sheet Name** – empty means the first sheet; column names in the first row. |
   | JSON | **Array JSONPath** to the array of flat objects; detected paths are offered. |
   | Log | **Line pattern** – see [4a](#4a-log-files). |

   **Language** decides how dates and numbers are parsed. **Adopt columns from existing Scene** copies the columns of another scene instead of detecting them. **Add ID column** (on by default) adds the column *ID* numbering the rows 1, 2, 3, …
3. **Column Definitions** – one row per column, detected from the first 100 rows. Delete irrelevant columns, rename them and choose their **Data Type**:

   | Detected | Selectable |
   |---|---|
   | Number or Time | Number, Text, Time |
   | Text | Text, Time |
   | Boolean | Boolean, Text |
   | Object | Object |

   A text column turned into Time needs a **Source Format**; the **Display Format** shows how times appear. **Width** is the column width in characters. A warning icon marks columns with values of incompatible types.

   An integer column named like *Year*, *Jahr* or *Année* with values from 1 to 9999 is detected as Time of Source Format `y`, and turning an integer column of such values into Time fills in `y` as well. Years below 1000 show leading zeros, e.g. *0001*. Turn a counter that only looks like a year, e.g. *Year count*, back into Number.
4. **Preview** – shows the mapped sample rows; rows with mapping errors carry a warning icon. Click **Load Data**. **Max. items** limits the rows, **Abort on data error** stops at the first bad row, **Cancel** stops the load (rows stored so far are kept). The scenes page opens when the load is done.

Good to know:

- Column names must not start with `$` or `_` and have at most 100 characters; scene names at most 40.
- Changing a source attribute discards the detected columns; detect them again.
- Text columns with values longer than 100 characters are not indexed: they cannot be sorted and Explain skips them.

### 4a. Log files

A plain-text log file is split into columns by a **Line pattern**. Koia picks the preset that matches the most lines; choose another preset or edit the pattern if needed.

| Preset | Typical source |
|---|---|
| `{Time:time} {Level:level} [{Thread}] {Logger} - {Message}` | Logback, Log4j |
| `{Time:time} [{Thread}] {Level:level} {Logger} - {Message}` | Logback, Log4j |
| `{Time:time} - {Logger} - {Level:level} - {Message}` | Python logging |
| `{Level:level}:{Logger}:{Message}` | Python default |
| `{Time:time} {Host} {Process}: {Message}` | syslog style |
| `{Time:time} {Level:level} {Message}` | simple logs |
| `{json}` | JSON Lines |
| `{logfmt}` | `key=value` pairs |

- `{Name}` becomes a column, `{Name:time}` a timestamp, `{Name:level}` a log level.
- A line that does not match is appended to the last column of the previous entry, so stack traces stay with their message. Blank lines are skipped.
- `:time` reads ISO-like times such as `2024-01-30 14:05:09.123` or `2024-01-30T14:05:09Z`.
- Rows are colored by level (errors red, warnings yellow); see **Highlight rows** in [chapter 6](#6-raw-data-and-filters).
- Log messages rarely repeat literally; add a pattern column for them right here ([chapter 10](#10-message-patterns)).

Video: [Creating a new scene](https://www.koia.io/intro/videos.html)

Video for log files: [Message patterns](https://www.koia.io/intro/videos.html)

## 5. Manage scenes

The **Scenes** icon in any page header opens the scenes page. The active scene is marked **Active** and listed first, the others by when they were last used. A scene just created on the **New Scene** page is marked **New** until you leave the scenes page.

- **Filter scenes** narrows the list by name or description; **Clear filter** (✕ in the field) empties it.
- The play icon activates a scene (**Activate scene**) or returns to the active one (**Continue with active scene**).
- The **⋮** menu of a row offers **Show details**, **Share as file**, **Edit name and description** and **Delete**. While a row is edited (Enter saves, Esc cancels), the other rows are locked.
- **Delete all** – or **Delete filtered** while a filter is set – removes several scenes after a confirmation; the filter is cleared afterwards.

**Show details** lists the source of the scene and its columns with type, format and width. It is also where pattern columns are added later ([chapter 10](#10-message-patterns)). The **Show Scene Details** icon in the data toolbar shows the same details read-only.

Good to know: **Delete** of a single scene does not ask for confirmation.

Video: [Managing scenes and navigating](https://www.koia.io/intro/videos.html)

## 6. Raw data and filters

The **Raw Data** tab shows the rows of the active scene. Rows load as you scroll; the footer counts them.

| To | Do |
|---|---|
| Sort | Click a column header (or press Enter or Space on it): ascending, descending, unsorted. Only indexed columns sort; computed columns do not. |
| Resize a column | Drag the right edge of its header. |
| See long values | **Show multi-line rows**, or hover a cell. |
| See objects | **Show nested objects** (scenes with Object columns), or click an Object cell. |
| Use import widths | **Observe specified column widths**. |
| Color rows | **Highlight rows** applies the row colors of log levels or of the Retrospective Log Analyzer. |
| Export | **⋮** → **Save As CSV**, **Save As Excel** or **Save As JSON** ([chapter 16](#16-share-and-export)). |
| Print | **Landscape Pages** or **Portrait Pages**, then **Print current view**. |
| Computed columns | **⋮** → **Computed Columns** ([below](#computed-columns)). |

### Filters

**Add Filter** (funnel with plus) lists the columns. Text, Boolean and Object columns get a value filter at once; Number and Time columns ask for **Value** or **Value Range**.

A **value filter** shows column, operator and value. Click the column or the operator to change them, type the value and press Enter.

Value filters appear in a row below the toolbar; when there are many, they wrap onto further rows, each filter stays on one line.

| Type | Operators |
|---|---|
| Text | contains, <, <=, =, ≠, >=, >, is empty, is not empty, is any of, is none of |
| Number | the same without contains |
| Time | is empty, is not empty |
| Boolean | =, is empty, is not empty |
| Object | contains, is empty, is not empty |

*contains* ignores case, *=* and *≠* do not. Separate the values of *is any of* and *is none of* with `;`.

A **value range filter** is a slider in a row below the toolbar and the value filters:

- Drag either handle, or the whole range.
- Click the range label to switch between **is inside range** and **is outside range**.
- **Define slider step size** sets the step, e.g. one day.
- **Reset value range filter** restores the full range.

The ⊖ button removes a filter, **Refresh data** reloads the rows. **Hide filters** hides all filters to save space, **Show filters** shows them again; its badge counts the filters.

Good to know:

- Each tab has its own filters unless you link them: a filter on Raw Data does not change a dashboard.
- With CouchDB, sorting by a column drops the rows where that column is empty.

### Linked filters

**Link filters of all tabs** (chain icon next to **Add Filter**) gives every tab of the scene (Raw Data, pivot tables, dashboards) the filters of the current tab. Sorting stays per tab.

- While linked, adding, changing or removing a filter on any tab changes it on all tabs.
- Only the tab you look at reloads right away; every other tab reloads when you open it.
- New tabs get the linked filters. Linking a tab without filters removes the filters of all tabs.
- **Unlink filters** (same button): every tab keeps its filters and changes them on its own again.
- Koia remembers per scene whether filters are linked, also in saved views and shared `.koia` files. Drill-down dialogs are not linked.

Video: [Filtering rows](https://www.koia.io/intro/videos.html)

### Computed columns

A computed column holds the result of two number columns per row, e.g. *Quantity × Unit Price*. It is saved with the scene and offered in every view, marked by the functions icon; its tooltip shows the formula.

| View | Create | Edit |
|---|---|---|
| Raw data | **⋮** → **Computed Columns** → **New Computed Column…** | **⋮** → **Computed Columns** → the column |
| Pivot table | the same **⋮** submenu | the same **⋮** submenu |
| Chart | **Values** → **Computed Column** | the pencil next to the column |
| Summary table | **Data** → **Computed Column** | the pencil next to the column |
| Relationship graph | **Data Hierarchy** → **Computed Column** (adds it as the last level) | the pencil next to the column |

The dialog asks for the **Column Name**, the **First Column**, the **Operation** (+, −, ×, ÷ or *as % of*) and the **Second Column**; **Swap columns** swaps the two columns. The formula and an example row preview the result. When editing, **Delete** removes the column after a confirmation. **New Computed Column…** and **Computed Column** are disabled without number columns.

Computed columns can be:

- shown, but not sorted, in raw data;
- aggregated, grouped into value ranges, grouped by and split by in charts and summary tables;
- levels of a relationship graph;
- row and column fields and aggregated attributes of pivot tables.

Renaming or deleting a computed column updates or removes it in all tabs and saved views that use it.

Good to know: **Generate Dashboard**, filters and **Explain these rows** do not use computed columns. Drilling into values of a computed column shows a warning ([chapter 8](#8-drill-down-to-the-rows)).

Video: [Computed columns](https://www.koia.io/intro/videos.html)

## 7. Tabs and saved views

- **+** (**Add view**) adds a **New Pivot Table** or a **New Dashboard**.
- Double-click a tab, or press F2, to rename it.
- The × of a tab, or the Delete key, closes it. Koia asks first if the tab has content. **Raw Data** cannot be closed.
- Tabs, and whether their filters are linked, are saved with the scene automatically.

A **saved view** keeps all tabs of a scene under a name, for example to return to an analysis later:

- **Save view** (toolbar) → **Save all tabs as view** stores all tabs, the active tab, the raw data state (filters, sorting, column widths) and whether filters are linked. Saving under an existing name replaces that view.
- **Restore view** (toolbar, its badge counts the saved views) lists the views below **Open a shared scene**; restoring replaces all open tabs.
- **Manage Views** (end of that list) renames and deletes views.

Video: [Managing scenes and navigating](https://www.koia.io/intro/videos.html)

## 8. Drill down to the rows

Every number Koia shows leads to its rows:

| Where | How |
|---|---|
| Chart | Click a bar, slice or point. |
| Pivot table | Click a cell. |
| Summary table | Click a count. |
| Relationship graph | Double-click a node. |

The rows open in a dialog. Its filters are those of the tab plus one filter per clicked value; a clicked time group becomes a time range. Values deselected in the value filter of a pivot field become filters ending with *or empty*: like the pivot table, they keep the rows where that field is empty unless *null* or *empty* is deselected too; with CouchDB, sorting by that field drops these rows (see [chapter 6](#6-raw-data-and-filters)). You can add filters, sort, export and explain the rows there.

Good to know: a clicked, pinned or filtered value of a computed column cannot be drilled into; Koia shows a warning instead. A cell, bar or count that only aggregates a computed column, e.g. its sum per product, still shows its rows.

## 9. Explain these rows

Explain answers *"what is special about these rows?"*. It compares the selected rows with the rest and lists the column values that are clearly over-represented in them.

<img width="880" src="../src/intro/screenshots/explain.webp" alt="Explained ERROR rows of the log sample naming host node-7">

1. Select rows: set a filter on the **Raw Data** tab, or drill down from a chart, pivot, summary or graph.
2. Click the **Explain these rows** icon in the table toolbar. The panel **What makes these rows different** opens.
3. Read the findings, strongest first:
   - `Host = node-7` – the over-represented value;
   - **60% here · 5% elsewhere** – its share in the selected rows and in the rest;
   - **×11.8** – how many times more frequent it is here, or **new** if it never occurs elsewhere.
4. Click a finding to narrow the rows to it. A click on another finding replaces that narrowing.

The rest is all other rows on the **Raw Data** tab, and the other rows of the tab in a drill-down dialog – so a chart bar is compared with the rest of its chart.

How it decides:

- Only indexed Text, Number and Boolean columns are analyzed. Columns you filtered on are not – after *Level = ERROR*, Level is no finding. Time and computed columns are not analyzed either.
- A value counts only if it occurs in at least 3 selected rows and at least 5% of them.
- Its share must be significantly higher than elsewhere: a one-sided two-proportion test with z ≥ 3, corrected for the number of values tested (1% family error rate).
- At most 15 findings are shown. Text columns with more than 500 different values are skipped and listed as not analyzed; Number columns with more than 50 are skipped silently.

Good to know:

- Findings of empty values read **(empty)** and can be clicked; **(null)** and **("")** cannot.
- On the **Raw Data** tab the icon appears once a filter is set. It is not offered for single-row dialogs, nor in page mode.

Video: [Explain these rows](https://www.koia.io/intro/videos.html)

## 10. Message patterns

Log messages rarely repeat literally – they differ in ids, numbers and addresses. A **pattern column** masks these variable parts, so the messages can be grouped:

```text
Request r10042 failed: upstream timeout   →   Request <*> failed: upstream timeout
```

Add a pattern column in one of two ways:

- **When creating a scene**: in the column definitions ([chapter 4](#4-create-a-scene-from-a-file)), the pattern icon of a free-text column (**Add a pattern column that masks variable parts such as ids and numbers**) inserts the column *Message pattern* next to it.
- **Later**: *Scenes page → ⋮ → Show details*, then **Add pattern column** on the column. This works for every scene, including scenes written by third-party programs. Koia processes all rows and reports **Pattern column "Message pattern" added**.

Then use the pattern column like any other column: as pivot field, chart or summary column, in filters and in Explain findings.

Good to know:

- Masked are URLs, e-mail addresses, quoted strings, words containing digits and long hex words.
- It is offered only for Text columns whose values are free text, once per column. Patterns are shortened to 100 characters.
- Pattern columns cannot be removed yet.

Video: [Message patterns](https://www.koia.io/intro/videos.html)

## 11. Pivot tables

**+** → **New Pivot Table** opens all columns, computed columns included, as fields.

<img width="880" src="../src/intro/screenshots/pivot.webp" alt="Pivot table with heatmap">

1. Drag fields into the rows and columns area. The arrow of a field opens its value filter (**Select All**, **Select None**, **Filter values**).
2. Choose the renderer – **Heatmap** (default), **Row Heatmap**, **Col Heatmap**, **Table** or **Table Barchart** – and the aggregator, e.g. Count, Sum, Average, Median, Minimum, Maximum or Count Unique Values.
3. Click a cell to see its rows ([chapter 8](#8-drill-down-to-the-rows)).

The toolbar of the tab adds:

- **Define Value Grouping...** – group a number column, also a computed one, into ranges (**Add Value Range**, **Up to:**); without an active range all values fall into *min - max*.
- **Time Unit Grouping** – group a time column by millisecond up to year. In the hour repeated when clocks are turned back, the labels carry the UTC offset, e.g. *27 Oct 2024 02 +02:00* and *27 Oct 2024 02 +01:00*.
- **Show Row Totals** / **Show Column Totals**, and **Heatmap Colors** for negative and positive values.
- **⋮** → **Computed Columns** creates and edits computed columns ([chapter 6](#computed-columns)).
- **⋮** → **Save As Excel**.

Video: [Pivot tables and export](https://www.koia.io/intro/videos.html)

## 12. Dashboards

**+** → **New Dashboard** opens the **Create View** dialog: start with a **Chart**, **Relationship Graph** or **Summary Table**, or let Koia **Generate Dashboard** from the data. The generator picks suitable columns and fills whole grid rows with charts and summary tables; each run differs. It never uses the ID column. Running totals, such as cumulative counts, are charted per original time step as sum and average. Their highest (latest) value per series category appears in summary tables (per period also the lowest) and in stacked bar charts whose stacks total the categories; a table footer's Max is the highest single series value, not a total. Running totals are not scattered over time. Charts and count tables whose values are all equal, or only reflect the calendar, are left out. Two measures over time get a chart with distinct value axes. **Regenerate Dashboard** replaces all elements after a confirmation.

<img width="880" src="../src/intro/screenshots/dashboard.webp" alt="Dashboard on a five column grid">

**Layouts** (dashboard toolbar, in this order):

- **Screen View** – the dashboard on the screen; with **Snap to Grid** off, tiles go anywhere and their edges snap to other tiles.
- **Landscape Pages** / **Portrait Pages** – the canvas is split into sheets; **Print current view**, enabled on pages, prints them.
- **Snap to Grid** – on the screen view, tiles fill grid cells; click it again to place tiles freely. The **⋮** menu, disabled off the grid, sets **Grid Columns** (1–5) and the **Grid Cell Ratio (width:height)**. New and generated dashboards start with Screen View and Snap to Grid.
- Switching between grid, screen view and pages scales the tiles to the new width and keeps their heights; the tiles of each page flow on below the tiles before them, without empty pages in between.
- **Allow overlapping tiles** (canvas, disabled in the grid) – when off, tiles side by side form a row and flow like text. A tile moved within its row swaps with a neighbour once it covers half of it (as in the grid); a tile moved onto another row is inserted where its centre is: while you drag, the tiles behind it already shift right, tiles no longer fitting the width wrap to the start of the next row (beside a taller tile of the row above), and the gap the tile leaves closes. A tile resized or moved with the arrow keys makes room the same way: the tiles to its right shift right, the tiles below move down, and its edge stops at the tiles to its left and above. Aligned tiles keep their place and the tiles covered move down; several tiles moved together push the tiles they cover down, on pages onto the next page if needed, and never cover each other. Notes may always overlap. New and generated dashboards start with it off.

Video: [Dashboard layouts](https://www.koia.io/intro/videos.html)

**Elements**: **Add Chart**, **Add Relationship Graph**, **Add Summary**, **Add Text Tile** and **Add Note** (a sticky note above the tiles). Each tile has a header with:

- the title – click it to edit; left alone, Koia generates it;
- **Configure...** – opens the side bar of the element (chapters 13–15);
- **Toggle resizable chart margin** (charts);
- **Delete**; to move a tile, drag its header anywhere but its buttons, or any empty spot of the tile beside the chart, graph or table, where the pointer shows the move cursor (in the grid, once there are two tiles);
- **⋮** – **Column Span** and **Row Span** (grid), **Bring to Front** and **Send to Back** (canvas, for all selected tiles), and the export of the element.

Click an empty part of a tile to select it, then drag its corner to resize it. In the grid, dragging the left edge over the tile to the left makes the tile wider to the left, the neighbour moving after it, already while you drag. Esc clears the selection.

On the canvas, several tiles are selected together: drag a frame around them, starting beside the tiles, or Shift- or Ctrl-click further tiles (charts, graphs and summaries on their header or an empty spot, text tiles and notes on their frame or move button). With Alt held, the frame may start on a tile and selects every tile it touches. Dragging one of the selected tiles moves all of them; a click without moving selects that tile alone. Several selected tiles show a dashed box; while they lie on one page, its handles resize them together. Arrow keys move the selected tiles by one unit, with Shift by ten, within their page.

Right-click a tile, which selects it alone unless it is selected already, for **Cut**, **Copy**, **Duplicate**, **Delete**, **Bring to Front**, **Send to Back**, **Bring Forward**, **Send Backward**, **Align** (left, center, right, top, middle, bottom, two or more tiles), **Distribute** (horizontally or vertically, three or more tiles) and **Select All**; they act on all selected tiles. Right-click an empty spot for **Paste**, which places the copied tiles there, and **Select All**; Ctrl+V pastes them a little offset from the copied tiles, cut tiles in their place. Copied tiles can be pasted into any dashboard of the same scene. Inside a text, the menu of the browser stays.

Text tiles and notes have a toolbar while edited: **Font**, **Font Size**, **Bold**, **Italic**, **Underline**, alignment, **Text Color**, **Background Color** and **Border**.

Good to know: **Delete** on a tile does not ask for confirmation.

Video: [Dashboards and charts](https://www.koia.io/intro/videos.html)

## 13. Charts

**Configure...** on a chart opens its side bar. Choose the chart type at the top:

| Chart types | Max. values |
|---|---|
| Pie, Doughnut, Radar, Polar Area | 1,000 |
| Bar, Horizontal Bar | 5,000 |
| Linear Bar, Linear Horizontal Bar, Line, Area, Scatter | – |

Then set the panels:

- **Values** – the data column(s); several columns must all be numbers. **Computed Column** creates a column from two number columns, e.g. a percentage.
- **Value Mode** – **Count Distinct Values**, **Individual Values**, **Aggregate Values** or **Count Rows**; offered depending on chart type and columns. **Aggregation** picks Sum, Average, Median, Max or Min.
- **Group by** (X-axis) – with **Time Unit Grouping** for time columns; computed columns are offered too.
- **Value Splitting** – one series per value of the selected columns, computed columns included.
- **Stacked**, **Show Distinct Scales**, **Color Scheme**, legend position, axis titles and label rotation.

Individual values of Line, Area, Scatter, Linear Bar and Linear Horizontal Bar charts with more than 1,000 points per series are sampled down, marked by a warning icon; stacked series keep the points of the same X values, so their stacks stay exact.

A click on a bar, slice or point shows its rows ([chapter 8](#8-drill-down-to-the-rows)). **⋮** → **Save As PNG** exports the chart.

Video: [Dashboards and charts](https://www.koia.io/intro/videos.html)

## 14. Summary tables

A summary table counts or aggregates rows per group, over several hierarchy levels.

1. **Data** – choose the column and **Count Distinct Values** or **Aggregate Values**. For number columns, **Define value grouping** groups the values into ranges. **Computed Column** creates a column from two number columns ([chapter 6](#computed-columns)).
2. **Hierarchy** – drag the group-by columns, computed columns included, into **Selected Columns**; their order sets the levels. Time columns can be grouped by a time unit.
3. **Aggregation** – drag Count, Average, Median, Max, Min or Sum into **Selected Aggregations**.

Click a header to sort; empty values come first in ascending and last in descending order. The **Overall** row aggregates all rows: the total count, or the average, median, maximum, minimum or sum of all values – not of the group results. Each count links to its rows (**Show Data...**). **⋮** → **Save As CSV**, **Save As JSON** or **Save As Excel** exports the table.

Good to know: counts are not clickable while a value grouping is used. Counts of a computed column's values show a warning instead of rows.

Good to know: a group without numbers shows an empty cell for Average, Median, Max, Min and Sum.

Good to know: a column named like an aggregation, e.g. Count, keeps its own column; in exports the aggregation column then gets a number suffix, e.g. Count (2).

Video: [Summary tables](https://www.koia.io/intro/videos.html)

## 15. Relationship graphs

A relationship graph shows how the values of several columns hang together, as a tree of nodes from a root.

- **Data Hierarchy** – drag columns, computed columns included, into **Selected Columns**; each column is one level. **Computed Column** adds a new computed column as the last level; the pencil next to a computed column edits it. A double-click on a node of a computed column shows a warning instead of rows.
- **Other** – sliders for the force layout: **Link Distance**, **Link Strength**, **Friction**, **Charge**, **Gravity**, **Theta**, **Alpha**.
- Drag nodes to arrange them. Hovering a node shows its value and number of entries; a double-click shows its rows.

Good to know: a graph shows at most 1,000 nodes – filter the data or use a chart for more. Graphs cannot be exported.

Video: [Relationship graphs](https://www.koia.io/intro/videos.html)

## 16. Share and export

**Share a scene** with all its tabs, linked filters, saved views and rows as one `.koia` file:

- *Scenes page → ⋮ → Share as file*, or
- *Save view* (toolbar of the active scene) → *Share as file*.

**Open a shared scene** on the start page, on the scenes page or in the **Restore view** menu of the toolbar adds the file as a new scene and opens it. Click the button again to cancel; in the toolbar, that is the spinning **Restore view** button. Nobody needs a server or an account – just the file.

Good to know:

- The scene keeps its name; if the name is taken, a number is appended.
- A scene file with more rows than the storage holds per scene (10,000 for IndexedDB) is refused.

**Export** data for other tools:

| From | Formats | Content |
|---|---|---|
| Raw data (**⋮**) | CSV, Excel, JSON | All filtered rows, not just the loaded ones. |
| Pivot table (**⋮**) | Excel | The table as shown. |
| Chart (tile **⋮**) | PNG | The chart image. |
| Summary table (tile **⋮**) | CSV, JSON, Excel | The table. |

Video: [Sharing scenes as files](https://www.koia.io/intro/videos.html)

## 17. Launch from other programs

Programs such as the [Retrospective Log Analyzer](https://retrospective.centeractive.com/) write scenes to a CouchDB and open them in Koia with a launch URL:

```text
https://www.koia.io/?lang=de#host=localhost&port=5984&user=admin&pw=YWRtaW4=&scene_id=<id>
```

- `host`, `port`, `user` and `pw` (Base64) are all required, plus `scene_id`. `protocol=HTTPS` is optional, HTTP is the default.
- Put them in the fragment after `#`, which never reaches a web server. The fragment is used only when it contains `host`; otherwise the query string is read.
- `lang` (`en`, `de`, `ja`) is read from the query string only, so it goes before the `#`.
- The connection is used for the current browser tab only.

Koia checks the scene against the scene format when it is activated; see [Scene format](../README.md#scene-format).

## 18. Reference

### Keyboard

| Key | Where | Action |
|---|---|---|
| F2 or double-click | Tab | Rename |
| Delete | Tab | Close |
| Enter or Space | Column header | Sort |
| Enter | Filter value | Apply |
| Esc | Dashboard | Clear the tile selection |
| Shift or Ctrl + click | Dashboard canvas | Add a tile to the selection or remove it |
| Alt + drag | Dashboard canvas | Select the tiles the frame touches |
| Ctrl+A | Dashboard canvas | Select all tiles |
| Delete or Backspace | Dashboard canvas | Delete the selected tiles |
| Arrow keys, Shift + arrow keys | Dashboard canvas | Move the selected tiles by 1 or 10 units |
| Ctrl+C / Ctrl+X / Ctrl+V | Dashboard canvas | Copy / cut / paste tiles |
| Ctrl+D | Dashboard canvas | Duplicate the selected tiles |
| Ctrl+Shift+F / Ctrl+Shift+B | Dashboard canvas | Bring to front / send to back |
| Ctrl+Alt+Shift+F / Ctrl+Alt+Shift+B | Dashboard canvas | Bring forward / send backward |
| Enter / Esc | Scene name being edited | Save / cancel |

### Limits

| What | Limit |
|---|---|
| Rows per scene | 10,000 (IndexedDB), 100,000 (CouchDB); **Max. items** at import |
| Sample rows for column detection | 100 |
| Chart values | 1,000 (Pie, Doughnut, Radar, Polar Area), 5,000 (Bar, Horizontal Bar) |
| Graph nodes | 1,000 |
| Explain | 15 findings; Text columns ≤ 500, Number columns ≤ 50 different values |
| Indexed text, pattern length | 100 characters |
| Names | scene 40, column 100, view and tab 40 characters |
