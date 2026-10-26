/**
 * Generates the deterministic "App logs" sample files src/assets/samples/app-logs.{en,de,ja}.json.
 *
 * The data contains one planted pattern: 60 of the 100 ERROR rows but only 95 of the 1900 other rows come from host
 * "node-7". Service and Version are distributed in exactly the same shares among ERROR and other rows, Duration ms has many
 * distinct values and Message contains a unique request id, so explaining the ERROR rows yields "Host = node-7" only.
 *
 * usage: node scripts/generate-app-logs-sample.mjs
 */
import { writeFileSync } from 'node:fs';

const SAMPLES_DIR = 'src/assets/samples';
const HOSTS = ['node-1', 'node-2', 'node-3', 'node-4', 'node-5', 'node-6', 'node-7', 'node-8'];
const SERVICES = ['auth', 'billing', 'catalog', 'checkout'];
const MESSAGES = {
   ERROR: ['Request {id} failed: upstream timeout', 'Request {id} failed: connection reset', 'Request {id} rejected: invalid token'],
   WARN: ['Request {id} slow response', 'Request {id} retried once', 'Request {id} used fallback cache'],
   INFO: ['Request {id} completed', 'Request {id} accepted', 'Request {id} served from cache']
};

/** ERROR hosts: node-7 60 times, the other 40 spread 6, 6, 6, 6, 6, 5, 5 over node-1 to node-6 and node-8 */
function errorHosts() {
   const counts = { 'node-1': 6, 'node-2': 6, 'node-3': 6, 'node-4': 6, 'node-5': 6, 'node-6': 5, 'node-7': 60, 'node-8': 5 };
   return interleave(counts);
}

/** other hosts: node-7 95 times, the remaining 1805 spread as evenly as possible over the other seven hosts */
function otherHosts() {
   const counts = { 'node-7': 95 };
   HOSTS.filter(h => h !== 'node-7').forEach((h, i) => counts[h] = i < 6 ? 258 : 257);
   return interleave(counts);
}

/**
 * @returns the hosts in round robin order, so hosts are not clustered by row position
 */
function interleave(counts) {
   const remaining = { ...counts };
   const hosts = [];
   while (Object.values(remaining).some(c => c > 0)) {
      HOSTS.filter(h => remaining[h] > 0).forEach(h => {
         hosts.push(h);
         remaining[h]--;
      });
   }
   return hosts;
}

/**
 * @param levels the levels of the rows of a group
 * @param hosts the hosts of the rows
 * @returns rows whose services are exactly 25% each and whose version 2.4.1 is exactly 10%, both independent of the host
 */
function rowsOf(levels, hosts) {
   const count = levels.length;
   const newVersionCount = count / 10;
   return levels.map((level, i) => ({
      level,
      host: hosts[i],
      service: SERVICES[Math.floor(i * SERVICES.length / count)],
      newVersion: (i * 7919) % count < newVersionCount
   }));
}

function generateRows() {
   const errors = rowsOf(Array(100).fill('ERROR'), errorHosts());
   const otherLevels = [];
   for (let i = 0; i < 1900; i++) {
      otherLevels.push(i % 19 < 3 ? 'WARN' : 'INFO'); // 300 WARN, 1600 INFO
   }
   const others = rowsOf(otherLevels, otherHosts());
   const rows = [...errors, ...others];
   let oldDay = 0;
   let newDay = 0;
   rows.forEach((row, i) => {
      // version 2.4.1 runs on the last 2 of 30 days, version 2.4.0 on the 28 days before
      row.day = row.newVersion ? 29 + (newDay++ % 2) : 1 + (oldDay++ % 28);
      row.duration = row.level === 'ERROR' ? 1000 + (i * 37) % 4000 : 20 + (i * 53) % 900;
   });
   rows.sort((r1, r2) => r1.day - r2.day || HOSTS.indexOf(r1.host) - HOSTS.indexOf(r2.host));
   return rows.map((row, i) => {
      const templates = MESSAGES[row.level];
      const id = 'r' + String(10000 + i);
      return {
         Date: '2024-01-' + String(row.day).padStart(2, '0'),
         Level: row.level,
         Host: row.host,
         Service: row.service,
         Version: row.newVersion ? '2.4.1' : '2.4.0',
         'Duration ms': row.duration,
         Message: templates[i % templates.length].replace('{id}', id)
      };
   });
}

const COLUMNS = [
   { name: 'Date', dataType: 'Time', width: 10, indexed: true, format: 'd MMM yyyy' },
   { name: 'Level', dataType: 'Text', width: 8, indexed: true },
   { name: 'Host', dataType: 'Text', width: 8, indexed: true },
   { name: 'Service', dataType: 'Text', width: 10, indexed: true },
   { name: 'Version', dataType: 'Text', width: 8, indexed: true },
   { name: 'Duration ms', dataType: 'Number', width: 10, indexed: true },
   { name: 'Message', dataType: 'Text', width: 40, indexed: true }
];

