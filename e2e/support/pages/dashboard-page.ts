import { Locator, Page } from '@playwright/test';
import { DashboardSideBar } from '../components/dashboard-side-bar';
import { DashboardTile } from '../components/dashboard-tile';
import { ADD_SUMMARY_BUTTON, ViewLauncherDialog } from '../components/dialogs';
import { ViewToolbar } from '../components/view-toolbar';

export class DashboardPage {

   readonly tiles: Locator;
   readonly launcher: ViewLauncherDialog;
   readonly sideBar: DashboardSideBar;
   readonly viewToolbar: ViewToolbar;
   readonly snapToGridButton: Locator;
   readonly gridContent: Locator;
   readonly flexContent: Locator;
   readonly resizePreview: Locator;
   private readonly toolbar: Locator;

   constructor(page: Page) {
      const root = page.locator('koia-dashboard');
      this.tiles = root.locator('.div_tile');
      this.launcher = new ViewLauncherDialog(page);
      this.sideBar = new DashboardSideBar(root);
      this.toolbar = root.locator('koia-view-toolbar');
      this.viewToolbar = new ViewToolbar(this.toolbar);
      this.snapToGridButton = root.locator('#but_snap_to_grid');
      this.gridContent = root.locator('#div_grid');
      this.flexContent = root.locator('#div_flex');
      this.resizePreview = root.locator('.div_grid_resize_preview');
   }

   async addSummary(): Promise<void> {
      await this.toolbar.locator(ADD_SUMMARY_BUTTON).click();
   }

   tile(index: number): DashboardTile {
      return new DashboardTile(this.tiles.nth(index));
   }
}
