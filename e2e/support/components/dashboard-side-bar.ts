import { expect, Locator } from '@playwright/test';
import { ChartType } from 'app/shared/model/chart/chart-type';

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
      const header = this.sidenav.locator('mat-expansion-panel-header')
         .filter({ has: this.sidenav.page().getByText(panelTitle, { exact: true }) });
      if (await header.getAttribute('aria-expanded') !== 'true') {
         await header.click();
      }
      await this.sidenav.getByRole('switch', { name: label, exact: true }).click();
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
