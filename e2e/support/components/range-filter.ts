import { Locator } from '@playwright/test';
import { pressCenterAndMoveBy } from '../pointer';

export class RangeFilter {

   constructor(private readonly root: Locator) { }

   /**
    * the keyboard moves the pointer deterministically, unlike dragging that depends on the slider width
    */
   async moveMinToMax(): Promise<void> {
      await this.root.locator('.ngx-slider-pointer-min').press('End');
   }

   /**
    * drags the left end by the units of the slider: values of a number column, time units of a time column
    */
   async dragMinBy(units: number): Promise<void> {
      await this.dragBy(this.root.locator('.ngx-slider-pointer-min'), units);
   }

   /**
    * drags the bar between both ends by the units of the slider: values of a number column, time units of a time column
    */
   async dragRangeBy(units: number): Promise<void> {
      await this.dragBy(this.root.locator('.ngx-slider-selection-bar'), units);
   }

   async remove(): Promise<void> {
      await this.root.locator('button.but_remove_range_filter').click();
   }

   private async dragBy(grip: Locator, units: number): Promise<void> {
      const pointer = this.root.locator('.ngx-slider-pointer-min');
      const floor = Number(await pointer.getAttribute('aria-valuemin'));
      const ceil = Number(await pointer.getAttribute('aria-valuemax'));
      const barWidth = (await this.root.locator('.ngx-slider-full-bar').boundingBox()).width;
      const handleWidth = (await pointer.boundingBox()).width;
      await pressCenterAndMoveBy(grip, units * (barWidth - handleWidth) / (ceil - floor), 0);
      await this.root.page().mouse.up();
   }
}
