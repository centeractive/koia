import { Locator, Page } from '@playwright/test';
import { MainToolbar } from '../components/main-toolbar';
import { PagingToggles } from '../components/paging-toggles';
import { ViewToolbar } from '../components/view-toolbar';

export class PivotPage {

   private static readonly HEATMAP_CELL = 'table.pvtTable td.pvtVal[style*="background-color"]';

   readonly table: Locator;
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
   readonly mainToolbar: MainToolbar;
   readonly viewToolbar: ViewToolbar;
   readonly pagingToggles: PagingToggles;
   readonly sheets: Locator;
   readonly sheetHeatmapCells: Locator;
   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-pivot-table');
      this.table = this.root.locator('#pivot table.pvtTable');
      this.valueCells = this.root.locator('table.pvtTable td.pvtVal');
      this.heatmapCells = this.root.locator(PivotPage.HEATMAP_CELL);
      this.rowLabels = this.root.locator('table.pvtTable th.pvtRowLabel');
      this.rowTotals = this.root.locator('table.pvtTable td.pvtTotal.rowTotal');
      this.firstRowTotal = this.rowTotals.first();
      this.rowTotalsButton = this.root.locator('#but_row_totals');
      this.sideBarHeader = this.root.locator('koia-pivot-table-side-bar koia-side-bar-header .div_accordion_options');
      this.configurationSelects = this.root.locator('.pvtUi select');
      this.fieldChips = this.root.locator('span.pvtAttr');
      this.availableFieldsZone = this.root.locator('td.pvtUnused');
      this.selectedFieldsZones = this.root.locator('td.pvtVals, td.pvtCols, td.pvtRows');
      this.mainToolbar = new MainToolbar(this.root.locator('koia-main-toolbar'));
      this.viewToolbar = new ViewToolbar(this.root.locator('koia-view-toolbar'));
      this.pagingToggles = new PagingToggles(this.root.locator('koia-paging-toggles'));
      this.sheets = this.root.locator('koia-table-sheets .div_canvas_sheet');
      this.sheetHeatmapCells = this.sheets.locator(PivotPage.HEATMAP_CELL);
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
