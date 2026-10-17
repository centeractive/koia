import { expect, Locator, Page } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';
import { InputDialog } from './dialogs';

export class TabBar {

   readonly rawDataTitle: Locator;
   readonly viewTabs: Locator;
   readonly titles: Locator;

   constructor(private readonly page: Page) {
      this.rawDataTitle = page.locator('#tabRawData .tab_label > span');
      this.viewTabs = page.locator('a[id^="tab-"]');
      this.titles = this.viewTabs.locator('.tab_label > span');
   }

   tab(id: string): Locator {
      return this.page.locator('#tab-' + id);
   }

   lastTab(): Locator {
      return this.viewTabs.last();
   }

   async open(id: string): Promise<void> {
      await this.tab(id).click();
      await this.page.waitForURL('**/' + Route.VIEW + '/' + id);
   }

   addPivotTable(): Promise<void> {
      return this.addTab('#menuItemNewPivotTable');
   }

   addDashboard(): Promise<void> {
      return this.addTab('#menuItemNewDashboard');
   }

   async rename(tab: Locator, title: string): Promise<void> {
      await tab.dblclick();
      await new InputDialog(this.page).submit(title);
   }

   /**
    * the close icon is visible on the active and the hovered tab only
    */
   async close(tab: Locator): Promise<void> {
      await tab.hover();
      await tab.locator('.icon_close_tab').click();
   }

   /**
    * the add button is enabled once the persisted tabs are loaded, hence they are counted after opening its menu
    */
   private async addTab(menuItem: string): Promise<void> {
      await this.page.locator('#butAddTab').click();
      const count = await this.viewTabs.count();
      await this.page.locator(menuItem).click();
      await expect(this.viewTabs).toHaveCount(count + 1);
   }
}
