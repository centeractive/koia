import { Locator } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';
import { RangeFilter } from './range-filter';

export class MainToolbar {

   readonly addFilterButton: Locator;
   readonly rangeFilterPanel: Locator;

   constructor(private readonly root: Locator) {
      this.addFilterButton = root.locator('.but_add_col_filter');
      this.rangeFilterPanel = root.locator('.div_range_filters');
   }

   async addValueFilter(column: string, value: string): Promise<void> {
      await this.addFilterButton.click();
      await this.root.page().getByRole('menuitem', { name: column, exact: true }).click();
      const input = this.root.locator('.column_filter_input').last();
      await input.fill(value);
      await input.press('Enter');
   }

   async removeValueFilter(): Promise<void> {
      await this.root.locator('button.but_remove_column_filter').last().click();
   }

   async addRangeFilter(column: string, valueRangeLabel: string): Promise<RangeFilter> {
      await this.addFilterButton.click();
      await this.root.page().getByRole('menuitem', { name: column, exact: true }).click();
      await this.root.page().getByRole('menuitem', { name: valueRangeLabel, exact: true }).click();
      const rangeFilter = this.root.locator('koia-range-filter').last();
      await rangeFilter.waitFor();
      return new RangeFilter(rangeFilter);
   }

   async openScenes(): Promise<void> {
      await this.root.locator('#butScenes').click();
      await this.root.page().waitForURL('**/' + Route.SCENES);
   }

   async addScene(): Promise<void> {
      await this.root.locator('#butScene').click();
      await this.root.page().waitForURL('**/' + Route.SCENE);
   }
}
