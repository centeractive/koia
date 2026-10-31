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

   const rowCount = appLogsSampleOf('en').rowCount;
   await expect(rawData.table.rowCount).toHaveText(en.rows(rowCount));
   await recording.caption(`The log sample holds ${en.number(rowCount)} log rows`);

   const range = await rawData.mainToolbar.addRangeFilter('Date', en.get('toolbar.valueRange'));
   await recording.caption('Add a value range filter on the date');

   await range.dragMinBy(27);
   await expect(rawData.table.rowCount).toHaveText(en.rows(264));
   await recording.caption('Narrow it to the last days');

   await range.dragRangeBy(-10);
   await expect(rawData.table.rowCount).toHaveText(en.rows(128));
   await recording.caption('Drag the whole range to shift it in time');

   await range.dragRangeBy(10);
   await expect(rawData.table.rowCount).toHaveText(en.rows(264));
   await recording.caption('…and back to the last three days');

   await rawData.contrast.explain();
   await expect(rawData.contrast.findings).toHaveCount(1);
   await expect(rawData.contrast.findings.first()).toContainText('Version = 2.4.1');
   await expect(rawData.contrast.findings.first()).toContainText('75.8% here · 0% elsewhere');
   await recording.caption('Explain compares them with all other rows');
   await recording.pointAt(rawData.contrast.findings.first());
   await recording.caption('Only the last days run the new version 2.4.1');

   await tabBar.open(DASHBOARD_TAB);
   const chart = dashboard.tile(ROWS_PER_HOST_CHART);
   await expect(chart.title).toHaveValue('Rows per host');
   await recording.caption('This chart counts all log rows per host');

   await chart.clickChartBar('node-7');
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(155));
   await recording.caption('Click a bar to see its rows');

   await rawDataDialog.contrast.explain();
   await expect(rawDataDialog.contrast.findings).toHaveCount(2);
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText('Level = ERROR');
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText('38.7% here · 2.2% elsewhere');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText('Service = auth');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText('40% here · 23.7% elsewhere');
   await recording.caption('Explain node-7: 39% of its rows are errors, only 2% elsewhere');
   await recording.pointAt(rawDataDialog.contrast.findings.nth(1));
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
   await recording.caption('Add a summary table counting the rows per level');

   await summary.firstCountLink.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(100));
   await recording.caption('Click a count to see its rows');

   await rawDataDialog.contrast.explain();
   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Host = node-7');
   await expect(rawDataDialog.contrast.findings.first()).toContainText('60% here · 5% elsewhere');
   await recording.caption('Explain them: 60% of the errors come from node-7');
   await recording.pointAt(rawDataDialog.contrast.findings.first());
   await recording.caption('Wherever you see rows, Explain tells what sets them apart');

   await rawDataDialog.close();
   await recording.save();
});
