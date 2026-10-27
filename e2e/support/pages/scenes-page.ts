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
   readonly moreButtons: Locator;
   readonly filterInput: Locator;
   readonly deleteAllButton: Locator;
   readonly cancelButton: Locator;
   readonly continueButton: Locator;
   readonly activateButtons: Locator;
   readonly activeChips: Locator;
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
      this.moreButtons = page.locator('.but_more');
      this.filterInput = page.locator('#div_filter .filter input');
      this.deleteAllButton = page.locator('#but_delete_scenes');
      this.cancelButton = page.locator('#but_cancel');
      this.continueButton = page.locator('.continueActiveScene');
      this.activateButtons = page.locator('.activateScene');
      this.activeChips = page.locator('.active-chip');
      this.notifications = new Notifications(page);
   }

   async filter(text: string): Promise<void> {
      await this.filterInput.fill(text);
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

   async share(sceneName: string): Promise<void> {
      await this.row(sceneName).locator('.but_more').click();
      await this.page.locator('.menu_item_share').click();
   }

   async openSceneFile(path: string): Promise<void> {
      await this.page.locator('#scene_file_input').setInputFiles(path);
      await this.page.waitForURL('**/' + Route.RAWDATA);
   }

   async showDetails(sceneName: string): Promise<void> {
      await this.row(sceneName).locator('.but_more').click();
      await this.page.locator('.menu_item_details').click();
   }

   async continueActive(): Promise<void> {
      await this.continueButton.click();
      await this.page.waitForURL('**/' + Route.RAWDATA);
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
