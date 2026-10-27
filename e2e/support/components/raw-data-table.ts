import { Locator } from '@playwright/test';

export class RawDataTable {

   readonly rowCount: Locator;
   readonly headers: Locator;
   readonly headerCells: Locator;

   constructor(private readonly root: Locator) {
      this.rowCount = root.locator('.row-count');
      this.headers = root.locator('.vt-th-label');
      this.headerCells = root.locator('.vt-th');
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

   row(index: number): Locator {
      return this.root.locator(`.vt-row[data-index="${index}"]`);
   }

   async cell(rowIndex: number, column: string): Promise<Locator> {
      await this.headers.first().waitFor();
      const columnIndex = (await this.headers.allTextContents()).indexOf(column);
      return this.row(rowIndex).locator('.vt-td').nth(columnIndex);
   }

   header(column: string): Locator {
      return this.headerCells.filter({ has: this.root.page().getByText(column, { exact: true }) });
   }
}
