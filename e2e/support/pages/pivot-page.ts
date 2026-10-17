import { Locator, Page } from '@playwright/test';
import { ViewToolbar } from '../components/view-toolbar';

export class PivotPage {

   readonly valueCells: Locator;
   readonly heatmapCells: Locator;
   readonly rowLabels: Locator;
   readonly firstRowTotal: Locator;
   readonly viewToolbar: ViewToolbar;
   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-pivot-table');
      this.valueCells = this.root.locator('table.pvtTable td.pvtVal');
      this.heatmapCells = this.root.locator('table.pvtTable td.pvtVal[style*="background-color"]');
      this.rowLabels = this.root.locator('table.pvtTable th.pvtRowLabel');
      this.firstRowTotal = this.root.locator('table.pvtTable td.pvtTotal.rowTotal').first();
      this.viewToolbar = new ViewToolbar(this.root.locator('koia-view-toolbar'));
   }

   async selectRenderer(name: string): Promise<void> {
      await this.root.locator('select.pvtRenderer').selectOption(name);
   }

   async setTimeUnit(column: string, timeUnitLabel: string): Promise<void> {
      await this.root.locator('button.but_config:has(mat-icon:text-is("timer"))').click();
      await this.root.page().getByRole('menuitem', { name: column, exact: true }).click();
      await this.root.page().getByRole('menuitem', { name: timeUnitLabel, exact: true }).click();
   }
}
