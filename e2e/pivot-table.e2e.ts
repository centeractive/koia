import { DataType } from 'app/shared/model/data-type.enum';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { PIVOT_TABLE_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { TABLE_FONT_FAMILY } from 'app/shared/ui/table-fit/table-font';
import { Locator } from '@playwright/test';
import { downloadOf, exportFileName, sheetOf } from './support/downloads';
import { expect, test } from './support/fixtures';
import { columnsOf, countOf, distinctValuesOf, firstColumnOf, fruitSalesOf, pivotRowColumnOf, pivotTabOf, pivotTimeColumnOf, sumOf } from './support/fruit-sales-sample';
import { contentOffsetOf, printedSheets, sheetProportionsOf, whilePrinted } from './support/print';
import { Texts } from './support/texts';
import { expectOnlyActive } from './support/toggles';

const TABLE_RENDERER = 'Table';
const en = new Texts('en');
const sample = fruitSalesOf('en');
const pivotTab = pivotTabOf(sample);
const rowColumn = pivotRowColumnOf(pivotTab);
const timeColumn = pivotTimeColumnOf(pivotTab);
const firstRowValue = distinctValuesOf<string>(sample, rowColumn)[0];
const firstDay = distinctValuesOf<string>(sample, timeColumn)[0];
const SUM = 'Sum';
const colsColumn = firstColumnOf(sample, DataType.TEXT);
const firstColsValue = distinctValuesOf<string>(sample, colsColumn)[0];
const [quantityColumn, revenueColumn] = columnsOf(sample, DataType.NUMBER);

test.beforeEach(async ({ front, tabBar, pivot }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.open(pivotTab.id);
   await pivot.valueCells.first().waitFor();
});

test('switching from heatmap to table renderer removes the cell colors', async ({ pivot }) => {
   await pivot.heatmapCells.first().waitFor();

   await pivot.selectRenderer(TABLE_RENDERER);

   await expect(pivot.heatmapCells).toHaveCount(0);
   await expect(pivot.valueCells.first()).toBeVisible();
});

test('clicking a value cell shows fewer raw data rows in a dialog', async ({ pivot, rawDataDialog }) => {
   await pivot.valueCells.first().click();

   await expect.poll(() => rawDataDialog.table.rowCountValue()).toBeLessThan(sample.entries.length);
   expect(await rawDataDialog.table.rowCountValue()).toBeGreaterThan(0);
});

test('row total of the first row reveals the rows of its month', async ({ pivot, rawDataDialog }) => {
   const firstMonth = firstDay.slice(0, 7);

   await pivot.firstRowTotal.click();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(
      countOf(sample, e => e[rowColumn] === firstRowValue && e[timeColumn].startsWith(firstMonth))));
});

test('switching the time unit to year regroups the rows and the row total reveals the rows of its year', async ({ pivot, rawDataDialog }) => {
   const firstYear = firstDay.slice(0, 4);

   await pivot.setTimeUnit(timeColumn, en.get('pivot.timeUnit.year'));
   await expect(pivot.rowLabels.nth(1)).toHaveText(firstYear);
   await pivot.firstRowTotal.click();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(
      countOf(sample, e => e[rowColumn] === firstRowValue && e[timeColumn].startsWith(firstYear))));
});

test('pivot table is exported as Excel file with numbers as numbers and time labels as text', async ({ page, pivot }) => {
   const dataValue = await pivot.valueCells.first().getAttribute('data-value');
   const timeLabel = await pivot.rowLabels.nth(1).textContent();

   const download = await downloadOf(page, () => pivot.viewToolbar.chooseMoreMenuItem(en.get('pivot.saveAsExcel')));

   expect(download.suggestedFilename()).toMatch(exportFileName(PIVOT_TABLE_FILE_BASE_NAME, ExportFormat.EXCEL));
   const cells = Object.entries(await sheetOf(download)).filter(([key]) => !key.startsWith('!')).map(([, cell]) => cell);
   expect(cells).toContainEqual(expect.objectContaining({ t: 'n', v: Number(dataValue) }));
   expect(cells).toContainEqual(expect.objectContaining({ t: 's', v: timeLabel }));
});

