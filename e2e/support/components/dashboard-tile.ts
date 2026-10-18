import { expect, Locator } from '@playwright/test';
import { pressCenterAndMoveBy } from '../pointer';

export interface RenderedCellStyle {
   fontWeight: number;
   fontSize: number;
   fontFamily: string;
   letterSpacing: number;
   horizontalPadding: number;
}

export class DashboardTile {

   readonly title: Locator;
   readonly firstCountLink: Locator;
   readonly graphRootNode: Locator;
   readonly marginButton: Locator;
   readonly margin: Locator;

   constructor(readonly root: Locator) {
      this.title = root.locator('textarea.textarea_title');
      this.firstCountLink = root.locator('td.td_aggregation a').first();
      this.graphRootNode = root.locator('koia-graph svg g.nodes > g > circle').first();
      this.marginButton = root.locator('.but_element_margin');
      this.margin = root.locator('.div_margins');
   }

   async configure(): Promise<void> {
      await this.root.locator('.but_element_configure').click();
   }

   async expectChartPainted(): Promise<void> {
      await expect.poll(() => this.paintedPixelCount()).toBeGreaterThan(0);
   }

   spans(): Promise<{ columns: number; rows: number }> {
      return this.root.evaluate((e: HTMLElement) => {
         const style = getComputedStyle(e);
         const spanOf = (end: string) => Number(/span (\d+)/.exec(end)?.[1] ?? 1);
         return { columns: spanOf(style.gridColumnEnd), rows: spanOf(style.gridRowEnd) };
      });
   }

   /**
    * @returns the rendered width of the summary table, its width without wrapping and its number of columns
    */
   async tableWidths(): Promise<{ rendered: number; maxContent: number; columnCount: number }> {
      await this.waitForSummaryTable();
      return this.root.locator('table').evaluate((table: HTMLTableElement) => {
         const rendered = table.getBoundingClientRect().width;
         const inlineWidth = table.style.width;
         table.style.width = 'max-content';
         const maxContent = table.getBoundingClientRect().width;
         table.style.width = inlineWidth;
         return { rendered, maxContent, columnCount: table.querySelectorAll('tr.mat-mdc-header-row th').length };
      });
   }

   async tableCellStyles(): Promise<{ header: RenderedCellStyle; cell: RenderedCellStyle; footer: RenderedCellStyle;
      sortArrowWidth: number }> {
      await this.waitForSummaryTable();
      return this.root.locator('table').evaluate((table: HTMLTableElement) => {
         const styleOf = (textElement: Element, paddedElement: Element) => {
            const text = getComputedStyle(textElement);
            const padded = getComputedStyle(paddedElement);
            return {
               fontWeight: Number(text.fontWeight),
               fontSize: parseFloat(text.fontSize),
               fontFamily: text.fontFamily,
               letterSpacing: text.letterSpacing === 'normal' ? 0 : parseFloat(text.letterSpacing),
               horizontalPadding: parseFloat(padded.paddingLeft) + parseFloat(padded.paddingRight)
            };
         };
         const th = table.querySelector('th');
         const td = table.querySelector('tr.mat-mdc-row td');
         const footer = table.querySelector('td.mat-mdc-footer-cell');
         const arrow = table.querySelector<HTMLElement>('.mat-sort-header-arrow');
         return {
            header: styleOf(th.querySelector('.mat-sort-header-content'), th),
            cell: styleOf(td, td),
            footer: styleOf(footer, footer),
            sortArrowWidth: arrow.offsetWidth + parseFloat(getComputedStyle(arrow).marginLeft)
         };
      });
   }

   async saveAs(menuItem: string): Promise<void> {
      await this.root.locator('.but_more').click();
      await this.root.page().getByRole('menuitem', { name: menuItem, exact: true }).click();
   }

   async setColumnSpan(menuItem: string): Promise<void> {
      await this.setSpan('.menu_item_column_span', menuItem);
   }

   async setRowSpan(menuItem: string): Promise<void> {
      await this.setSpan('.menu_item_row_span', menuItem);
   }

   private async setSpan(spanMenuItem: string, menuItem: string): Promise<void> {
      await this.root.locator('.but_more').click();
      await this.root.page().locator(spanMenuItem).click();
      await this.root.page().getByRole('menuitem', { name: menuItem, exact: true }).click();
   }

   async bringToFront(): Promise<void> {
      await this.root.locator('.but_more').click();
      await this.root.page().locator('.menu_item_bring_to_front').click();
   }

   async sendToBack(): Promise<void> {
      await this.root.locator('.but_more').click();
      await this.root.page().locator('.menu_item_send_to_back').click();
   }

   zIndex(): Promise<number> {
      return this.root.evaluate((e: HTMLElement) => Number(getComputedStyle(e).zIndex));
   }

   startResizeBy(dx: number, dy: number): Promise<void> {
      return pressCenterAndMoveBy(this.root.locator('.resize-handle'), dx, dy);
   }

   startMoveBy(dx: number, dy: number): Promise<void> {
      return pressCenterAndMoveBy(this.root.locator('.but_move'), dx, dy);
   }

   async release(): Promise<void> {
      await this.root.page().mouse.up();
   }

   async remove(): Promise<void> {
      await this.root.locator('.but_close').click();
      await this.root.waitFor({ state: 'detached' });
   }

   private async waitForSummaryTable(): Promise<void> {
      await expect(this.root.locator('td.mat-mdc-footer-cell').first()).toBeVisible();
      await expect(this.root.locator('mat-progress-bar')).toHaveCount(0);
   }

   private paintedPixelCount(): Promise<number> {
      return this.root.locator('canvas').evaluate((c: HTMLCanvasElement) => {
         const { data } = c.getContext('2d').getImageData(0, 0, c.width, c.height);
         let count = 0;
         for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) {
               count++;
            }
         }
         return count;
      });
   }
}
