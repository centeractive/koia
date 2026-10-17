import { Locator, Page } from '@playwright/test';
import { Route } from 'app/shared/model/route.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { Notifications } from '../components/notifications';

export class ScenesPage {

   readonly title: Locator;
   readonly rows: Locator;
   private readonly notifications: Notifications;

   constructor(private readonly page: Page) {
      this.title = page.locator('#mat_card_all_scenes mat-card-title');
      this.rows = page.locator('#mat_card_all_scenes tr.mat-mdc-row');
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

   private row(sceneName: string): Locator {
      return this.rows.filter({ hasText: sceneName });
   }
}
