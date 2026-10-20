import { test as base } from '@playwright/test';
import { ConfirmDialog, ManageViewsDialog, RawDataDialog } from './components/dialogs';
import { LanguageSelect } from './components/language-select';
import { Notifications } from './components/notifications';
import { TabBar } from './components/tab-bar';
import { DashboardPage } from './pages/dashboard-page';
import { FrontPage } from './pages/front-page';
import { PivotPage } from './pages/pivot-page';
import { RawDataPage } from './pages/raw-data-page';
import { ScenePage } from './pages/scene-page';
import { ScenesPage } from './pages/scenes-page';

interface PageObjects {
   front: FrontPage;
   scene: ScenePage;
   scenes: ScenesPage;
   rawData: RawDataPage;
   rawDataDialog: RawDataDialog;
   tabBar: TabBar;
   pivot: PivotPage;
   dashboard: DashboardPage;
   languageSelect: LanguageSelect;
   notifications: Notifications;
   confirmDialog: ConfirmDialog;
   manageViewsDialog: ManageViewsDialog;
}

/**
 * aborts requests of all pages to foreign origins, hence Koia cannot reach any CouchDB and uses the empty IndexedDB of the fresh browser context
 */
export const test = base.extend<PageObjects>({
   context: async ({ context, baseURL }, use) => {
      const appOrigin = new URL(baseURL).origin;
      await context.route(url => url.origin !== appOrigin, route => route.abort());
      await use(context);
   },
   front: async ({ page }, use) => use(new FrontPage(page)),
   scene: async ({ page }, use) => use(new ScenePage(page)),
   scenes: async ({ page }, use) => use(new ScenesPage(page)),
   rawData: async ({ page }, use) => use(new RawDataPage(page)),
   rawDataDialog: async ({ page }, use) => use(new RawDataDialog(page)),
   tabBar: async ({ page }, use) => use(new TabBar(page)),
   pivot: async ({ page }, use) => use(new PivotPage(page)),
   dashboard: async ({ page }, use) => use(new DashboardPage(page)),
   languageSelect: async ({ page }, use) => use(new LanguageSelect(page)),
   notifications: async ({ page }, use) => use(new Notifications(page)),
   confirmDialog: async ({ page }, use) => use(new ConfirmDialog(page)),
   manageViewsDialog: async ({ page }, use) => use(new ManageViewsDialog(page))
});

export { expect } from '@playwright/test';
