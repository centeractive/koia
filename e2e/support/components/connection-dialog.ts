import { Page } from '@playwright/test';

export class ConnectionDialog {

   constructor(private readonly page: Page) { }

   async connectToPort(port: number): Promise<void> {
      await this.page.locator('#port').fill(String(port));
      await this.page.locator('#but_ok').click();
   }
}
