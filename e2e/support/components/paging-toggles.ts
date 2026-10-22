import { Locator } from '@playwright/test';

export class PagingToggles {

   readonly monitorButton: Locator;
   readonly landscapeButton: Locator;
   readonly portraitButton: Locator;
   readonly printButton: Locator;

   constructor(root: Locator) {
      this.monitorButton = root.locator('#but_monitor_view');
      this.landscapeButton = root.locator('#but_landscape_pages');
      this.portraitButton = root.locator('#but_portrait_pages');
      this.printButton = root.locator('#but_print');
   }

   get buttons(): Locator[] {
      return [this.monitorButton, this.landscapeButton, this.portraitButton];
   }
}
