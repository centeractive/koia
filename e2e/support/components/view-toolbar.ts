import { Locator } from '@playwright/test';

export class ViewToolbar {

   readonly moreButton: Locator;

   constructor(private readonly root: Locator) {
      this.moreButton = root.locator('.but_view_more');
   }

   async chooseMoreMenuItem(name: string): Promise<void> {
      await this.moreButton.click();
      await this.menuItem(name).click();
   }

   /**
    * opens the submenu by its item of the more menu and chooses the item of the submenu
    */
   async chooseMoreSubmenuItem(submenu: string, name: string): Promise<void> {
      await this.chooseMoreMenuItem(submenu);
      await this.menuItem(name).click();
   }

   private menuItem(name: string): Locator {
      return this.root.page().getByRole('menuitem', { name, exact: true });
   }
}
