import { Locator, Page } from '@playwright/test';
import { DashboardSideBar } from '../components/dashboard-side-bar';
import { DashboardTile } from '../components/dashboard-tile';
import { ADD_SUMMARY_BUTTON, ViewLauncherDialog } from '../components/dialogs';
import { ViewToolbar } from '../components/view-toolbar';

export class DashboardPage {

   readonly tiles: Locator;
   readonly summaryTables: Locator;
   readonly chartTiles: Locator;
   readonly launcher: ViewLauncherDialog;
   readonly sideBar: DashboardSideBar;
   readonly viewToolbar: ViewToolbar;
   readonly snapToGridButton: Locator;
   readonly gridContent: Locator;
   readonly flexContent: Locator;
   readonly resizePreview: Locator;
   private readonly root: Locator;
   private readonly toolbar: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-dashboard');
      this.tiles = this.root.locator('.div_tile');
      this.summaryTables = this.tiles.locator('koia-summary-table');
      this.chartTiles = this.tiles.filter({ has: page.locator('koia-chart') });
      this.launcher = new ViewLauncherDialog(page);
      this.sideBar = new DashboardSideBar(this.root);
      this.toolbar = this.root.locator('koia-view-toolbar');
      this.viewToolbar = new ViewToolbar(this.toolbar);
      this.snapToGridButton = this.root.locator('#but_snap_to_grid');
      this.gridContent = this.root.locator('#div_grid');
      this.flexContent = this.root.locator('#div_flex');
      this.resizePreview = this.root.locator('.div_grid_resize_preview');
   }

   async addSummary(): Promise<void> {
      await this.toolbar.locator(ADD_SUMMARY_BUTTON).click();
   }

   tile(index: number): DashboardTile {
      return new DashboardTile(this.tiles.nth(index));
   }

   async regenerate(): Promise<void> {
      await this.root.locator('#but_regenerate_dashboard').click();
   }

   async occupiedCellCount(): Promise<number> {
      const spans = await Promise.all((await this.tiles.all()).map(t => new DashboardTile(t).spans()));
      return spans.reduce((sum, s) => sum + s.columns * s.rows, 0);
   }

   /**
    * @returns the width of the grid scroll container and the width a vertical scrollbar takes when shown
    */
   scrollerWidth(): Promise<{ offsetWidth: number; scrollbarWidth: number }> {
      return this.root.locator('#div_grid').evaluate((container: HTMLElement) => {
         const probe = document.createElement('div');
         probe.style.cssText = 'position: absolute; top: -9999px; width: 100px; height: 100px; overflow: scroll;';
         document.body.appendChild(probe);
         const scrollbarWidth = probe.offsetHeight - probe.clientHeight;
         probe.remove();
         return { offsetWidth: container.offsetWidth, scrollbarWidth };
      });
   }

   /**
    * @returns the computed track sizes of the grid and the width of the vertical scrollbar of its scroll container
    */
   gridTracks(): Promise<{ rowHeight: number; columnWidths: number[]; scrollbarWidth: number }> {
      return this.root.locator('#div_grid').evaluate((container: HTMLElement) => {
         const style = getComputedStyle(container.querySelector(':scope > div'));
         return {
            rowHeight: parseFloat(style.gridAutoRows),
            columnWidths: style.gridTemplateColumns.split(' ').map(parseFloat),
            scrollbarWidth: container.offsetWidth - container.clientWidth
         };
      });
   }
}
