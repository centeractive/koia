import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { TabBar } from './support/components/tab-bar';
import { expect, test } from './support/fixtures';
import { APP_MESSAGES_LOG, ImportFile, LOG_MESSAGES_CSV } from './support/import-files';
import { CONNECTION_PATTERN, LOG_MESSAGE_PATTERNS, MESSAGE_PATTERN_COLUMN } from './support/log-messages';
import { PivotPage } from './support/pages/pivot-page';
import { ScenePage } from './support/pages/scene-page';
import { ScenesPage } from './support/pages/scenes-page';
import { Texts } from './support/texts';

const en = new Texts('en');
const ERROR_ROWS = 15;

/**
 * loads the data of the scene page with pattern column into a new scene and shows its message patterns in the rows of a pivot table
 */
async function pivotPatterns(file: ImportFile, scene: ScenePage, scenes: ScenesPage, tabBar: TabBar, pivot: PivotPage): Promise<void> {
   await scene.loadData();
   await scenes.activate(file.name);
   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows(MESSAGE_PATTERN_COLUMN);
}

test('pattern column added on import groups messages in a pivot table and explains their level', async ({ front, scene, scenes, tabBar, pivot, rawDataDialog }) => {
   await front.open('en');
   await front.startWithFile();
   await scene.detectColumns(LOG_MESSAGES_CSV);
   await expect(scene.addPatternButtons).toHaveCount(1);
   await expect(scene.addPatternButtons).toHaveJSProperty('offsetHeight', 32);

   await scene.addPatternColumn(LOG_MESSAGES_CSV.columns.indexOf('Message'));

   await expect.poll(() => scene.columnNames.evaluateAll((inputs: HTMLInputElement[]) => inputs.map(i => i.value)))
      .toEqual(['Time', 'Level', 'Message', MESSAGE_PATTERN_COLUMN]);
   await expect(scene.patternIcons).toHaveText('subdirectory_arrow_right');
   await expect(scene.preview.headers).toContainText([MESSAGE_PATTERN_COLUMN]);
   await pivotPatterns(LOG_MESSAGES_CSV, scene, scenes, tabBar, pivot);

   expect((await pivot.rowLabels.allInnerTexts()).sort()).toEqual([...LOG_MESSAGE_PATTERNS].sort());
   const connectionRow = (await pivot.rowLabels.allInnerTexts()).indexOf(CONNECTION_PATTERN);
   await pivot.rowTotals.nth(connectionRow).click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(ERROR_ROWS));
   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Level = ERROR');
});

test('pattern column added on log file import groups its messages by pattern', async ({ front, scene, scenes, tabBar, pivot }) => {
   await front.open('en');
   await front.startWithFile();
   await scene.detectColumns(APP_MESSAGES_LOG);
   await expect(scene.addPatternButtons).toHaveCount(1);
   await scene.addPatternColumn(APP_MESSAGES_LOG.columns.indexOf('Message'));

   await pivotPatterns(APP_MESSAGES_LOG, scene, scenes, tabBar, pivot);

   expect((await pivot.rowLabels.allInnerTexts()).sort()).toEqual([...LOG_MESSAGE_PATTERNS].sort());
});

test('pattern column added to the log sample explains its ERROR rows by message patterns', async ({ front, rawData, scenes, sceneDetailsDialog, tabBar, pivot, rawDataDialog }) => {
   const sample = appLogsSampleOf('en');
   await front.open('en');
   await front.openLogSample();
   await rawData.mainToolbar.openScenes();
   await scenes.showDetails(sample.sceneName);
   await expect(sceneDetailsDialog.addPatternButtons).toHaveCount(1);
   await expect(sceneDetailsDialog.addPatternButtons).toHaveJSProperty('offsetHeight', 20);

   const message = await sceneDetailsDialog.addPattern('Message');

   expect(message).toBe(en.get('scenes.details.patternAdded', { column: MESSAGE_PATTERN_COLUMN }));
   await expect(sceneDetailsDialog.columnNames.last()).toContainText(MESSAGE_PATTERN_COLUMN);
   await expect(sceneDetailsDialog.addPatternButtons).toHaveCount(0);
   await sceneDetailsDialog.close();
   await scenes.continueActive();
   await tabBar.open('tab1');
   await pivot.firstRowTotal.click();
   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(4);
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText(MESSAGE_PATTERN_COLUMN + ' = Request <*> rejected: invalid token');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText(MESSAGE_PATTERN_COLUMN + ' = Request <*> failed: connection reset');
   await expect(rawDataDialog.contrast.findings.nth(2)).toContainText(MESSAGE_PATTERN_COLUMN + ' = Request <*> failed: upstream timeout');
   await expect(rawDataDialog.contrast.findings.nth(3)).toContainText('Host = node-7');
});

test('pattern column counted per level in a summary table opens the rows of a count', async ({ front, rawData, scenes, sceneDetailsDialog, tabBar, dashboard, rawDataDialog }) => {
   await front.open('en');
   await front.openLogSample();
   await rawData.mainToolbar.openScenes();
   await scenes.showDetails(appLogsSampleOf('en').sceneName);
   await sceneDetailsDialog.addPattern('Message');
   await sceneDetailsDialog.close();
   await scenes.continueActive();
   await tabBar.addDashboard();
   await dashboard.launcher.addSummary();

   await dashboard.sideBar.selectColumn(MESSAGE_PATTERN_COLUMN);
   await dashboard.sideBar.dragGroupByColumn('Level');
   await dashboard.sideBar.close();

   const summary = dashboard.tile(0);
   await expect.poll(async () => (await summary.tableWidths()).columnCount).toBe(3);
   expect(new Set(await summary.firstColumnValues())).toEqual(new Set(['ERROR', 'INFO', 'WARN']));
   const count = (await summary.firstCountLink.innerText()).trim();
   await summary.firstCountLink.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.get('ui.rows', { count }));
});
