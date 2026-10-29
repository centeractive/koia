import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { basename } from 'path';
import { DashboardTile } from '../support/components/dashboard-tile';
import { expect, test } from '../support/fixtures';
import { LOG_MESSAGES_CSV } from '../support/import-files';
import { LOG_MESSAGE_PATTERNS, MESSAGE_PATTERN_COLUMN } from '../support/log-messages';
import { DashboardPage } from '../support/pages/dashboard-page';
import { Texts } from '../support/texts';
import { FileDialogKind } from './support/file-dialog';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const sample = appLogsSampleOf('en');

test('message patterns', async ({ page, front, scene, scenes, rawData, tabBar, pivot, sceneDetailsDialog, dashboard }) => {
   const recording = new VideoRecording(page, 'message-patterns');
   await front.open('en');
   await front.dismissCouchDBTip();
   recording.markStart();
   await recording.caption('Log messages differ in ids and numbers, so they hardly repeat');

   await front.startWithFile();

   await scene.detectColumns(LOG_MESSAGES_CSV, () => recording.fileDialog(FileDialogKind.OPEN, basename(LOG_MESSAGES_CSV.path)));
   await expect(scene.addPatternButtons).toHaveCount(1);
   await recording.caption('Koia offers a pattern for the free-text column Message');

   await scene.addPatternColumn(LOG_MESSAGES_CSV.columns.indexOf('Message'));
   await expect(scene.preview.headers).toContainText([MESSAGE_PATTERN_COLUMN]);
   await recording.caption('The pattern column masks the ids and numbers');

   await scene.loadData();
   await scenes.activate(LOG_MESSAGES_CSV.name);
   await expect(rawData.table.rowCount).toHaveText(en.rows(LOG_MESSAGES_CSV.rowCount));

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows(MESSAGE_PATTERN_COLUMN);
   await expect.poll(async () => (await pivot.rowLabels.allInnerTexts()).sort()).toEqual([...LOG_MESSAGE_PATTERNS].sort());
   await recording.caption('60 messages, but only 4 patterns');

   await pivot.mainToolbar.openFront();
   await front.openLogSample();
   await expect(rawData.table.rowCount).toHaveText(en.rows(sample.rowCount));
   await recording.caption('Existing scenes get pattern columns too');

   await rawData.mainToolbar.openScenes();
   await scenes.showDetails(sample.sceneName);
   await expect(sceneDetailsDialog.addPatternButtons).toHaveCount(1);

   await sceneDetailsDialog.startAddingPattern('Message');
   await recording.cutWhile(() => sceneDetailsDialog.successNotification.waitFor());
   await recording.caption('Koia masks the ids and numbers of all 2,000 rows');
   const message = await sceneDetailsDialog.patternAddedMessage();
   expect(message).toBe(en.get('scenes.details.patternAdded', { column: MESSAGE_PATTERN_COLUMN }));

   await sceneDetailsDialog.close();
   await scenes.continueActive();
   await tabBar.addDashboard();
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(MESSAGE_PATTERN_COLUMN);
   const chart = dashboard.tile(0);
   await expect(chart.title).toHaveValue(new RegExp('^' + en.get('chart.title.countDistinctValuesOf', { columns: MESSAGE_PATTERN_COLUMN })));
   await chart.expectChartPainted();
   await recording.caption('A chart counts the rows per pattern');

   await dashboard.sideBar.close();
   const box = await chart.root.boundingBox();
   const canvasWidth = () => chart.root.locator('canvas').evaluate((c: HTMLCanvasElement) => c.clientWidth);
   const narrowWidth = await canvasWidth();
   await chart.startResizeBy(box.width + DashboardPage.GRID_GAP_PX, 0);
   await expect(dashboard.resizePreview).toBeVisible();
   await recording.caption('Drag the corner to give the chart more room');
   await chart.release();
   await expect.poll(() => chart.spans()).toEqual({ columns: 2, rows: 1 });
   await expect.poll(canvasWidth).toBeGreaterThan(1.8 * narrowWidth);
   await expect(chart.root).toBeInViewport({ ratio: 1 });

   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn(MESSAGE_PATTERN_COLUMN);
   await dashboard.sideBar.dragGroupByColumn('Level');
   await dashboard.sideBar.close();
   const summary = new DashboardTile(dashboard.summaryTiles.first());
   await expect.poll(async () => (await summary.tableWidths()).columnCount).toBe(3);
   await recording.caption('A summary table counts the patterns per level');

   await recording.save();
});
