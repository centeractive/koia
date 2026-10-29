import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { DashboardTile } from '../support/components/dashboard-tile';
import { expect, test } from '../support/fixtures';
import { openLogSampleScene } from '../support/log-sample';
import { Texts } from '../support/texts';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const DASHBOARD_TAB = 'tab2';
const ROWS_PER_HOST_CHART = 1;

test('explain these rows', async ({ page, front, rawData, tabBar, dashboard, rawDataDialog }) => {
   const recording = new VideoRecording(page, 'explain-these-rows');
   await openLogSampleScene(front);
   recording.markStart();

   await expect(rawData.table.rowCount).toHaveText(en.rows(appLogsSampleOf('en').rowCount));
   await recording.caption('The log sample holds 2,000 log rows of 30 days');
   await recording.caption('Which rows stand out, and why? Explain tells you');

   const range = await rawData.mainToolbar.addRangeFilter('Date', en.get('toolbar.valueRange'));
   await recording.caption('Add a time range filter on the date');

   await range.moveMinToMax();
   await expect(rawData.table.rowCount).toHaveText(en.rows(100));
   await recording.caption('Narrow it to the last day');

   await rawData.contrast.explain();
   await expect(rawData.contrast.findings).toHaveCount(1);
   await expect(rawData.contrast.findings.first()).toContainText('Version = 2.4.1');
   await expect(rawData.contrast.findings.first()).toContainText('100% here · 5.3% elsewhere');
   await recording.caption('Explain these rows compares them with all other rows');
   await recording.caption('All rows of the last day run the new version 2.4.1');

   await tabBar.open(DASHBOARD_TAB);
   const chart = dashboard.tile(ROWS_PER_HOST_CHART);
   await expect(chart.title).toHaveValue('Rows per host');
   await recording.caption('Explain works on charts too');
   await recording.caption('This chart counts the log rows per host');

   await chart.clickChartBar('node-7');
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(155));
   await recording.caption('Click a bar to see its rows');

   await rawDataDialog.contrast.explain();
   await expect(rawDataDialog.contrast.findings).toHaveCount(2);
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText('Level = ERROR');
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText('38.7% here · 2.2% elsewhere');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText('Service = auth');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText('40% here · 23.7% elsewhere');
   await recording.caption('Explain the rows of node-7');
   await recording.caption('39% of them are errors, only 2% elsewhere');
   await recording.caption('…and 40% come from the auth service');

   await rawDataDialog.contrast.findings.first().click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(60));
   await recording.caption('Click a finding to narrow the rows to it');

   await rawDataDialog.close();
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn('Level');
   await dashboard.sideBar.close();
   const summary = new DashboardTile(dashboard.summaryTiles.first());
   await summary.sortAscendingBy('Level');
   expect(await summary.firstColumnValues()).toEqual(['ERROR', 'INFO', 'WARN']);
   await recording.caption('A summary table counts the rows per level');

   await summary.firstCountLink.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(100));
   await recording.caption('Click a count to see its rows');

   await rawDataDialog.contrast.explain();
   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Host = node-7');
   await expect(rawDataDialog.contrast.findings.first()).toContainText('60% here · 5% elsewhere');
   await recording.caption('Explain them: 60% of the errors come from node-7');
   await recording.caption('Wherever you see rows, Explain tells you what sets them apart');

   await rawDataDialog.close();
   await recording.save();
});
