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

   readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-confirm-dialog');
   }

   /**
    * @returns the question, the first button (Yes) confirms
    */
   confirm(): Promise<string> {
      return this.press(0);
   }

   /**
    * @returns the question, the second button (No) declines
    */
   decline(): Promise<string> {
      return this.press(1);
   }

   private async press(buttonIndex: number): Promise<string> {
      const question = await this.root.locator('mat-card-content > div').first().innerText();
      await this.root.locator('#div_buttons button').nth(buttonIndex).click();
      await this.root.waitFor({ state: 'detached' });
      return question.trim();
   }
}

export class ManageViewsDialog {

   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-manageView-dialog');
   }

   async delete(index: number): Promise<void> {
      await this.root.locator('#butDelete-' + index).click();
      await this.root.locator('#but_ok').click();
      await this.root.waitFor({ state: 'detached' });
   }
}

export const ADD_CHART_BUTTON = 'button:has(mat-icon[svgicon="add_chart"])';
export const ADD_GRAPH_BUTTON = 'button:has(mat-icon[svgicon="add_graph"])';
export const ADD_SUMMARY_BUTTON = 'button:has(mat-icon[svgicon="add_summary"])';

export class ViewLauncherDialog {

   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-view-launcher-dialog');
   }

   addChart(): Promise<void> {
      return this.choose(this.root.locator(ADD_CHART_BUTTON));
   }

   addSummary(): Promise<void> {
      return this.choose(this.root.locator(ADD_SUMMARY_BUTTON));
   }

   addGraph(): Promise<void> {
      return this.choose(this.root.locator(ADD_GRAPH_BUTTON));
   }

   generateDashboard(): Promise<void> {
      return this.choose(this.root.locator('#but_generate_dashboard'));
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
   private readonly root: Locator;

   constructor(page: Page) {
      this.root = page.locator('koia-raw-data-dialog');
      this.table = new RawDataTable(this.root.locator('koia-raw-data'));
   }

   async close(): Promise<void> {
      await this.root.locator('#but_close_dialog').click();
      await this.root.waitFor({ state: 'detached' });
   }
}
