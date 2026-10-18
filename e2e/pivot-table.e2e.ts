import { ExportFormat } from 'app/shared/model/export-format.enum';
import { PIVOT_TABLE_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { TABLE_FONT_FAMILY } from 'app/shared/ui/table-fit/table-font';
import { downloadOf, exportFileName } from './support/downloads';
import { expect, test } from './support/fixtures';
import { countOf, distinctValuesOf, fruitSalesOf, pivotRowColumnOf, pivotTabOf, pivotTimeColumnOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const TABLE_RENDERER = 'Table';
const en = new Texts('en');
const sample = fruitSalesOf('en');
const pivotTab = pivotTabOf(sample);
const rowColumn = pivotRowColumnOf(pivotTab);
const timeColumn = pivotTimeColumnOf(pivotTab);
const firstRowValue = distinctValuesOf<string>(sample, rowColumn)[0];
const firstDay = distinctValuesOf<string>(sample, timeColumn)[0];

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

test('pivot table is exported as Excel file', async ({ page, pivot }) => {
   const download = await downloadOf(page, () => pivot.viewToolbar.chooseMoreMenuItem(en.get('pivot.saveAsExcel')));

   expect(download.suggestedFilename()).toMatch(exportFileName(PIVOT_TABLE_FILE_BASE_NAME, ExportFormat.EXCEL));
});

test('row totals toggle hides and shows the row total column', async ({ pivot }) => {
   await pivot.rowTotalsButton.click();

   await expect(pivot.rowTotals).toHaveCount(0);
   await expect(pivot.rowTotalsButton).not.toHaveClass(/\bkoia-toggle-active\b/);

   await pivot.rowTotalsButton.click();

   await expect(pivot.firstRowTotal).toBeVisible();
   await expect(pivot.rowTotalsButton).toHaveClass(/\bkoia-toggle-active\b/);
});

test('pivot table uses the shared table font compact and without underlined values', async ({ pivot }) => {
   const style = await pivot.valueCells.first().evaluate((cell: HTMLElement) => {
      const computed = getComputedStyle(cell);
      return { fontFamily: computed.fontFamily, fontSize: computed.fontSize, textDecorationLine: computed.textDecorationLine };
   });

   expect(style).toEqual({ fontFamily: TABLE_FONT_FAMILY, fontSize: '11px', textDecorationLine: 'none' });
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
