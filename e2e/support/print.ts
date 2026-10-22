import { Locator, Page } from '@playwright/test';

/**
 * @returns the number of sheets printed when A4 and Letter are requested and the page's CSS size is preferred, together
 * with the paper of all sheets
 */
export async function printedSheets(page: Page): Promise<{ A4: number; Letter: number; paper: string }> {
   await dispatchWindowEvent(page, 'beforeprint');
   const papers = new Set<string>();
   const sheetsOf = async (format: string) => {
      const pdf = (await page.pdf({ format, preferCSSPageSize: true })).toString('latin1');
      pdf.match(/\/MediaBox\s*\[[^\]]*\]/g)
         .map(box => box.match(/[\d.]+/g).map(Number))
         .forEach(([, , width, height]) => papers.add(paperOf(width, height)));
      return pdf.match(/\/Type\s*\/Page(?!s)/g).length;
   };
   const sheets = { A4: await sheetsOf('A4'), Letter: await sheetsOf('Letter'), paper: [...papers].join() };
   await dispatchWindowEvent(page, 'afterprint');
   return sheets;
}

/**
 * @param width width of a PDF MediaBox in points
 * @param height height of a PDF MediaBox in points
 */
function paperOf(width: number, height: number): string {
   const [long, short] = [Math.max(width, height), Math.min(width, height)].map(Math.round);
   const size = long === 842 && short === 595 ? 'A4' : long + 'x' + short;
   return size + ' ' + (width > height ? 'landscape' : 'portrait');
}

export async function dispatchWindowEvent(page: Page, type: string): Promise<void> {
   await page.evaluate((t: string) => window.dispatchEvent(new Event(t)), type);
}

/**
 * @returns what the given function reads while the page is laid out for printing
 */
export async function whilePrinted<T>(page: Page, read: () => Promise<T>): Promise<T> {
   await dispatchWindowEvent(page, 'beforeprint');
   await page.emulateMedia({ media: 'print' });
   const result = await read();
   await page.emulateMedia({ media: null });
   await dispatchWindowEvent(page, 'afterprint');
   return result;
}

/**
 * @returns the positions of heading, footer and content relative to the width and height of the sheet
 */
export function sheetProportionsOf(sheet: Locator, contentSelector: string): Promise<{ width: number; proportions: number[] }> {
   return sheet.evaluate((element: HTMLElement, selector: string) => {
      const rect = element.getBoundingClientRect();
      const relativeX = (x: number) => (x - rect.left) / rect.width;
      const relativeY = (y: number) => (y - rect.top) / rect.height;
      const boxOf = (s: string) => element.querySelector(s).getBoundingClientRect();
      return {
         width: rect.width,
         proportions: [
            relativeX(boxOf('.span_print_title').left),
            relativeY(boxOf('.span_print_title').top),
            relativeX(boxOf('.span_print_details').right),
            relativeX(boxOf('.div_canvas_sheet_footer').right),
            relativeY(boxOf('.div_canvas_sheet_footer').bottom),
            relativeX(boxOf(selector).left),
            relativeY(boxOf(selector).top),
            relativeX(boxOf(selector).right),
            relativeY(boxOf(selector).bottom)
         ]
      };
   }, contentSelector);
}

/**
 * @returns the offset of the selected element from the window of the sheet
 */
export function contentOffsetOf(sheet: Locator, selector: string): Promise<{ top: number; left: number }> {
   return sheet.evaluate((element: HTMLElement, s: string) => {
      const window = element.querySelector('.div_sheet_window').getBoundingClientRect();
      const content = element.querySelector(s).getBoundingClientRect();
      return { top: content.top - window.top, left: content.left - window.left };
   }, selector);
}
