import { Page } from '@playwright/test';
import { StatusType } from 'app/shared/model/status-type.enum';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { DASHBOARD_TAB_TITLES, PIVOT_TABLE_TAB_TITLES } from 'app/shared/services/view-tabs/tab-titles';
import { TabBar } from './support/components/tab-bar';
import { expect, test } from './support/fixtures';
import { fruitSalesOf, pivotTabOf } from './support/fruit-sales-sample';
import { FrontPage } from './support/pages/front-page';
import { ScenesPage } from './support/pages/scenes-page';
import { Texts } from './support/texts';

const RENAMED_TITLE = 'Fruit revenue';
const en = new Texts('en');
const sample = fruitSalesOf('en');

test.beforeEach(async ({ front }) => {
   await front.open('en');
   await front.openSample();
});

test('new pivot table and dashboard tabs get the default titles of the current language', async ({ tabBar, dashboard }) => {
   await tabBar.addPivotTable();
   await tabBar.addDashboard();
   await dashboard.launcher.cancel();

   await expect(tabBar.titles).toHaveText([...sample.tabs.map(tab => tab.title), PIVOT_TABLE_TAB_TITLES.en, DASHBOARD_TAB_TITLES.en]);
});

test('closing a tab with content asks for confirmation', async ({ tabBar, confirmDialog }) => {
   const tab = pivotTabOf(sample);

   await tabBar.close(tabBar.tab(tab.id));
   const question = await confirmDialog.confirm();

   expect(question).toBe(en.get('toolbar.tabs.closeQuestion', { title: tab.title }));
   await expect(tabBar.tab(tab.id)).toHaveCount(0);
});

test('restoring saved view brings back closed tab after confirmation', async ({ rawData, tabBar, notifications, confirmDialog }) => {
   await rawData.mainToolbar.saveView('All');
   await notifications.dismiss(StatusType.SUCCESS);
   await tabBar.close(tabBar.tab('tab1'));
   await confirmDialog.confirm();

   await rawData.mainToolbar.restoreView('All');
   const question = await confirmDialog.confirm();

   expect(question).toBe(en.get('view.restoreQuestion', { name: 'All' }));
   await expect(tabBar.tab('tab1')).toHaveCount(1);
});

test('restoring saved view needs no confirmation when open tabs have no content', async ({ rawData, pivot, tabBar, notifications, confirmDialog }) => {
   await tabBar.close(tabBar.tab('tab1'));
   await confirmDialog.confirm();
   await tabBar.close(tabBar.tab('tab2'));
   await confirmDialog.confirm();
   await rawData.mainToolbar.saveView('Empty');
   await notifications.dismiss(StatusType.SUCCESS);
   await tabBar.addPivotTable();

   await pivot.mainToolbar.restoreView('Empty');

   await expect(tabBar.viewTabs).toHaveCount(0);
   await expect(confirmDialog.root).toHaveCount(0);
});

test('deleted saved view is no longer offered for restoring', async ({ rawData, notifications, manageViewsDialog }) => {
   await rawData.mainToolbar.saveView('Gone');
   await notifications.dismiss(StatusType.SUCCESS);

   await rawData.mainToolbar.manageViews();
   await manageViewsDialog.delete(0);
   await notifications.dismiss(StatusType.SUCCESS);

   await expect(rawData.mainToolbar.restoreViewButton).toBeDisabled();
});

test('renamed tab is restored when its scene is activated in a new browser tab', async ({ context, tabBar }) => {
   await tabBar.addPivotTable();

   await tabBar.rename(tabBar.lastTab(), RENAMED_TITLE);

   await expect(async () => {
      const page = await context.newPage();
      try {
         await activateSceneInNewPage(page, fruitSalesSampleOf('en').sceneName);
         await expect(new TabBar(page).titles).toContainText([RENAMED_TITLE], { timeout: 5_000 });
      } finally {
         await page.close();
      }
   }).toPass({ timeout: 60_000 });
});

/**
 * the active scene lives in memory only, a new page activates it from the database while the first page completes its writes
 */
async function activateSceneInNewPage(page: Page, sceneName: string): Promise<void> {
   const front = new FrontPage(page);
   await front.open('en');
   await front.continueWithScenes();
   await new ScenesPage(page).activate(sceneName);
}
