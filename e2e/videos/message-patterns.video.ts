import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { basename } from 'path';
import { DashboardTile } from '../support/components/dashboard-tile';
import { expect, test } from '../support/fixtures';
import { ID_COLUMN } from '../support/id-column';
import { APP_MESSAGES_LOG } from '../support/import-files';
import { LOG_MESSAGE_PATTERNS, MESSAGE_PATTERN_COLUMN } from '../support/log-messages';
import { Texts } from '../support/texts';
import { FileDialogKind } from './support/file-dialog';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const sample = appLogsSampleOf('en');
const LOGBACK_PATTERN = '{Time:time} [{Thread}] {Level:level} {Logger} - {Message}';
const ERROR_ROW_COLOR = 'rgb(255, 120, 90)';

test('message patterns', async ({ page, front, scene, scenes, rawData, tabBar, pivot, sceneDetailsDialog, dashboard }) => {
   const recording = new VideoRecording(page, 'message-patterns');
   await front.open('en');
   await front.dismissCouchDBTip();
   recording.markStart();

   await front.startWithFile();
   await scene.selectFile(APP_MESSAGES_LOG, () => recording.fileDialog(FileDialogKind.OPEN, basename(APP_MESSAGES_LOG.path)));
   await expect(scene.linePattern).toHaveValue(LOGBACK_PATTERN);
   await recording.pointAt(scene.linePattern);
   await recording.caption('Koia detects the line pattern of the log');

   await scene.detectColumnsButton.click();
   await scene.dataTypes.first().waitFor();
   await recording.caption('The pattern splits each log entry into columns');

   await expect(scene.preview.row(0)).toHaveCSS('background-color', ERROR_ROW_COLOR);
   await recording.pointAt(scene.preview.row(0));
   await recording.caption('Rows are colored by level, errors in red');

   await recording.pointAt(await scene.preview.cell(1, 'Message'));
   await recording.caption('Messages differ in ids and numbers, so they hardly repeat');

   await expect(scene.addPatternButtons).toHaveCount(1);
   await scene.addPatternColumn([ID_COLUMN, ...APP_MESSAGES_LOG.columns].indexOf('Message'));
   await expect(scene.preview.headers).toContainText([MESSAGE_PATTERN_COLUMN]);
   await recording.caption('A pattern column masks the ids and numbers');

   await scene.loadData();
   await scenes.activate(APP_MESSAGES_LOG.name);
   await expect(rawData.table.rowCount).toHaveText(en.rows(APP_MESSAGES_LOG.rowCount));

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows(MESSAGE_PATTERN_COLUMN);
   await expect.poll(async () => (await pivot.rowLabels.allInnerTexts()).sort()).toEqual([...LOG_MESSAGE_PATTERNS].sort());
   await recording.caption(`${APP_MESSAGES_LOG.rowCount} messages, but only ${LOG_MESSAGE_PATTERNS.length} patterns`);

   await pivot.mainToolbar.openFront();
   await front.openLogSample();
   await expect(rawData.table.rowCount).toHaveText(en.rows(sample.rowCount));
   await recording.caption('Open the log sample – a scene without pattern column');

   await rawData.mainToolbar.openScenes();
   await scenes.showDetails(sample.sceneName);
   await expect(sceneDetailsDialog.addPatternButtons).toHaveCount(1);
   await recording.caption('Existing scenes get pattern columns too');

   await sceneDetailsDialog.startAddingPattern('Message');
   await recording.cutWhile(() => sceneDetailsDialog.successNotification.waitFor());
   await recording.caption(`Koia masks the ids and numbers of all ${en.number(sample.rowCount)} rows`);
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
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn(MESSAGE_PATTERN_COLUMN);
   await dashboard.sideBar.dragGroupByColumn('Level');
   await dashboard.sideBar.close();
   const summary = new DashboardTile(dashboard.summaryTiles.first());
   await expect.poll(async () => (await summary.tableWidths()).columnCount).toBe(3);
   await recording.caption('A summary table counts the patterns per level');

   await recording.save();
});
