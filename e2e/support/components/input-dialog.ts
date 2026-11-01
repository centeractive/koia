import { Locator, Page } from '@playwright/test';

export class InputDialog {

   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-input-dialog');
   }

   async submit(input: string): Promise<void> {
      await this.root.locator('input#host').fill(input);
      await this.root.locator('#but_ok').click();
      await this.root.waitFor({ state: 'detached' });
   }
}
