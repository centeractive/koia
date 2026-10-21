import { expect, Locator } from '@playwright/test';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { pressCenterAndMoveBy } from '../pointer';

export class DashboardSideBar {

   private readonly sidenav: Locator;
   private readonly backdrop: Locator;
   private readonly fadingBackdrop: Locator;
   private readonly content: Locator;

   constructor(dashboard: Locator) {
      this.sidenav = dashboard.locator('mat-sidenav');
      this.backdrop = dashboard.locator('.mat-drawer-backdrop.mat-drawer-shown');
      this.fadingBackdrop = dashboard.locator('.mat-drawer-backdrop');
      this.content = dashboard.locator('mat-sidenav-content');
   }

   chartTypeButton(chartType: ChartType): Locator {
      return this.sidenav.locator('.but_chart_type').nth(ChartType.ALL.indexOf(chartType));
   }

   dataColumnButton(name: string): Locator {
      return this.sidenav.locator('#div_sel_data_columns').getByRole('button', { name, exact: true });
   }

   async selectColumn(name: string): Promise<void> {
      await this.dataColumnButton(name).click();
   }

   async createComputedColumn(): Promise<void> {
      await this.sidenav.locator('.but_create_computed_column').click();
   }

   /**
    * @param editLabel the accessible name of the edit button of the computed column
    */
   async editComputedColumn(editLabel: string): Promise<void> {
      await this.sidenav.getByRole('button', { name: editLabel, exact: true }).click();
   }

   /**
    * expands the panel unless it is expanded already, a click on the header of an expanded panel collapses it
    */
   async toggle(panelTitle: string, label: string): Promise<void> {
      await this.expand(this.sidenav.locator('mat-expansion-panel-header')
         .filter({ has: this.sidenav.page().getByText(panelTitle, { exact: true }) }));
      await this.sidenav.getByRole('switch', { name: label, exact: true }).click();
   }

   private async expand(header: Locator): Promise<void> {
      if (await header.getAttribute('aria-expanded') !== 'true') {
         await header.click();
      }
   }

   /**
    * the group-by select of the chart, its text is available while its panel is collapsed
    */
   groupByField(): Locator {
      return this.sidenav.locator('.field-row mat-select').first();
   }

   /**
    * @param label the label of the aggregation radio button (e.g. 'Count Rows')
    */
   async chooseAggregation(label: string): Promise<void> {
      await this.sidenav.getByRole('radio', { name: label, exact: true }).check();
   }

   async selectValueAggregation(label: string): Promise<void> {
      await this.selectOption(this.sidenav.locator('.field_value_aggregation'), label);
   }

   /**
    * expands the panel of the time unit field unless it is expanded already
    */
   async selectTimeUnit(label: string): Promise<void> {
      const panel = this.sidenav.locator('mat-expansion-panel').filter({ has: this.sidenav.page().locator('.field_time_unit') });
      await this.expand(panel.locator('mat-expansion-panel-header'));
      await this.selectOption(panel.locator('.field_time_unit'), label);
   }

   private async selectOption(field: Locator, label: string): Promise<void> {
      await field.locator('mat-select').click();
      await this.sidenav.page().getByRole('option', { name: label, exact: true }).click();
   }

   /**
    * expands the hierarchy panel of the summary table unless it is expanded already and drops the available column into the
    * selected group-by columns
    */
   async dragGroupByColumn(name: string): Promise<void> {
      const page = this.sidenav.page();
      const selected = this.sidenav.locator('#selectedGroupByColumns');
      const panel = this.sidenav.locator('mat-expansion-panel').filter({ has: page.locator('#selectedGroupByColumns') });
      await this.expand(panel.locator('mat-expansion-panel-header'));
      const column = panel.locator('.div_column_list:not(#selectedGroupByColumns) koia-draggable-column')
         .filter({ has: page.getByText(name, { exact: true }) });
      const from = await column.boundingBox();
      const to = await selected.boundingBox();
      await pressCenterAndMoveBy(column, to.x + to.width / 2 - (from.x + from.width / 2),
         to.y + to.height / 2 - (from.y + from.height / 2));
      await page.mouse.up();
      await expect(selected.getByText(name, { exact: true })).toBeVisible();
   }

   async switchChartType(chartType: ChartType): Promise<void> {
      await this.chartTypeButton(chartType).click();
   }

   /**
    * the side bar is opened in push mode, its backdrop covers the elements
    */
   async close(): Promise<void> {
      await this.backdrop.click();
      await this.sidenav.waitFor({ state: 'hidden' });
      await expect(this.content).toHaveCSS('margin-left', '0px');
      await expect(this.fadingBackdrop).toBeHidden();
   }
}
