import { StatusType } from 'app/shared/model/status-type.enum';
import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { expect, test } from '../support/fixtures';
import { SALES_CSV } from '../support/import-files';
import { openSalesScene, SALES_SCENE_DESCRIPTION, SALES_SCENE_NAME } from '../support/sales-scene';
import { VideoRecording } from './support/video-recording';

const PIVOT_TAB_ID = 'tab1';
const DASHBOARD_TAB_ID = 'tab2';
const DASHBOARD_TITLE = 'Sales overview';
const VIEW_NAME = 'Overview';

test('managing scenes and navigating', async ({ page, front, scene, scenes, rawData, tabBar, pivot, dashboard, notifications,
   confirmDialog }) => {
   const recording = new VideoRecording(page, 'scenes-and-navigation');
   await openSalesScene(front, scene, scenes);
   await rawData.mainToolbar.openFront();
   await front.openSample();
   await rawData.mainToolbar.openScenes();
   await scenes.activate(SALES_CSV.name);
   recording.markStart();

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await recording.caption('Add a pivot table as a new tab');

   await pivot.dragFieldToRows('Region');
   await pivot.dragFieldToColumns('Channel');
   await recording.caption('Drag fields into its rows and columns');

   await tabBar.addDashboard();
   await dashboard.launcher.generateDashboard();
   await dashboard.tiles.first().waitFor();
   await recording.caption('Or add a dashboard – Koia can generate it');

   await tabBar.rename(tabBar.tab(DASHBOARD_TAB_ID), DASHBOARD_TITLE);
   await recording.caption('Double-click a tab to rename it');

   await dashboard.mainToolbar.saveView(VIEW_NAME);
   await notifications.dismiss(StatusType.SUCCESS);
   await recording.caption('Save your tabs as a view to restore them later');

   await tabBar.close(tabBar.tab(PIVOT_TAB_ID));
   await confirmDialog.confirm();
   await recording.caption('Close tabs you no longer need');

   await dashboard.mainToolbar.restoreView(VIEW_NAME);
   await confirmDialog.confirm();
   await expect(tabBar.tab(PIVOT_TAB_ID)).toHaveCount(1);
   await dashboard.tiles.first().waitFor();
   await recording.caption('Restore the view to get closed tabs back');

   await dashboard.mainToolbar.openFront();
   await recording.caption('Front Page leads back to the start page');

   await front.openLogSample();
   await recording.caption('Open the log sample as another scene – with tabs of its own');

   await rawData.mainToolbar.openScenes();
   await recording.caption('The scenes button lists all your scenes');

   await scenes.edit(SALES_CSV.name, SALES_SCENE_NAME, SALES_SCENE_DESCRIPTION);
   await recording.caption('Rename or describe a scene in place');

   await scenes.typeFilter('sal');
   await expect(scenes.rows).toHaveCount(2);
   await recording.caption('Type to filter scenes by name or description');

   await scenes.typeFilter('es of');
   await expect(scenes.rows).toHaveCount(1);
   await recording.caption('Every letter narrows the list');

   await scenes.filter('');
   await scenes.activate(SALES_SCENE_NAME);
   await expect(tabBar.titles).toContainText([DASHBOARD_TITLE]);
   await recording.caption('Activate a scene to switch to its data');

   await tabBar.open(DASHBOARD_TAB_ID);
   await dashboard.tiles.first().waitFor();
   await recording.caption('Each scene keeps its own tabs');

   await dashboard.mainToolbar.openScenes();
   await scenes.delete(appLogsSampleOf('en').sceneName);
   await recording.caption('Delete scenes you no longer need');

   await recording.save();
});
