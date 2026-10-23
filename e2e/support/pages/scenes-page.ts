import { Locator, Page } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { Notifications } from '../components/notifications';

export class ScenesPage {

   readonly title: Locator;
   readonly rows: Locator;
   readonly editNameInput: Locator;
   readonly editDescriptionInput: Locator;
   readonly editNameError: Locator;
   readonly saveEditButton: Locator;
   readonly editRow: Locator;
   readonly tableContainer: Locator;
   private readonly notifications: Notifications;

   constructor(private readonly page: Page) {
      this.title = page.locator('koia-page-frame .page_title');
      this.rows = page.locator('#mat_card_scenes tr.mat-mdc-row');
      this.editNameInput = page.locator('.edit_name input');
      this.editDescriptionInput = page.locator('.edit_desc input');
      this.editNameError = page.locator('.edit_name mat-error');
      this.saveEditButton = page.locator('.but_save_edit');
      this.editRow = page.locator('.edit_row');
      this.tableContainer = page.locator('koia-scene-table .table_container');
      this.notifications = new Notifications(page);
   }

   async filter(text: string): Promise<void> {
      await this.page.locator('#div_filter input').fill(text);
   }

   async activate(sceneName: string): Promise<void> {
      await this.row(sceneName).locator('.activateScene').click();
      await this.page.waitForURL('**/' + Route.RAWDATA);
   }

   /**
    * @returns the success message
    */
   async delete(sceneName: string): Promise<string> {
      await this.row(sceneName).locator('.but_more').click();
      await this.page.locator('.menu_item_delete').click();
      return this.notifications.dismiss(StatusType.SUCCESS);
   }

   async startEdit(sceneName: string): Promise<void> {
      await this.row(sceneName).locator('.but_more').click();
      await this.page.locator('.menu_item_edit').click();
   }

   /**
    * @returns the success message
    */
   async edit(sceneName: string, name: string, description?: string): Promise<string> {
      await this.startEdit(sceneName);
      await this.editNameInput.fill(name);
      if (description !== undefined) {
         await this.editDescriptionInput.fill(description);
      }
      await this.saveEditButton.click();
      return this.notifications.dismiss(StatusType.SUCCESS);
   }

   private row(sceneName: string): Locator {
      return this.rows.filter({ hasText: sceneName });
   }
}
