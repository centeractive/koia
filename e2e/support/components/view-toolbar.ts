import { Locator } from '@playwright/test';

export class ViewToolbar {

   readonly moreButton: Locator;

   constructor(private readonly root: Locator) {
      this.moreButton = root.locator('.but_view_more');
   }

   async chooseMoreMenuItem(name: string): Promise<void> {
      await this.moreButton.click();
      await this.root.page().getByRole('menuitem', { name, exact: true }).click();
   }
}