test('row totals toggle hides and shows the row total column', async ({ pivot }) => {
   await pivot.rowTotalsButton.click();

   await expect(pivot.rowTotals).toHaveCount(0);
   await expect(pivot.rowTotalsButton).not.toHaveClass(/\bkoia-toggle-active\b/);

   await pivot.rowTotalsButton.click();

   await expect(pivot.firstRowTotal).toBeVisible();
   await expect(pivot.rowTotalsButton).toHaveClass(/\bkoia-toggle-active\b/);
});

test('column totals toggle hides and shows the column totals row', async ({ pivot }) => {
   await pivot.columnTotalsButton.click();

   await expect(pivot.columnTotals).toHaveCount(0);
   await expect(pivot.columnTotalsButton).not.toHaveClass(/\bkoia-toggle-active\b/);

   await pivot.columnTotalsButton.click();

   await expect(pivot.columnTotals.first()).toBeVisible();
   await expect(pivot.columnTotalsButton).toHaveClass(/\bkoia-toggle-active\b/);
});

test('fields dragged into rows and columns of a new pivot table sum up the chosen attribute', async ({ tabBar, pivot }) => {
   await tabBar.addPivotTable();
   await pivot.table.waitFor();

   await pivot.dragFieldToRows(rowColumn);
   await pivot.dragFieldToColumns(colsColumn);
   await pivot.chooseAggregator(SUM, quantityColumn);

   await expect(pivot.rowLabels.first()).toHaveText(firstRowValue);
   await expect(pivot.valueCells.first()).toHaveAttribute('data-value',
      String(sumOf(sample, quantityColumn, e => e[rowColumn] === firstRowValue && e[colsColumn] === firstColsValue)));
});

test('removing the value grouping of a number column lets a new pivot table sum its exact values', async ({ tabBar, pivot }) => {
   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows(rowColumn);

   await pivot.removeValueGrouping(en.get('pivot.sideBar.columnGrouping', { column: revenueColumn }));
   await pivot.chooseAggregator(SUM, revenueColumn);

   await expect(pivot.firstRowTotal).toHaveAttribute('data-value', String(sumOf(sample, revenueColumn, e => e[rowColumn] === firstRowValue)));
});

test('pivot table uses the shared table font compact and without underlined values', async ({ pivot }) => {
   const style = await pivot.valueCells.first().evaluate((cell: HTMLElement) => {
      const computed = getComputedStyle(cell);
      return { fontFamily: computed.fontFamily, fontSize: computed.fontSize, textDecorationLine: computed.textDecorationLine };
   });

   expect(style).toEqual({ fontFamily: TABLE_FONT_FAMILY, fontSize: '11px', textDecorationLine: 'none' });
});

test('hovered pivot table value is underlined and hints at showing its data', async ({ pivot }) => {
   const cell = pivot.valueCells.filter({ hasText: /\S/ }).first();

   await cell.hover();

   await expect(cell).toHaveAttribute('title', en.get('pivot.showData'));
   await expect(cell).toHaveCSS('text-decoration-line', 'underline');
});

test('sample heatmap uses the muted palette', async ({ pivot }) => {
   await pivot.heatmapCells.first().waitFor();

   const backgrounds = await pivot.heatmapCells.evaluateAll((cells: HTMLElement[]) => cells.map(c => getComputedStyle(c).backgroundColor));

   expect(backgrounds).toContain('rgb(129, 199, 132)');
   expect(backgrounds).not.toContain('rgb(0, 255, 0)');
});

test('value grouping side bar header stays on one line', async ({ pivot }) => {
   await pivot.openValueGrouping();

   expect((await pivot.sideBarHeader.boundingBox()).height).toBe(48);
});

test('configuration selects are as high as field chips', async ({ pivot }) => {
   expect((await pivot.fieldChips.first().boundingBox()).height).toBe(22);
   for (const select of await pivot.configurationSelects.all()) {
      expect((await select.boundingBox()).height).toBe(22);
   }
});

