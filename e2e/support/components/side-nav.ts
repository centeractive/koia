import { expect, Locator } from '@playwright/test';

export class SideNav {

   protected readonly sidenav: Locator;
   private readonly backdrop: Locator;
   private readonly fadingBackdrop: Locator;
   private readonly content: Locator;

   constructor(view: Locator) {
      this.sidenav = view.locator('mat-sidenav');
      this.backdrop = view.locator('.mat-drawer-backdrop.mat-drawer-shown');
      this.fadingBackdrop = view.locator('.mat-drawer-backdrop');
      this.content = view.locator('mat-sidenav-content');
   }

   /**
    * its backdrop covers the elements
    */
   async close(): Promise<void> {
      await this.backdrop.click();
      await this.sidenav.waitFor({ state: 'hidden' });
      await expect(this.content).toHaveCSS('margin-left', '0px');
      await expect(this.fadingBackdrop).toBeHidden();
   }
}
