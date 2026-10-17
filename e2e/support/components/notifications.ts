import { Locator, Page } from '@playwright/test';
import { StatusType } from 'app/shared/model/status-type.enum';

export class Notifications {

   constructor(private readonly page: Page) { }

   pane(type: StatusType): Locator {
      return this.page.locator('.cdk-overlay-pane.' + type);
   }

   /**
    * @returns the message of the notification, which is not dismissed automatically and blocks the page with its backdrop
    */
   async dismiss(type: StatusType): Promise<string> {
      const pane = this.pane(type);
      const message = await pane.innerText();
      await this.page.keyboard.press('Escape');
      await pane.waitFor({ state: 'detached' });
      return message.trim();
   }
}
