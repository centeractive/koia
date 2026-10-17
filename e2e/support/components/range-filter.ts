import { Locator } from '@playwright/test';

export class RangeFilter {

   constructor(private readonly root: Locator) { }

   /**
    * the keyboard moves the pointer deterministically, unlike dragging that depends on the slider width
    */
   async moveMinToMax(): Promise<void> {
      await this.root.locator('.ngx-slider-pointer-min').press('End');
   }

   async remove(): Promise<void> {
      await this.root.locator('button.but_remove_range_filter').click();
   }
}
