import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { DashboardTile } from './support/components/dashboard-tile';
import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const en = new Texts('en');
const PIVOT_TAB = 'tab1';
const DASHBOARD_TAB = 'tab2';
const ROWS_PER_HOST_CHART = 1;
const LAST_DAY_ROWS = 100;
const NODE_7_ROWS = 155;
const ERROR_ROWS = 100;
const NODE_7_ERROR_ROWS = 60;

test('log sample opens from the landing page', async ({ front, rawData }) => {
   await front.open('en');

   await front.openLogSample();

   await expect(rawData.table.rowCount).toHaveText(en.rows(appLogsSampleOf('en').rowCount));
});

test('explaining the ERROR row total of the pivot names host node-7 and narrows to its rows', async ({ front, tabBar, pivot, rawDataDialog }) => {
   await front.open('en');
   await front.openLogSample();
   await tabBar.open(PIVOT_TAB);
   await pivot.firstRowTotal.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(ERROR_ROWS));

   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Host = node-7');
   await expect(rawDataDialog.contrast.findings.first()).toContainText('60% here · 5% elsewhere');
   await expect(rawDataDialog.contrast.skipped).toContainText('Message');

   await rawDataDialog.contrast.findings.first().click();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(NODE_7_ERROR_ROWS));
   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
});

test('explaining ERROR rows filtered in the raw data view names host node-7', async ({ front, rawData }) => {
   await front.open('en');
   await front.openLogSample();
   await expect(rawData.contrast.explainButton).toHaveCount(0);

   await rawData.mainToolbar.addValueFilter('Level', 'ERROR');
   await expect(rawData.table.rowCount).toHaveText(en.rows(ERROR_ROWS));
   await rawData.contrast.explain();

   await expect(rawData.contrast.findings).toHaveCount(1);
   await expect(rawData.contrast.findings.first()).toContainText('Host = node-7');
});

test('explaining the rows of the last day names the version they run', async ({ front, rawData }) => {
   await front.open('en');
   await front.openLogSample();
   const range = await rawData.mainToolbar.addRangeFilter('Date', en.get('toolbar.valueRange'));
   await range.moveMinToMax();
   await expect(rawData.table.rowCount).toHaveText(en.rows(LAST_DAY_ROWS));

   await rawData.contrast.explain();

   await expect(rawData.contrast.findings).toHaveCount(1);
   await expect(rawData.contrast.findings.first()).toContainText('Version = 2.4.1');
   await expect(rawData.contrast.findings.first()).toContainText('100% here · 5.3% elsewhere');
});

test('explaining the raw data of a chart bar names the over-represented values', async ({ front, tabBar, dashboard, rawDataDialog }) => {
   await front.open('en');
   await front.openLogSample();
   await tabBar.open(DASHBOARD_TAB);
   await dashboard.tile(ROWS_PER_HOST_CHART).clickChartBar('node-7');
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(NODE_7_ROWS));

   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(2);
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText('Level = ERROR');
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText('38.7% here · 2.2% elsewhere');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText('Service = auth');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText('40% here · 23.7% elsewhere');
});

test('explaining the raw data of a summary count names the over-represented values', async ({ front, tabBar, dashboard, rawDataDialog }) => {
   await front.open('en');
   await front.openLogSample();
   await tabBar.open(DASHBOARD_TAB);
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn('Level');
   await dashboard.sideBar.close();
   const summary = new DashboardTile(dashboard.summaryTiles.first());
   await summary.sortAscendingBy('Level');
   expect(await summary.firstColumnValues()).toEqual(['ERROR', 'INFO', 'WARN']);
   await summary.firstCountLink.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(ERROR_ROWS));

   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Host = node-7');
   await expect(rawDataDialog.contrast.findings.first()).toContainText('60% here · 5% elsewhere');
});
