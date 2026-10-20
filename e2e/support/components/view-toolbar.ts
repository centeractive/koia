import { Locator } from '@playwright/test';

export class ViewToolbar {

   constructor(private readonly root: Locator) { }

   async chooseMoreMenuItem(name: string): Promise<void> {
      await this.root.locator('.but_view_more').click();
      await this.root.page().getByRole('menuitem', { name, exact: true }).click();
   }
}
