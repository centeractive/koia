import { expect, Locator } from '@playwright/test';

export class DashboardTile {

   readonly title: Locator;
   readonly firstCountLink: Locator;
   readonly graphRootNode: Locator;
   readonly marginButton: Locator;
   readonly margin: Locator;

   constructor(readonly root: Locator) {
      this.title = root.locator('textarea.textarea_title');
      this.firstCountLink = root.locator('td.td_aggregation a').first();
      this.graphRootNode = root.locator('koia-graph svg g.nodes > g > circle').first();
      this.marginButton = root.locator('.but_element_margin');
      this.margin = root.locator('.div_margins');
   }

   async configure(): Promise<void> {
      await this.root.locator('.but_element_configure').click();
   }

   async expectChartPainted(): Promise<void> {
      await expect.poll(() => this.paintedPixelCount()).toBeGreaterThan(0);
   }

   async saveAs(menuItem: string): Promise<void> {
      await this.root.locator('.but_more').click();
      await this.root.page().getByRole('menuitem', { name: menuItem, exact: true }).click();
   }

   async setColumnSpan(menuItem: string): Promise<void> {
      await this.root.locator('.but_more').click();
      await this.root.page().locator('.menu_item_column_span').click();
      await this.root.page().getByRole('menuitem', { name: menuItem, exact: true }).click();
   }

   async remove(): Promise<void> {
      await this.root.locator('.but_close').click();
      await this.root.waitFor({ state: 'detached' });
   }

   private paintedPixelCount(): Promise<number> {
      return this.root.locator('canvas').evaluate((c: HTMLCanvasElement) => {
         const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
         let count = 0;
         for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) {
               count++;
            }
         }
         return count;
      });
   }
}
