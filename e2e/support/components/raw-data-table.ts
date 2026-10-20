import { Locator } from '@playwright/test';

export class RawDataTable {

   readonly rowCount: Locator;
   readonly headers: Locator;

   constructor(private readonly root: Locator) {
      this.rowCount = root.locator('.row-count');
      this.headers = root.locator('.vt-th-label');
   }

   /**
    * @returns NaN as long as the rows are not counted
    */
   async rowCountValue(): Promise<number> {
      const digits = (await this.rowCount.innerText()).replace(/\D/g, '');
      return digits ? Number(digits) : NaN;
   }

   sortIndicator(column: string): Locator {
      return this.header(column).locator('.vt-sort');
   }

   async sortBy(column: string): Promise<void> {
      await this.header(column).click();
   }

   async cell(rowIndex: number, column: string): Promise<Locator> {
      await this.headers.first().waitFor();
      const columnIndex = (await this.headers.allTextContents()).indexOf(column);
      return this.root.locator(`.vt-row[data-index="${rowIndex}"] .vt-td`).nth(columnIndex);
   }

   header(column: string): Locator {
      return this.root.locator('.vt-th').filter({ has: this.root.page().getByText(column, { exact: true }) });
   }
}
