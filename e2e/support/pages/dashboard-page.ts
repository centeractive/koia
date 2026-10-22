import { expect, Locator, Page } from '@playwright/test';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { DashboardSideBar } from '../components/dashboard-side-bar';
import { DashboardTile } from '../components/dashboard-tile';
import { ADD_CHART_BUTTON, ADD_GRAPH_BUTTON, ADD_SUMMARY_BUTTON, ViewLauncherDialog } from '../components/dialogs';
import { MainToolbar } from '../components/main-toolbar';
import { TextBox } from '../components/text-box';
import { ViewToolbar } from '../components/view-toolbar';

export class DashboardPage {

   readonly tiles: Locator;
   readonly summaryTables: Locator;
   readonly summaryTiles: Locator;
   readonly chartTiles: Locator;
   readonly textBoxTiles: Locator;
   readonly launcher: ViewLauncherDialog;
   readonly sideBar: DashboardSideBar;
   readonly mainToolbar: MainToolbar;
   readonly viewToolbar: ViewToolbar;
   readonly snapToGridButton: Locator;
   readonly freeCanvasButton: Locator;
   readonly landscapePagesButton: Locator;
   readonly portraitPagesButton: Locator;
   readonly sheets: Locator;
   readonly gridContent: Locator;
   readonly canvasContent: Locator;
   readonly canvasGuide: Locator;
   readonly resizePreview: Locator;
   private readonly root: Locator;
   private readonly toolbar: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-dashboard');
      this.tiles = this.root.locator('.div_tile');
      this.summaryTables = this.tiles.locator('koia-summary-table');
      this.summaryTiles = this.tiles.filter({ has: page.locator('koia-summary-table') });
      this.chartTiles = this.tiles.filter({ has: page.locator('koia-chart') });
      this.textBoxTiles = this.tiles.filter({ has: page.locator('koia-text-box') });
      this.launcher = new ViewLauncherDialog(page);
      this.sideBar = new DashboardSideBar(this.root);
      this.mainToolbar = new MainToolbar(this.root.locator('koia-main-toolbar'));
      this.toolbar = this.root.locator('koia-view-toolbar');
      this.viewToolbar = new ViewToolbar(this.toolbar);
      this.snapToGridButton = this.root.locator('#but_snap_to_grid');
      this.freeCanvasButton = this.root.locator('#but_free_canvas');
      this.landscapePagesButton = this.root.locator('#but_landscape_pages');
      this.portraitPagesButton = this.root.locator('#but_portrait_pages');
      this.sheets = this.root.locator('.div_canvas_sheet');
      this.gridContent = this.root.locator('#div_grid');
      this.canvasContent = this.root.locator('#div_canvas');
      this.canvasGuide = this.root.locator('.div_canvas_guide');
      this.resizePreview = this.root.locator('.div_resize_preview');
   }

   async addChart(): Promise<void> {
      await this.toolbar.locator(ADD_CHART_BUTTON).click();
   }

   async addGraph(): Promise<void> {
      await this.toolbar.locator(ADD_GRAPH_BUTTON).click();
   }

   async addSummary(): Promise<void> {
      await this.toolbar.locator(ADD_SUMMARY_BUTTON).click();
   }

   async addSummaries(count: number): Promise<void> {
      for (let i = 0; i < count; i++) {
         await this.addSummary();
         await this.sideBar.close();
      }
   }

   addTextTile(): Promise<TextBox> {
      return this.addTextBox('#but_add_text_tile');
   }

   addNote(): Promise<TextBox> {
      return this.addTextBox('#but_add_note');
   }

   private async addTextBox(button: string): Promise<TextBox> {
      const count = await this.textBoxTiles.count();
      await this.toolbar.locator(button).click();
      await expect(this.textBoxTiles).toHaveCount(count + 1);
      return this.textBox(count);
   }

   /**
    * presses the empty bottom right corner of the shown content, which ends editing of any text box
    */
   async pressOutsideTextBoxes(): Promise<void> {
      const content = (await this.gridContent.isVisible()) ? this.gridContent : this.canvasContent;
      const box = await content.boundingBox();
      await content.click({ position: { x: box.width - 20, y: box.height - 20 } });
   }

   async setGridColumns(menuItem: string): Promise<void> {
      await this.chooseMoreMenuItem('#menuItemGridColumns', menuItem);
   }

   async setGridCellRatio(menuItem: string): Promise<void> {
      await this.chooseMoreMenuItem('#menuItemGridCellRatio', menuItem);
   }

   private async chooseMoreMenuItem(subMenuItem: string, menuItem: string): Promise<void> {
      await this.toolbar.locator('.but_view_more').click();
      await this.root.page().locator(subMenuItem).click();
      await this.root.page().getByRole('menuitem', { name: menuItem, exact: true }).click();
   }

   /**
    * @returns the screen pixels per page unit of the free canvas, measured at the content of its first page
    */
   async canvasScale(pageFormat = PageFormat.LANDSCAPE): Promise<number> {
      const content = await this.canvasContent.locator('.div_canvas_page_content').first().boundingBox();
      return content.width / pageFormat.width;
   }

   /**
    * @returns the screen pixels per page unit of the grid
    */
   gridScale(): Promise<number> {
      return this.gridContent.locator('.div_grid_cells').evaluate((cells: HTMLElement) => cells.clientWidth / 1400);
   }

   tile(index: number): DashboardTile {
      return new DashboardTile(this.tiles.nth(index));
   }

   textBox(index: number): TextBox {
      return new TextBox(this.textBoxTiles.nth(index));
   }

   async regenerate(): Promise<void> {
      await this.root.locator('#but_regenerate_dashboard').click();
   }

   async generatedGridColumns(): Promise<number> {
      await this.tiles.first().waitFor();
      return (await this.gridTracks()).columnWidths.length;
   }

   async occupiedCellCount(): Promise<number> {
      const spans = await Promise.all((await this.tiles.all()).map(t => new DashboardTile(t).spans()));
      return spans.reduce((sum, s) => sum + s.columns * s.rows, 0);
   }

   /**
    * @returns the width of the grid scroll container and the width a vertical scrollbar takes when shown
    */
   scrollerWidth(): Promise<{ offsetWidth: number; scrollbarWidth: number }> {
      return this.gridContent.evaluate((container: HTMLElement) => {
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
      return this.gridContent.evaluate((container: HTMLElement) => {
         const style = getComputedStyle(container.querySelector(':scope > div'));
         return {
            rowHeight: parseFloat(style.gridAutoRows),
            columnWidths: style.gridTemplateColumns.split(' ').map(parseFloat),
            scrollbarWidth: container.offsetWidth - container.clientWidth
         };
      });
   }
}
