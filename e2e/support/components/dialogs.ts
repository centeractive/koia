import { Locator, Page } from '@playwright/test';
import { RawDataTable } from './raw-data-table';

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

export class ConfirmDialog {

   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-confirm-dialog');
   }

   /**
    * @returns the question, the first button (Yes) confirms
    */
   async confirm(): Promise<string> {
      const question = await this.root.locator('mat-card-content > div').first().innerText();
      await this.root.locator('#div_buttons button').first().click();
      await this.root.waitFor({ state: 'detached' });
      return question.trim();
   }
}

export const ADD_SUMMARY_BUTTON = 'button:has(mat-icon[svgicon="add_summary"])';

export class ViewLauncherDialog {

   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-view-launcher-dialog');
   }

   addChart(): Promise<void> {
      return this.choose(this.root.locator('button:has(mat-icon[svgicon="add_chart"])'));
   }

   addSummary(): Promise<void> {
      return this.choose(this.root.locator(ADD_SUMMARY_BUTTON));
   }

   addGraph(): Promise<void> {
      return this.choose(this.root.locator('button:has(mat-icon[svgicon="add_graph"])'));
   }

   cancel(): Promise<void> {
      return this.choose(this.root.locator('#but_cancel'));
   }

   private async choose(button: Locator): Promise<void> {
      await button.click();
      await this.root.waitFor({ state: 'detached' });
   }
}

export class RawDataDialog {

   readonly table: RawDataTable;

   constructor(page: Page) {
      this.table = new RawDataTable(page.locator('koia-raw-data-dialog koia-raw-data'));
   }
}
