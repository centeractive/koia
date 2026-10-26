import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { expect, test } from './support/fixtures';
import { LOG_MESSAGES_CSV } from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');
const PATTERN_COLUMN = 'Message pattern';
const CONNECTION_PATTERN = 'Connection to <*>:<*> refused after <*> ms while executing the nightly reconciliation job for ten...';
const PATTERNS = [
   'Cache refreshed with <*> entries',
   CONNECTION_PATTERN,
   'Request <*> completed in <*> ms',
   'User <*> logged in from <*>'
];
const ERROR_ROWS = 15;

test('pattern column added on import groups messages in a pivot table and explains their level', async ({ front, scene, scenes, tabBar, pivot, rawDataDialog }) => {
   await front.open('en');
   await front.startWithFile();
   await scene.detectColumns(LOG_MESSAGES_CSV);
   await expect(scene.addPatternButtons).toHaveCount(1);
   await expect(scene.addPatternButtons).toHaveJSProperty('offsetHeight', 32);

   await scene.addPatternColumn(LOG_MESSAGES_CSV.columns.indexOf('Message'));

   await expect.poll(() => scene.columnNames.evaluateAll((inputs: HTMLInputElement[]) => inputs.map(i => i.value)))
      .toEqual(['Time', 'Level', 'Message', PATTERN_COLUMN]);
   await expect(scene.patternIcons).toHaveText('subdirectory_arrow_right');
   await expect(scene.preview.headers).toContainText([PATTERN_COLUMN]);
   await scene.loadData();
   await scenes.activate(LOG_MESSAGES_CSV.name);
   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows(PATTERN_COLUMN);

   expect((await pivot.rowLabels.allInnerTexts()).sort()).toEqual([...PATTERNS].sort());
   const connectionRow = (await pivot.rowLabels.allInnerTexts()).indexOf(CONNECTION_PATTERN);
   await pivot.rowTotals.nth(connectionRow).click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(ERROR_ROWS));
   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Level = ERROR');
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

   expect(message).toBe(en.get('scenes.details.patternAdded', { column: PATTERN_COLUMN }));
   await expect(sceneDetailsDialog.columnNames.last()).toContainText(PATTERN_COLUMN);
   await expect(sceneDetailsDialog.addPatternButtons).toHaveCount(0);
   await sceneDetailsDialog.close();
   await scenes.continueActive();
   await tabBar.open('tab1');
   await pivot.firstRowTotal.click();
   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(4);
   await expect(rawDataDialog.contrast.findings.nth(0)).toContainText(PATTERN_COLUMN + ' = Request <*> rejected: invalid token');
   await expect(rawDataDialog.contrast.findings.nth(1)).toContainText(PATTERN_COLUMN + ' = Request <*> failed: connection reset');
   await expect(rawDataDialog.contrast.findings.nth(2)).toContainText(PATTERN_COLUMN + ' = Request <*> failed: upstream timeout');
   await expect(rawDataDialog.contrast.findings.nth(3)).toContainText('Host = node-7');
});