test('available and selected field zones are visually distinct', async ({ pivot }) => {
   const available = await pivot.availableFieldsZone.evaluate((zone: HTMLElement) => {
      const computed = getComputedStyle(zone);
      return { borderTopStyle: computed.borderTopStyle, backgroundColor: computed.backgroundColor };
   });
   const selected = await pivot.selectedFieldsZones.evaluateAll((zones: HTMLElement[]) => zones.map(zone => {
      const computed = getComputedStyle(zone);
      return { borderTopStyle: computed.borderTopStyle, borderTopColor: computed.borderTopColor, backgroundColor: computed.backgroundColor };
   }));

   expect(available).toEqual({ borderTopStyle: 'dashed', backgroundColor: 'rgb(245, 246, 248)' });
   expect(selected).toEqual(Array(3).fill({ borderTopStyle: 'solid', borderTopColor: 'rgb(197, 202, 233)', backgroundColor: 'rgb(232, 234, 246)' }));
});

test('page view buttons switch like radio buttons between screen view and pages, print enabled on pages only', async ({ pivot }) => {
   const toggles = pivot.pagingToggles;
   await expectOnlyActive(toggles.buttons, toggles.monitorButton);
   await expect(toggles.printButton).toBeDisabled();
   await expect(pivot.sheets).toHaveCount(0);

   await toggles.landscapeButton.click();
   await expectOnlyActive(toggles.buttons, toggles.landscapeButton);
   await expect(toggles.printButton).toBeEnabled();
   await expect(pivot.sheets.first()).toBeVisible();

   await toggles.portraitButton.click();
   await expectOnlyActive(toggles.buttons, toggles.portraitButton);
   const sheet = await pivot.sheets.first().boundingBox();
   expect(sheet.height / sheet.width).toBeCloseTo(297 / 210, 2);

   await toggles.monitorButton.click();
   await expectOnlyActive(toggles.buttons, toggles.monitorButton);
   await expect(toggles.printButton).toBeDisabled();
   await expect(pivot.sheets).toHaveCount(0);
   await expect(pivot.valueCells.first()).toBeVisible();
});

test('landscape sheets show heading, page number and pivot table', async ({ pivot }) => {
   await pivot.pagingToggles.landscapeButton.click();
   const sheet = pivot.sheets.first();
   await expect(sheet).toBeVisible();
   const count = await pivot.sheets.count();

   await expect(sheet.locator('.div_canvas_sheet_header .span_print_title')).toHaveText(pivotTab.title);
   await expect(sheet.locator('.div_canvas_sheet_footer')).toHaveText(en.get('view.printPage', { page: 1, count }));
   await expect(sheet.locator('.div_pivot_page table.pvtTable td.pvtVal').first()).toBeVisible();
});

test('portrait pages print as many portrait sheets as shown', async ({ page, pivot }) => {
   await pivot.pagingToggles.portraitButton.click();
   await expect(pivot.sheets.first()).toBeVisible();
   const shown = await pivot.sheets.count();

   const printed = await printedSheets(page);

   expect(printed).toEqual({ A4: shown, Letter: shown, paper: 'A4 portrait' });
});

test('printed landscape sheet keeps the proportions shown on a narrow screen', async ({ page, pivot }) => {
   await page.setViewportSize({ width: 1150, height: 812 });
   await pivot.pagingToggles.landscapeButton.click();
   const sheet = pivot.sheets.first();
   const onScreen = await sheetProportionsOf(sheet, '.div_pivot_page table.pvtTable');

   const printed = await whilePrinted(page, () => sheetProportionsOf(sheet, '.div_pivot_page table.pvtTable'));

   expect(onScreen.width).toBeLessThan(PageFormat.LANDSCAPE.printWidthPx);
   expect(Math.abs(printed.width - PageFormat.LANDSCAPE.printWidthPx)).toBeLessThanOrEqual(1);
   printed.proportions.forEach((proportion, i) => expect(Math.abs(proportion - onScreen.proportions[i])).toBeLessThanOrEqual(0.004));
});

