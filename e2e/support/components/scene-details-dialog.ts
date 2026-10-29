import { Locator, Page } from '@playwright/test';
import { StatusType } from 'app/shared/model/status-type.enum';
import { Notifications } from './notifications';

/**
 * the scene details dialog opened from the scenes page, where pattern columns can be added
 */
export class SceneDetailsDialog {

   readonly root: Locator;
   readonly columnNames: Locator;
   readonly addPatternButtons: Locator;
   readonly successNotification: Locator;
   private readonly notifications: Notifications;

   constructor(page: Page) {
      this.root = page.locator('koia-scene-details-dialog');
      this.columnNames = this.root.locator('#columns_table .column-name');
      this.addPatternButtons = this.root.locator('#columns_table .but_add_pattern');
      this.notifications = new Notifications(page);
      this.successNotification = this.notifications.pane(StatusType.SUCCESS);
   }

   /**
    * @returns the success message shown once the pattern column is added
    */
   async addPattern(columnName: string): Promise<string> {
      await this.startAddingPattern(columnName);
      return this.patternAddedMessage();
   }

   async startAddingPattern(columnName: string): Promise<void> {
      await this.root.locator('#columns_table tr.mat-mdc-row')
         .filter({ has: this.root.page().locator('.column-name', { hasText: new RegExp('^' + columnName + '$') }) })
         .locator('.but_add_pattern')
         .click();
   }

   /**
    * @returns the success message shown once the pattern column is added, after dismissing it
    */
   patternAddedMessage(): Promise<string> {
      return this.notifications.dismiss(StatusType.SUCCESS);
   }

   async close(): Promise<void> {
      await this.root.locator('koia-dialog-close-button button').click();
      await this.root.waitFor({ state: 'detached' });
   }
}
