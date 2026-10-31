import { test as base } from '@playwright/test';
import { ID_COLUMN_STORAGE_KEY } from 'app/scene/id-column-storage-key';
import { ComputedColumnDialog } from './components/computed-column-dialog';
import { ConnectionDialog } from './components/connection-dialog';
import { ConfirmDialog, ManageViewsDialog, RawDataDialog } from './components/dialogs';
import { LanguageSelect } from './components/language-select';
import { Notifications } from './components/notifications';
import { SceneDetailsDialog } from './components/scene-details-dialog';
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
   computedColumnDialog: ComputedColumnDialog;
   manageViewsDialog: ManageViewsDialog;
   connectionDialog: ConnectionDialog;
   sceneDetailsDialog: SceneDetailsDialog;
}

export interface RecordingOptions {
   /**
    * presets the ID column toggle of the scene page off unless a choice is remembered, so that imports keep their source columns only
    */
   idColumnOffAtFirst: boolean;
   /**
    * lets tooltips under the motionless recording pointer pass clicks through and clips the side nav containers, which Playwright
    * would otherwise scroll sideways when scrolling a clicked element into view
    */
   recordingStyles: boolean;
}

/**
 * aborts requests of all pages to foreign origins, hence Koia cannot reach any CouchDB and uses the empty IndexedDB of the fresh browser context
 */
export const test = base.extend<PageObjects & RecordingOptions>({
   idColumnOffAtFirst: [true, { option: true }],
   recordingStyles: [false, { option: true }],
   context: async ({ context, baseURL, idColumnOffAtFirst, recordingStyles }, use) => {
      const appOrigin = new URL(baseURL).origin;
      await context.route(url => url.origin !== appOrigin, route => route.abort());
      if (idColumnOffAtFirst) {
         await context.addInitScript(key => {
            if (localStorage.getItem(key) === null) {
               localStorage.setItem(key, 'false');
            }
         }, ID_COLUMN_STORAGE_KEY);
      }
      if (recordingStyles) {
         await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => {
            const style = document.createElement('style');
            style.textContent = '.mat-mdc-tooltip-panel, .mat-mdc-tooltip-panel * { pointer-events: none !important; }'
               + ' .mat-drawer-container { overflow: clip !important; }';
            document.head.appendChild(style);
         }));
      }
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
   computedColumnDialog: async ({ page }, use) => use(new ComputedColumnDialog(page)),
   manageViewsDialog: async ({ page }, use) => use(new ManageViewsDialog(page)),
   connectionDialog: async ({ page }, use) => use(new ConnectionDialog(page)),
   sceneDetailsDialog: async ({ page }, use) => use(new SceneDetailsDialog(page))
});

export { expect } from '@playwright/test';
