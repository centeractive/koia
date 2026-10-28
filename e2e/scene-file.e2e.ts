import { writeFileSync } from 'fs';
import { basename } from 'path';
import { gzipSync } from 'zlib';
import { Route } from 'app/shared/model/route.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { toEntries } from 'app/shared/samples/sample-data';
import { SCENE_FILE_FORMAT, SCENE_FILE_VERSION } from 'app/shared/scene-file/scene-file';
import { downloadOf, sceneFileName } from './support/downloads';
import { expect, test } from './support/fixtures';
import { fruitSalesOf, pivotTabOf } from './support/fruit-sales-sample';
import { ORDERS_CSV } from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');
const sample = fruitSalesOf('en');
const pivotTab = pivotTabOf(sample);
const VIEW_NAME = 'All';
const INDEXED_DB_MAX_ROWS = 10_000;

function writeSceneFileOfSample(path: string, rowCount: number): void {
   const sampleEntries = toEntries(sample);
   const sceneFile = {
      format: SCENE_FILE_FORMAT,
      version: SCENE_FILE_VERSION,
      scene: { ...sample.scene, creationTime: 1, database: 'data_0' },
      tabs: sample.tabs,
      entries: Array.from({ length: rowCount }, (_, i) => sampleEntries[i % sampleEntries.length])
   };
   writeFileSync(path, gzipSync(JSON.stringify(sceneFile)));
}

test.beforeEach(async ({ front }) => {
   await front.open('en');
});

test('shared scene opens with its rows, tabs and saved views, and its pivot table drills down',
   async ({ page, front, rawData, scenes, tabBar, pivot, rawDataDialog, notifications, confirmDialog }, testInfo) => {
      await front.openSample();
      await rawData.mainToolbar.saveView(VIEW_NAME);
      await notifications.dismiss(StatusType.SUCCESS);
      await rawData.mainToolbar.openScenes();
      const download = await downloadOf(page, () => scenes.share(sample.scene.name));
      const file = testInfo.outputPath(download.suggestedFilename());
      await download.saveAs(file);
      await scenes.delete(sample.scene.name);
      await page.waitForURL('**/' + Route.SCENE);
      await front.open('en');

      await front.openSceneFile(file);

      expect(download.suggestedFilename()).toMatch(sceneFileName(sample.scene.name));
      await expect(rawData.table.rowCount).toHaveText(en.rows(sample.entries.length));
      await expect(tabBar.titles).toHaveText(sample.tabs.map(tab => tab.title));
      await rawData.mainToolbar.restoreView(VIEW_NAME);
      expect(await confirmDialog.confirm()).toBe(en.get('view.restoreQuestion', { name: VIEW_NAME }));
      await tabBar.open(pivotTab.id);
      await pivot.valueCells.first().click();
      await expect.poll(() => rawDataDialog.table.rowCountValue()).toBeLessThan(sample.entries.length);
      expect(await rawDataDialog.table.rowCountValue()).toBeGreaterThan(0);
   });

test('file that is no Koia scene file is refused', async ({ front, notifications }) => {
   await front.selectSceneFile(ORDERS_CSV.path);

   expect(await notifications.dismiss(StatusType.ERROR)).toContain(en.get('sceneFile.unreadable', { file: basename(ORDERS_CSV.path) }));
});

test('canceled shared scene import leaves no scene', async ({ front, notifications }, testInfo) => {
   const file = testInfo.outputPath('large.koia');
   writeSceneFileOfSample(file, INDEXED_DB_MAX_ROWS);
   await front.selectSceneFile(file);

   await front.cancelSceneFileImport();

   expect(await notifications.dismiss(StatusType.WARNING)).toContain(en.get('sceneFile.importCanceled'));
   await front.reload();
   await expect(front.continueButton).toBeHidden();
});

test('scene shared from main toolbar downloads as .koia file', async ({ page, front, rawData }) => {
   await front.openSample();

   const download = await downloadOf(page, () => rawData.mainToolbar.shareScene());

   expect(download.suggestedFilename()).toMatch(sceneFileName(sample.scene.name));
});

test('shared scene opens from scenes page', async ({ page, front, rawData, scenes }, testInfo) => {
   await front.openSample();
   const download = await downloadOf(page, () => rawData.mainToolbar.shareScene());
   const file = testInfo.outputPath(download.suggestedFilename());
   await download.saveAs(file);
   await rawData.mainToolbar.openScenes();

   await scenes.openSceneFile(file);

   await expect(rawData.table.rowCount).toHaveText(en.rows(sample.entries.length));
   await rawData.mainToolbar.openScenes();
   await expect(scenes.rows).toHaveCount(2);
});

test('shared scene opened from main toolbar of raw data replaces shown rows', async ({ page, front, rawData }, testInfo) => {
   await front.openSample();
   const download = await downloadOf(page, () => rawData.mainToolbar.shareScene());
   const file = testInfo.outputPath(download.suggestedFilename());
   await download.saveAs(file);
   await front.open('en');
   await front.openLogSample();
   await expect(rawData.table.headers.filter({ hasText: 'Level' })).toHaveCount(1);

   await rawData.mainToolbar.openSceneFile(file);

   await expect(rawData.table.headers).toHaveText(sample.scene.columns.map(column => column.name));
});

test('shared scene opened from main toolbar of view tab replaces cached view of same tab id', async ({ page, front, rawData, tabBar, pivot }, testInfo) => {
   await front.openSample();
   const download = await downloadOf(page, () => rawData.mainToolbar.shareScene());
   const file = testInfo.outputPath(download.suggestedFilename());
   await download.saveAs(file);
   await front.open('en');
   await front.openLogSample();
   await tabBar.open('tab1');
   await expect(pivot.fieldChips.filter({ hasText: 'Level' })).toHaveCount(1);

   await pivot.mainToolbar.openSceneFile(file);
   await tabBar.open('tab1');

   await expect(pivot.fieldChips.filter({ hasText: 'Level' })).toHaveCount(0);
   await expect(pivot.fieldChips.filter({ hasText: 'Revenue' })).toHaveCount(1);
});

test('open shared scene button does not spin while file selection is open', async ({ page, front }, testInfo) => {
   const file = testInfo.outputPath('sample.koia');
   writeSceneFileOfSample(file, sample.entries.length);

   const [fileChooser] = await Promise.all([page.waitForEvent('filechooser'), front.sceneFileButton.click()]);

   await expect(front.sceneFileButton.locator('mat-icon')).not.toHaveClass(/koia-spin/);
   await fileChooser.setFiles(file);
   await page.waitForURL('**/' + Route.RAWDATA);
});
