import { StatusType } from 'app/shared/model/status-type.enum';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { expect, test } from '../support/fixtures';
import { SALES_CSV } from '../support/import-files';
import { openSalesScene, SALES_SCENE_DESCRIPTION, SALES_SCENE_NAME } from '../support/sales-scene';
import { VideoRecording } from './support/video-recording';

const PIVOT_TAB_ID = 'tab1';
const DASHBOARD_TAB_ID = 'tab2';
const DASHBOARD_TITLE = 'Sales overview';
const VIEW_NAME = 'Overview';

test('managing scenes and navigating', async ({ page, front, scene, scenes, rawData, tabBar, dashboard, notifications,
   confirmDialog }) => {
   const recording = new VideoRecording(page, 'scenes-and-navigation');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addPivotTable();
   await recording.caption('Add a pivot table as a new tab');

   await tabBar.addDashboard();
   await dashboard.launcher.generateDashboard();
   await dashboard.tiles.first().waitFor();
   await recording.caption('Or add a dashboard – Koia can generate it');

   await tabBar.rename(tabBar.tab(DASHBOARD_TAB_ID), DASHBOARD_TITLE);
   await recording.caption('Double-click a tab to rename it');

   await dashboard.mainToolbar.saveView(VIEW_NAME);
   await notifications.dismiss(StatusType.SUCCESS);
   await recording.caption('Save the view to restore it later');

   await tabBar.close(tabBar.tab(PIVOT_TAB_ID));
   await recording.caption('Close tabs you no longer need');

   await dashboard.mainToolbar.restoreView(VIEW_NAME);
   await confirmDialog.confirm();
   await expect(tabBar.tab(PIVOT_TAB_ID)).toHaveCount(1);
   await dashboard.tiles.first().waitFor();
   await recording.caption('Restore the view to get closed tabs back');

   await dashboard.mainToolbar.openFront();
   await recording.caption('Home leads back to the front page');

   await front.openSample();
   await recording.caption('Try the sample data as a second scene');

   await rawData.mainToolbar.openScenes();
   await recording.caption('The scenes button lists all your scenes');

   await scenes.filter('csv');
   await recording.caption('Filter scenes by name or description');

   await scenes.edit(SALES_CSV.name, SALES_SCENE_NAME, SALES_SCENE_DESCRIPTION);
   await recording.caption('Rename or describe a scene in place');

   await scenes.filter('');
   await scenes.activate(SALES_SCENE_NAME);
   await recording.caption('Activate a scene to switch to its data');

   await tabBar.open(DASHBOARD_TAB_ID);
   await dashboard.tiles.first().waitFor();
   await recording.caption('Its tabs come back as you left them');

   await dashboard.mainToolbar.openScenes();
   await scenes.delete(fruitSalesSampleOf('en').sceneName);
   await recording.caption('Delete scenes you no longer need');

   await recording.save();
});
