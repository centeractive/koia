import { Locator } from '@playwright/test';
import { InputDialog } from './dialogs';

export class ViewToolbar {

   constructor(private readonly root: Locator) { }

   async chooseMoreMenuItem(name: string): Promise<void> {
      await this.root.locator('.but_view_more').click();
      await this.root.page().getByRole('menuitem', { name, exact: true }).click();
   }

   async saveView(name: string): Promise<void> {
      await this.root.locator('#but_save_view').click();
      await new InputDialog(this.root.page()).submit(name);
   }

   async restoreView(name: string): Promise<void> {
      await this.root.locator('#but_restore_view').click();
      await this.root.page().locator('.menu_item_details').filter({ hasText: name }).click();
   }
}
