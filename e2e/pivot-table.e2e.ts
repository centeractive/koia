import { ExportFormat } from 'app/shared/model/export-format.enum';
import { PIVOT_TABLE_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
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
const firstRowValue = distinctValuesOf(sample, rowColumn)[0];
const firstDay: string = distinctValuesOf(sample, timeColumn)[0];

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
