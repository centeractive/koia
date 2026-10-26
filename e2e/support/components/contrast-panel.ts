import { Locator } from '@playwright/test';

/**
 * the Explain button of a raw data view and the panel with the column values over-represented in its rows
 */
export class ContrastPanel {

   readonly explainButton: Locator;
   readonly findings: Locator;
   readonly skipped: Locator;
   readonly message: Locator;

   constructor(rawData: Locator) {
      this.explainButton = rawData.locator('#but_explain');
      const panel = rawData.locator('koia-contrast-panel');
      this.findings = panel.locator('.contrast-finding');
      this.skipped = panel.locator('.contrast-skipped');
      this.message = panel.locator('.contrast-message');
   }

   async explain(): Promise<void> {
      await this.explainButton.click();
   }
}
