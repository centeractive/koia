import { DataType } from 'app/shared/model/data-type.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { DASHBOARD_TAB_TITLES, PIVOT_TABLE_TAB_TITLES } from 'app/shared/services/view-tabs/tab-titles';
import { TabBar } from './support/components/tab-bar';
import { expect, test } from './support/fixtures';
import { columnValuesOf, dashboardTabOf, firstColumnOf, fruitSalesOf, pivotTabOf } from './support/fruit-sales-sample';
import { RawDataPage } from './support/pages/raw-data-page';
import { activateSceneInNewPage } from './support/scene-activation';
import { Texts } from './support/texts';

const RENAMED_TITLE = 'Fruit revenue';
const en = new Texts('en');
const sample = fruitSalesOf('en');
const filterColumn = firstColumnOf(sample, DataType.TEXT);
const filterValue: string = sample.entries[0][filterColumn];
const matchingCount = columnValuesOf<string>(sample, filterColumn).filter(v => v.toLowerCase().includes(filterValue.toLowerCase())).length;

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

test('deleted saved view is no longer offered for restoring', async ({ page, rawData, notifications, manageViewsDialog }) => {
   await rawData.mainToolbar.saveView('Gone');
   await notifications.dismiss(StatusType.SUCCESS);

   await rawData.mainToolbar.manageViews();
   await manageViewsDialog.delete(0);
   await notifications.dismiss(StatusType.SUCCESS);

   await rawData.mainToolbar.openRestoreMenu();
   await expect(rawData.mainToolbar.savedViewItems).toHaveCount(0);
   await expect(page.locator('#menuItemOpenSceneFile')).toBeVisible();
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

test('linking filters on raw data gives the pivot table and the dashboard the same filters once they are opened', async ({ rawData, tabBar, pivot, dashboard }) => {
   await rawData.mainToolbar.addValueFilter(filterColumn, filterValue);

   await rawData.mainToolbar.toggleLinkedFilters();

   await tabBar.open(pivotTabOf(sample).id);
   await expect(pivot.mainToolbar.valueFilterInputs).toHaveValue(filterValue);
   await expect(pivot.mainToolbar.linkFiltersToggle).toHaveAttribute('aria-pressed', 'true');
   await tabBar.open(dashboardTabOf(sample).id);
   await expect(dashboard.mainToolbar.valueFilterInputs).toHaveValue(filterValue);
});

test('changing a filter on the pivot table while filters are linked reduces the raw data rows', async ({ rawData, tabBar, pivot }) => {
   await rawData.mainToolbar.toggleLinkedFilters();
   await tabBar.open(pivotTabOf(sample).id);

   await pivot.mainToolbar.addValueFilter(filterColumn, filterValue);

   await tabBar.openRawData();
   await expect(rawData.mainToolbar.valueFilterInputs).toHaveValue(filterValue);
   await expect(rawData.table.rowCount).toHaveText(en.rows(matchingCount));
});

test('after unlinking, every tab keeps the linked filters and then changes them on its own', async ({ rawData, tabBar, pivot, dashboard }) => {
   await rawData.mainToolbar.addValueFilter(filterColumn, filterValue);
   await rawData.mainToolbar.toggleLinkedFilters();
   await tabBar.open(pivotTabOf(sample).id);
   await expect(pivot.mainToolbar.valueFilterInputs).toHaveValue(filterValue);

   await pivot.mainToolbar.toggleLinkedFilters();

   await tabBar.open(dashboardTabOf(sample).id);
   await expect(dashboard.mainToolbar.valueFilterInputs).toHaveValue(filterValue);
   await expect(dashboard.mainToolbar.linkFiltersToggle).toHaveAttribute('aria-pressed', 'false');
   await dashboard.mainToolbar.removeValueFilter();
   await expect(dashboard.mainToolbar.valueFilterInputs).toHaveCount(0);
   await tabBar.openRawData();
   await expect(rawData.mainToolbar.valueFilterInputs).toHaveValue(filterValue);
});

test('linked filters are remembered after reloading the page', async ({ context, rawData }) => {
   await rawData.mainToolbar.addValueFilter(filterColumn, filterValue);

   await rawData.mainToolbar.toggleLinkedFilters();

   await expect(async () => {
      const page = await context.newPage();
      try {
         await activateSceneInNewPage(page, fruitSalesSampleOf('en').sceneName);
         const reloadedRawData = new RawDataPage(page);
         await expect(reloadedRawData.mainToolbar.linkFiltersToggle).toHaveAttribute('aria-pressed', 'true', { timeout: 5_000 });
         await expect(reloadedRawData.mainToolbar.valueFilterInputs).toHaveValue(filterValue, { timeout: 5_000 });
      } finally {
         await page.close();
      }
   }).toPass({ timeout: 60_000 });
});

test('restoring a saved view brings back its linked filters', async ({ rawData, notifications, confirmDialog }) => {
   await rawData.mainToolbar.addValueFilter(filterColumn, filterValue);
   await rawData.mainToolbar.toggleLinkedFilters();
   await rawData.mainToolbar.saveView('Linked');
   await notifications.dismiss(StatusType.SUCCESS);
   await rawData.mainToolbar.toggleLinkedFilters();

   await rawData.mainToolbar.restoreView('Linked');
   await confirmDialog.confirm();

   await expect(rawData.mainToolbar.linkFiltersToggle).toHaveAttribute('aria-pressed', 'true');
   await expect(rawData.mainToolbar.valueFilterInputs).toHaveValue(filterValue);
});
