import { Locator, Page } from '@playwright/test';

export class ConnectionDialog {

   readonly rememberPassword: Locator;
   readonly riskNote: Locator;

   constructor(private readonly page: Page) {
      this.rememberPassword = page.locator('#remember_password input');
      this.riskNote = page.locator('.risk_note');
   }

   async connectToPort(port: number): Promise<void> {
      await this.page.locator('#port').fill(String(port));
      await this.page.locator('#but_ok').click();
   }

   async typeHost(host: string): Promise<void> {
      await this.page.locator('#host').fill(host);
   }

   async cancel(): Promise<void> {
      await this.page.locator('#but_cancel').click();
   }
}
