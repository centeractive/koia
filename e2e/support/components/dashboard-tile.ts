import { expect, Locator } from '@playwright/test';
import { pressCenterAndMoveBy } from '../pointer';

export interface RenderedCellStyle {
   fontWeight: number;
   fontSize: number;
   fontFamily: string;
   letterSpacing: number;
   horizontalPadding: number;
}

/** gap between the top of the tile and its header buttons and title, which are centered in the taller header */
const HEADER_GAP_PX = 3;

interface CenterColumnScan {
   width: number;
   height: number;
   clientWidth: number;
   paintedRow: number;
}

export class DashboardTile {

   readonly title: Locator;
   readonly firstCountLink: Locator;
   readonly graphRootNode: Locator;
   readonly marginButton: Locator;
   readonly margin: Locator;
   readonly resizeHandles: Locator;

   constructor(readonly root: Locator) {
      this.title = root.locator('textarea.textarea_title');
      this.firstCountLink = root.locator('td.td_aggregation a').first();
      this.graphRootNode = root.locator('koia-graph svg g.nodes > g > circle').first();
      this.marginButton = root.locator('.but_element_margin');
      this.margin = root.locator('.div_margins');
      this.resizeHandles = root.locator('.div_resize_handle');
   }

   async configure(): Promise<void> {
      await this.root.locator('.but_element_configure').click();
   }

   async expectChartPainted(): Promise<void> {
      await expect.poll(() => this.paintedPixelCount()).toBeGreaterThan(0);
   }

   /**
    * clicks 10 px above the lowest painted pixel of the canvas centre column, once two consecutive scans agree,
    * because Chart.js animates and redraws when the closing side bar resizes the content
    */
   async clickChartNearBottomCenter(): Promise<void> {
      let previous: string;
      let scan: CenterColumnScan;
      await expect.poll(async () => {
         scan = await this.scanCenterColumn();
         const current = JSON.stringify(scan);
         const stable = scan.paintedRow >= 0 && current === previous;
         previous = current;
         return stable;
      }).toBe(true);
      const scale = scan.width / scan.clientWidth;
      await this.root.locator('canvas').click({ position: { x: scan.clientWidth / 2, y: scan.paintedRow / scale - 10 } });
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

   /**
    * @returns heights and first cell background colors of the first two summary table rows
    */
   async tableRowStyles(): Promise<{ heights: number[]; backgrounds: string[] }> {
      await this.waitForSummaryTable();
      return this.root.locator('tr.mat-mdc-row').evaluateAll((rows: HTMLElement[]) => ({
         heights: rows.slice(0, 2).map(r => r.getBoundingClientRect().height),
         backgrounds: rows.slice(0, 2).map(r => getComputedStyle(r.querySelector('td')).backgroundColor)
      }));
   }

   /**
    * @returns bottom of the summary table scroller and top of the resize handle
    */
   async tableScrollerBottomAndHandleTop(): Promise<{ scrollerBottom: number; handleTop: number }> {
      await this.waitForSummaryTable();
      const scroller = await this.root.locator('.div_summary_table').boundingBox();
      await this.select();
      const handle = await this.resizeHandle('bottom').boundingBox();
      return { scrollerBottom: scroller.y + scroller.height, handleTop: handle.y };
   }

   /**
    * @returns the aria-sort attribute of the first summary table header cell
    */
   async firstHeaderSort(): Promise<string> {
      await this.waitForSummaryTable();
      return this.root.locator('th.mat-mdc-header-cell').first().getAttribute('aria-sort');
   }

   /**
    * @returns the values of the first summary table column of all rows, including those of spanned cells
    */
   async firstColumnValues(): Promise<string[]> {
      await this.waitForSummaryTable();
      return (await this.root.locator('tr.mat-mdc-row td:first-child').allTextContents()).map(t => t.trim());
   }

   async hoverFirstTableRow(): Promise<void> {
      await this.root.locator('tr.mat-mdc-row').first().hover();
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

   /**
    * clicks the empty gap above the header, which selects the tile and keeps a selected tile selected
    */
   async select(): Promise<void> {
      const box = await this.root.boundingBox();
      await this.root.click({ position: { x: box.width / 2, y: HEADER_GAP_PX } });
   }

   resizeHandle(name = 'bottom_right'): Locator {
      return this.root.locator('.div_resize_handle_' + name);
   }

   async startResizeBy(dx: number, dy: number, handle = 'bottom_right'): Promise<void> {
      await this.select();
      await pressCenterAndMoveBy(this.resizeHandle(handle), dx, dy);
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

   /**
    * @returns the canvas size and the lowest painted row of the canvas centre column in canvas pixels, -1 when unpainted
    */
   private scanCenterColumn(): Promise<CenterColumnScan> {
      return this.root.locator('canvas').evaluate((c: HTMLCanvasElement) => {
         const { data } = c.getContext('2d').getImageData(Math.floor(c.width / 2), 0, 1, c.height);
         let paintedRow = -1;
         for (let y = c.height - 1; y >= 0 && paintedRow < 0; y--) {
            if (data[y * 4 + 3] > 0) {
               paintedRow = y;
            }
         }
         return { width: c.width, height: c.height, clientWidth: c.clientWidth, paintedRow };
      });
   }
}
