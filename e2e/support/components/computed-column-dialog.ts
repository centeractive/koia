import { Locator, Page } from '@playwright/test';

export class ComputedColumnDialog {

   readonly nameInput: Locator;
   readonly formula: Locator;
   readonly example: Locator;
   private readonly root: Locator;

   constructor(private readonly page: Page) {
      this.root = page.locator('koia-computed-column-dialog');
      this.nameInput = this.root.locator('#input_name');
      this.formula = this.root.locator('#span_formula');
      this.example = this.root.locator('#span_example');
   }

   async fillName(name: string): Promise<void> {
      await this.nameInput.fill(name);
   }

   selectLeftColumn(column: string): Promise<void> {
      return this.select('#select_left_column', column);
   }

   selectOperator(operatorLabel: string): Promise<void> {
      return this.select('#select_operator', operatorLabel);
   }

   selectRightColumn(column: string): Promise<void> {
      return this.select('#select_right_column', column);
   }

   ok(): Promise<void> {
      return this.close('#but_ok');
   }

   cancel(): Promise<void> {
      return this.close('#but_cancel');
   }

   async delete(): Promise<void> {
      await this.root.locator('#but_delete').click();
   }

   private async select(select: string, option: string): Promise<void> {
      await this.root.locator(select).click();
      await this.page.getByRole('option', { name: option, exact: true }).click();
   }

   private async close(button: string): Promise<void> {
      await this.root.locator(button).click();
      await this.root.waitFor({ state: 'detached' });
   }
}
