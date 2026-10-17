import { Locator } from '@playwright/test';
import { ChartType } from 'app/shared/model/chart/chart-type';

export class DashboardSideBar {

   private readonly sidenav: Locator;
   private readonly backdrop: Locator;

   constructor(dashboard: Locator) {
      this.sidenav = dashboard.locator('mat-sidenav');
      this.backdrop = dashboard.locator('.mat-drawer-backdrop.mat-drawer-shown');
   }

   chartTypeButton(chartType: ChartType): Locator {
      return this.sidenav.locator('.but_chart_type').nth(ChartType.ALL.indexOf(chartType));
   }

   async selectColumn(name: string): Promise<void> {
      await this.sidenav.locator('#div_sel_data_columns').getByRole('button', { name, exact: true }).click();
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
   }
}
