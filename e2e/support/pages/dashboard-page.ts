import { Locator, Page } from '@playwright/test';
import { DashboardSideBar } from '../components/dashboard-side-bar';
import { DashboardTile } from '../components/dashboard-tile';
import { ViewLauncherDialog } from '../components/dialogs';
import { ViewToolbar } from '../components/view-toolbar';

export class DashboardPage {

   readonly tiles: Locator;
   readonly launcher: ViewLauncherDialog;
   readonly sideBar: DashboardSideBar;
   readonly viewToolbar: ViewToolbar;

   constructor(page: Page) {
      const root = page.locator('koia-dashboard');
      this.tiles = root.locator('.div_tile');
      this.launcher = new ViewLauncherDialog(page);
      this.sideBar = new DashboardSideBar(root);
      this.viewToolbar = new ViewToolbar(root.locator('koia-view-toolbar'));
   }

   tile(index: number): DashboardTile {
      return new DashboardTile(this.tiles.nth(index));
   }
}
