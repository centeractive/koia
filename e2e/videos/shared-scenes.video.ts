import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { basename } from 'path';
import { downloadOf, sceneFileName } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { SALES_CSV } from '../support/import-files';
import { openSalesScene, SALES_SCENE_DESCRIPTION, SALES_SCENE_NAME } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { FileDialogKind } from './support/file-dialog';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const sample = appLogsSampleOf('en');
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
   await recording.caption('Build a scene with several views');

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows('Region');
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
   const file = testInfo.outputPath(download.suggestedFilename());
   await download.saveAs(file);
   await recording.fileDialog(FileDialogKind.SAVE, download.suggestedFilename());
   await recording.caption('Share as file saves the scene with all its views in one .koia file');

   await dashboard.mainToolbar.openScenes();
   await scenes.activate(sample.sceneName);
   await expect(rawData.table.rowCount).toHaveText(en.rows(sample.rowCount));
   await recording.caption('Switch to another scene');

   await tabBar.open(PIVOT_TAB);
   await pivot.firstRowTotal.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(100));
   await recording.caption('Work there as usual');

   await rawDataDialog.close();
   await pivot.mainToolbar.openScenes();
   await scenes.delete(SALES_SCENE_NAME);
   await expect(scenes.rows).toHaveCount(1);
   await recording.caption('Even a deleted scene is not lost…');

   await scenes.openSceneFile(file, () => recording.fileDialog(FileDialogKind.OPEN, basename(file)));
   await expect(rawData.table.rowCount).toHaveText(en.rows(SALES_CSV.rowCount));
   await recording.caption('…open the shared file to get it back');

   await expect(tabBar.titles).toHaveText([PIVOT_TITLE, DASHBOARD_TITLE]);
   await recording.caption('My sales is back under its own name, with all its views');

   await tabBar.open(DASHBOARD_TAB);
   await dashboard.tiles.first().waitFor();
   await recording.caption('Every view comes back as it was saved');
   await recording.caption('Send the file to anyone – no server, no account');

   await recording.save();
});
