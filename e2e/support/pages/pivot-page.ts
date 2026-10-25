import { expect, Locator, Page } from '@playwright/test';
import * as _ from 'lodash';
import { MainToolbar } from '../components/main-toolbar';
import { PagingToggles } from '../components/paging-toggles';
import { SideNav } from '../components/side-nav';
import { ViewToolbar } from '../components/view-toolbar';
import { dragCenterOnto } from '../pointer';

export class PivotPage {

   private static readonly HEATMAP_CELL = 'table.pvtTable td.pvtVal[style*="background-color"]';
   private static readonly FIELD_CHIP = 'span.pvtAttr';

   readonly table: Locator;
   readonly valueCells: Locator;
   readonly heatmapCells: Locator;
   readonly rowLabels: Locator;
   readonly rowTotals: Locator;
   readonly firstRowTotal: Locator;
   readonly rowTotalsButton: Locator;
   readonly columnTotals: Locator;
   readonly columnTotalsButton: Locator;
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
   private readonly rowsZone: Locator;
   private readonly columnsZone: Locator;
   private readonly valueGroupingButton: Locator;
   private readonly sideNav: SideNav;
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
      this.columnTotals = this.root.locator('table.pvtTable td.pvtTotal.colTotal');
      this.columnTotalsButton = this.root.locator('#but_column_totals');
      this.sideBarHeader = this.root.locator('koia-pivot-table-side-bar koia-side-bar-header .div_accordion_options');
      this.configurationSelects = this.root.locator('.pvtUi select');
      this.fieldChips = this.root.locator(PivotPage.FIELD_CHIP);
      this.availableFieldsZone = this.root.locator('td.pvtUnused');
      this.selectedFieldsZones = this.root.locator('td.pvtVals, td.pvtCols, td.pvtRows');
      this.mainToolbar = new MainToolbar(this.root.locator('koia-main-toolbar'));
      this.viewToolbar = new ViewToolbar(this.root.locator('koia-view-toolbar'));
      this.pagingToggles = new PagingToggles(this.root.locator('koia-paging-toggles'));
      this.sheets = this.root.locator('koia-table-sheets .div_canvas_sheet');
      this.sheetHeatmapCells = this.sheets.locator(PivotPage.HEATMAP_CELL);
      this.rowsZone = this.root.locator('td.pvtRows');
      this.columnsZone = this.root.locator('td.pvtCols');
      this.valueGroupingButton = this.root.locator('#but_value_grouping');
      this.sideNav = new SideNav(this.root);
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
      await this.valueGroupingButton.click();
      await this.root.locator('koia-pivot-table-side-bar .div_add_group').waitFor();
   }

   dragFieldToRows(name: string): Promise<void> {
      return this.dragField(name, this.rowsZone);
   }

   dragFieldToColumns(name: string): Promise<void> {
      return this.dragField(name, this.columnsZone);
   }

   /**
    * selects the aggregator by its untranslated name and its single attribute, e.g. Sum over Revenue
    */
   async chooseAggregator(aggregatorName: string, attribute: string): Promise<void> {
      await this.root.locator('select.pvtAggregator').selectOption(aggregatorName);
      await this.root.locator('select.pvtAttrDropdown').selectOption(attribute);
   }

   /**
    * the side bar offers adding a grouping only while a number column is not grouped, hence the panel is awaited instead
    */
   async removeValueGrouping(panelTitle: string): Promise<void> {
      await this.valueGroupingButton.click();
      const panel = this.root.locator('koia-pivot-table-side-bar koia-expansion-panel')
         .filter({ has: this.root.page().getByText(panelTitle, { exact: true }) });
      await panel.locator('.but_delete_panel').click();
      await expect(panel).toHaveCount(0);
      await this.sideNav.close();
      await expect(this.root.locator('mat-progress-bar[color="accent"]')).toBeHidden();
   }

   /**
    * moves the field chip by pointer moves, as the jQuery UI sortable of the pivot table expects
    */
   private async dragField(name: string, zone: Locator): Promise<void> {
      await dragCenterOnto(this.fieldChip(this.root, name), zone);
      await expect(this.fieldChip(zone, name)).toBeVisible();
   }

   /**
    * the chip text ends with the triangle opening its value filter
    */
   private fieldChip(container: Locator, name: string): Locator {
      return container.locator(PivotPage.FIELD_CHIP).filter({ hasText: new RegExp('^' + _.escapeRegExp(name) + ' ▾$') });
   }
}