function columnMappingOf(column) {
   const source = column.dataType === 'Time' ? { name: column.name, dataType: 'Text', format: 'yyyy-MM-dd' } :
      { name: column.name, dataType: column.dataType };
   return { source, target: column };
}

function columnOf(name) {
   return COLUMNS.find(c => c.name === name);
}

function pivotTab(title) {
   return {
      id: 'tab1',
      type: 'pivot',
      title,
      record: {
         route: 'pivot',
         name: title,
         modifiedTime: 0,
         query: { propertyFilters: [], valueRangeFilters: [] },
         data: {
            timeColumns: [],
            negativeColor: '#E57373',
            positiveColor: '#81C784',
            showRowTotals: true,
            showColumnTotals: true,
            valueGroupings: [],
            pivotOptions: {
               derivedAttributes: {},
               hiddenAttributes: ['_id'],
               hiddenFromAggregators: [],
               hiddenFromDragDrop: [],
               menuLimit: 500,
               cols: ['Host'],
               rows: ['Level'],
               vals: [],
               rowOrder: 'key_a_to_z',
               colOrder: 'key_a_to_z',
               exclusions: {},
               inclusions: {},
               unusedAttrsVertical: 85,
               autoSortUnusedAttrs: false,
               showUI: true,
               sorters: {},
               rendererName: 'Heatmap',
               aggregatorName: 'Count',
               inclusionsInfo: {}
            }
         }
      }
   };
}

function countChart(title, columnName, chartType, gridColumnSpan) {
   return {
      elementType: 0,
      title,
      gridColumnSpan,
      gridRowSpan: 1,
      width: 600,
      height: 400,
      dataColumns: [columnOf(columnName)],
      splitColumns: [],
      groupByColumns: [],
      aggregations: ['Count'],
      valueGroupings: [],
      chartType,
      colorOptions: { type: 'Categorical', scheme: 'Tableau10', bgColorOpacity: 0.75, borderColorOpacity: 1 },
      margin: { top: 0, right: 20, bottom: 20, left: 20 },
      showLegend: true,
      legendPosition: 'top',
      baseScale: { ticks: {} },
      valueScales: [{ columnName, ticks: {} }],
      stacked: false,
      multiValueAxes: false
   };
}

function dashboardTab(texts) {
   return {
      id: 'tab2',
      type: 'dashboard',
      title: texts.dashboard,
      view: {
         route: 'grid',
         name: texts.dashboard,
         modifiedTime: 0,
         query: { propertyFilters: [], valueRangeFilters: [] },
         gridColumns: 3,
         gridCellRatio: '3:2',
         elements: [
            countChart(texts.rowsPerLevel, 'Level', 'bar', 1),
            countChart(texts.rowsPerHost, 'Host', 'bar', 2),
            countChart(texts.rowsPerService, 'Service', 'doughnut', 1)
         ]
      }
   };
}

const TEXTS = {
   en: {
      name: 'App logs (sample)', description: 'Application logs by date, level, host, service and version', source: 'Koia sample data',
      pivot: 'Log levels per host', dashboard: 'Logs dashboard', rowsPerLevel: 'Rows per level', rowsPerHost: 'Rows per host',
      rowsPerService: 'Rows per service'
   },
   de: {
      name: 'App-Logs (Beispiel)', description: 'Anwendungslogs nach Datum, Level, Host, Service und Version', source: 'Koia-Beispieldaten',
      pivot: 'Log-Level pro Host', dashboard: 'Log-Dashboard', rowsPerLevel: 'Zeilen pro Level', rowsPerHost: 'Zeilen pro Host',
      rowsPerService: 'Zeilen pro Service'
   },
   ja: {
      name: 'アプリログ（サンプル）', description: '日付、レベル、ホスト、サービス、バージョン別のアプリケーションログ', source: 'Koia サンプルデータ',
      pivot: 'ホスト別ログレベル', dashboard: 'ログダッシュボード', rowsPerLevel: 'レベル別の行数', rowsPerHost: 'ホスト別の行数',
      rowsPerService: 'サービス別の行数'
   }
};

/**
 * formats like the fruit sales sample: scene and tabs indented, one line per entry
 */
function format(data) {
   return '{\n"scene": ' + JSON.stringify(data.scene, null, 2) + ',\n"tabs": ' + JSON.stringify(data.tabs, null, 2) +
      ',\n"entries": [\n' + data.entries.map(e => JSON.stringify(e)).join(',\n') + '\n]\n}\n';
}

const entries = generateRows();
for (const [language, texts] of Object.entries(TEXTS)) {
   const data = {
      scene: {
         name: texts.name,
         shortDescription: texts.description,
         context: [{ name: 'Source', value: texts.source }],
         columns: COLUMNS,
         columnMappings: COLUMNS.map(columnMappingOf),
         config: { savedViews: [] }
      },
      tabs: [pivotTab(texts.pivot), dashboardTab(texts)],
      entries
   };
   writeFileSync(`${SAMPLES_DIR}/app-logs.${language}.json`, format(data));
}
console.log(`${entries.length} entries written to ${SAMPLES_DIR}/app-logs.{${Object.keys(TEXTS).join(',')}}.json`);
