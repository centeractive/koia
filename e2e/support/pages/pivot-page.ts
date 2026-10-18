import { Locator, Page } from '@playwright/test';
import { ViewToolbar } from '../components/view-toolbar';

export class PivotPage {

   readonly valueCells: Locator;
   readonly heatmapCells: Locator;
   readonly rowLabels: Locator;
   readonly rowTotals: Locator;
   readonly firstRowTotal: Locator;
   readonly rowTotalsButton: Locator;
   readonly sideBarHeader: Locator;
   readonly configurationSelects: Locator;
   readonly fieldChips: Locator;
   readonly availableFieldsZone: Locator;
   readonly selectedFieldsZones: Locator;
   readonly viewToolbar: ViewToolbar;
   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-pivot-table');
      this.valueCells = this.root.locator('table.pvtTable td.pvtVal');
      this.heatmapCells = this.root.locator('table.pvtTable td.pvtVal[style*="background-color"]');
      this.rowLabels = this.root.locator('table.pvtTable th.pvtRowLabel');
      this.rowTotals = this.root.locator('table.pvtTable td.pvtTotal.rowTotal');
      this.firstRowTotal = this.rowTotals.first();
      this.rowTotalsButton = this.root.locator('#but_row_totals');
      this.sideBarHeader = this.root.locator('koia-pivot-table-side-bar koia-side-bar-header .div_accordion_options');
      this.configurationSelects = this.root.locator('.pvtUi select');
      this.fieldChips = this.root.locator('span.pvtAttr');
      this.availableFieldsZone = this.root.locator('td.pvtUnused');
      this.selectedFieldsZones = this.root.locator('td.pvtVals, td.pvtCols, td.pvtRows');
      this.viewToolbar = new ViewToolbar(this.root.locator('koia-view-toolbar'));
   }

   async selectRenderer(name: string): Promise<void> {
      await this.root.locator('select.pvtRenderer').selectOption(name);
   }

   async setTimeUnit(column: string, timeUnitLabel: string): Promise<void> {
      await this.root.locator('#but_time_unit').click();
      await this.root.page().getByRole('menuitem', { name: column, exact: true }).click();
      await this.root.page().getByRole('menuitem', { name: timeUnitLabel, exact: true }).click();
   }

   async openValueGrouping(): Promise<void> {
      await this.root.locator('#but_value_grouping').click();
      await this.root.locator('koia-pivot-table-side-bar .div_add_group').waitFor();
   }
}