test('printed landscape sheet shows wide pivot table at its natural size clipped at the sheet width', async ({ page, pivot }) => {
   await pivot.pagingToggles.landscapeButton.click();
   const sheet = pivot.sheets.first();
   await expect(sheet.locator('.div_pivot_page table.pvtTable')).toBeVisible();

   const printed = await whilePrinted(page, () => sheet.evaluate((element: HTMLElement) => {
      const window = element.querySelector('.div_sheet_window').getBoundingClientRect();
      const table = element.querySelector<HTMLElement>('.div_pivot_page table.pvtTable');
      return { windowWidth: window.width, tableWidth: table.getBoundingClientRect().width, naturalWidth: table.offsetWidth };
   }));

   expect(printed.tableWidth).toBeCloseTo(printed.naturalWidth, 0);
   expect(printed.tableWidth).toBeGreaterThan(printed.windowWidth);
});

test('landscape sheet shows pivot table at its monitor size on a wide screen', async ({ page, pivot }) => {
   await page.setViewportSize({ width: 1920, height: 1200 });
   const monitorWidth = (await pivot.table.boundingBox()).width;

   await pivot.pagingToggles.landscapeButton.click();
   const sheet = pivot.sheets.first();
   const table = sheet.locator('.div_pivot_page table.pvtTable');
   await expect(table).toBeVisible();

   expect(Math.abs((await sheet.boundingBox()).width - PageFormat.LANDSCAPE.printWidthPx)).toBeLessThanOrEqual(1);
   expect(Math.abs((await table.boundingBox()).width - monitorWidth)).toBeLessThanOrEqual(1);
});

test('printed landscape sheet shows pivot table below the top padding', async ({ page, pivot }) => {
   await pivot.pagingToggles.landscapeButton.click();
   const sheet = pivot.sheets.first();
   await expect(sheet.locator('.div_pivot_page table.pvtTable')).toBeVisible();

   const offset = await whilePrinted(page, () => contentOffsetOf(sheet, '.div_pivot_page table.pvtTable'));

   expect(Math.abs(offset.top - PageFormat.LANDSCAPE.printTopPadding)).toBeLessThanOrEqual(0.5);
   expect(Math.abs(offset.left)).toBeLessThanOrEqual(0.5);
});

test('printed landscape sheet keeps heatmap colors', async ({ page, pivot }) => {
   await pivot.pagingToggles.landscapeButton.click();
   const cell = pivot.sheetHeatmapCells.first();
   await expect(cell).toBeVisible();

   const printColorAdjust = await whilePrinted(page, () => cell.evaluate(td => getComputedStyle(td).printColorAdjust));

   expect(printColorAdjust).toBe('exact');
});

test('rows at a page break show their shared grid line on both sheets', async ({ pivot }) => {
   await pivot.mainToolbar.addValueFilter(rowColumn, firstRowValue);
   await pivot.setTimeUnit(timeColumn, en.get('pivot.timeUnit.day'));
   await expect.poll(() => pivot.rowLabels.count()).toBeGreaterThan(100);

   await pivot.pagingToggles.landscapeButton.click();
   await expect(pivot.sheets.nth(1)).toBeVisible();

   expect(await gridLineMarginOf(pivot.sheets.nth(0), 'bottom')).toBeGreaterThanOrEqual(-0.5);
   expect(await gridLineMarginOf(pivot.sheets.nth(1), 'top')).toBeGreaterThanOrEqual(-0.5);
});

/**
 * @returns the space between the grid line of the last row fully shown on the sheet and the bottom of its clip, or between the top of
 * the clip and the grid line of the first row starting within the clip, negative when the line is cut off
 */
function gridLineMarginOf(sheet: Locator, edge: 'top' | 'bottom'): Promise<number> {
   return sheet.evaluate((element: HTMLElement, clipEdge: string) => {
      const clip = element.querySelector<HTMLElement>('.div_pivot_page');
      const clipRect = clip.getBoundingClientRect();
      const halfLine = parseFloat(getComputedStyle(clip.querySelector('td, th')).borderTopWidth) * clipRect.width / clip.offsetWidth / 2;
      const rows = Array.from(clip.querySelectorAll('tr')).map(row => row.getBoundingClientRect());
      if (clipEdge === 'top') {
         return rows.find(row => row.top >= clipRect.top).top - halfLine - clipRect.top;
      }
      return clipRect.bottom - rows.filter(row => row.bottom <= clipRect.bottom).at(-1).bottom - halfLine;
   }, edge);
}
