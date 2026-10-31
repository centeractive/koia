import { basename } from 'path';
import { downloadOf, sceneFileName } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { SALES_CSV } from '../support/import-files';
import { openSalesScene, SALES_SCENE_DESCRIPTION, SALES_SCENE_NAME } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { FileDialogKind } from './support/file-dialog';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const PIVOT_TAB = 'tab1';
const DASHBOARD_TAB = 'tab2';
const PIVOT_TITLE = 'Sales pivot';
const DASHBOARD_TITLE = 'Sales overview';

test('sharing scenes as files', async ({ page, front, scene, scenes, rawData, tabBar, pivot, dashboard, rawDataDialog }, testInfo) => {
   const recording = new VideoRecording(page, 'shared-scenes');
   await openSalesScene(front, scene, scenes);
   await rawData.mainToolbar.openFront();
   await front.openLogSample();
   await rawData.mainToolbar.openScenes();
   await scenes.edit(SALES_CSV.name, SALES_SCENE_NAME, SALES_SCENE_DESCRIPTION);
   await scenes.activate(SALES_SCENE_NAME);
   recording.markStart();

   await expect(rawData.table.rowCount).toHaveText(en.rows(SALES_CSV.rowCount));
   await recording.caption('Build a scene with several tabs');

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows('Region');
   await pivot.dragFieldToColumns('Channel');
   await tabBar.rename(tabBar.tab(PIVOT_TAB), PIVOT_TITLE);
   await recording.caption('A pivot table…');

   await tabBar.addDashboard();
   await dashboard.launcher.generateDashboard();
   await dashboard.tiles.first().waitFor();
   await tabBar.rename(tabBar.tab(DASHBOARD_TAB), DASHBOARD_TITLE);
   await expect(tabBar.titles).toHaveText([PIVOT_TITLE, DASHBOARD_TITLE]);
   await recording.caption('…and a generated dashboard');

   const download = await downloadOf(page, () => dashboard.mainToolbar.shareScene());
   expect(download.suggestedFilename()).toMatch(sceneFileName(SALES_SCENE_NAME));
   await recording.fileDialog(FileDialogKind.SAVE, download.suggestedFilename());
   const file = testInfo.outputPath(download.suggestedFilename());
   await download.saveAs(file);
   await recording.caption('Share as file saves the scene and its tabs in one .koia file');

   await dashboard.mainToolbar.openScenes();
   await scenes.delete(SALES_SCENE_NAME);
   await expect(scenes.rows).toHaveCount(1);
   await recording.caption('Delete the scene – the shared file keeps it');

   await scenes.navButtons.openFront();
   await front.chooseSceneFile(file, () => recording.fileDialog(FileDialogKind.OPEN, basename(file)));
   await expect(rawData.table.rowCount).toHaveText(en.rows(SALES_CSV.rowCount));
   await expect(tabBar.titles).toHaveText([PIVOT_TITLE, DASHBOARD_TITLE]);
   await recording.caption('Open a shared scene brings it back with all its tabs');

   await tabBar.open(DASHBOARD_TAB);
   await dashboard.tiles.first().waitFor();
   await recording.caption('Every tab comes back as it was saved');

   await tabBar.open(PIVOT_TAB);
   await pivot.firstRowTotal.click();
   await expect.poll(() => rawDataDialog.table.rowCountValue()).toBeLessThan(SALES_CSV.rowCount);
   expect(await rawDataDialog.table.rowCountValue()).toBeGreaterThan(0);
   await recording.caption('Drill-downs keep working');

   await rawDataDialog.close();
   await recording.caption('Send the file to anyone – no server, no account');

   await recording.save();
});
