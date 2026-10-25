import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { DataType } from 'app/shared/model/data-type.enum';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { RAW_DATA_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { LANGUAGE_ABBREVIATIONS } from 'app/shared/services/language/language';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { bytesOf, contentOf, downloadOf, exportDayOf, exportFileName, localDayOf } from './support/downloads';
import { expect, test } from './support/fixtures';
import { columnValuesOf, countOf, firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { contentOffsetOf, printedSheets, whilePrinted } from './support/print';
import { Texts } from './support/texts';
import { expectOnlyActive } from './support/toggles';
import { Locator } from '@playwright/test';

const NO_MATCH = 'no match';
const VIEW_NAME = 'East only';
const en = new Texts('en');
const de = new Texts('de');
const ja = new Texts('ja');
const sample = fruitSalesOf('en');

test.beforeEach(async ({ front }) => {
   await front.open('en');
   await front.openSample();
});

test('clicking a header once sorts its column ascending', async ({ rawData }) => {
   const column = firstColumnOf(sample, DataType.NUMBER);

   await rawData.table.sortBy(column);

   await expect(rawData.table.sortIndicator(column)).toHaveText(SORT_INDICATORS.asc);
});

test('sorting a number column twice shows the descending indicator and the largest value first', async ({ rawData }) => {
   const column = firstColumnOf(sample, DataType.NUMBER);

   await rawData.table.sortBy(column);
   await rawData.table.sortBy(column);

   await expect(rawData.table.sortIndicator(column)).toHaveText(SORT_INDICATORS.desc);
   await expect(await rawData.table.cell(0, column)).toHaveText(en.number(Math.max(...columnValuesOf<number>(sample, column))));
});

test('value filter reduces the rows to the matching ones', async ({ rawData }) => {
   const column = firstColumnOf(sample, DataType.TEXT);
   const value: string = sample.entries[0][column];
   const matching = columnValuesOf<string>(sample, column).filter(v => v.toLowerCase().includes(value.toLowerCase()));

   await rawData.mainToolbar.addValueFilter(column, value);

   await expect(rawData.table.rowCount).toHaveText(en.rows(matching.length));
});

test('range filter at the maximum shows its rows, removing it shows all rows and hides the range filter panel', async ({ rawData }) => {
   const column = firstColumnOf(sample, DataType.NUMBER);
   const max = Math.max(...columnValuesOf<number>(sample, column));
   const rangeFilter = await rawData.mainToolbar.addRangeFilter(column, en.get('toolbar.valueRange'));

   await rangeFilter.moveMinToMax();
   await expect(rawData.table.rowCount).toHaveText(en.rows(countOf(sample, e => e[column] === max)));
   await rangeFilter.remove();

   await expect(rawData.table.rowCount).toHaveText(en.rows(sample.entries.length));
   await expect(rawData.mainToolbar.rangeFilterPanel).toHaveCount(0);
});

test('saved view restores the removed value filter', async ({ rawData, notifications, confirmDialog }) => {
   const column = firstColumnOf(sample, DataType.TEXT);
   const value: string = sample.entries[0][column];
   await rawData.mainToolbar.addValueFilter(column, value);
   await rawData.mainToolbar.saveView(VIEW_NAME);
   await notifications.dismiss(StatusType.SUCCESS);

   await rawData.mainToolbar.removeValueFilter();
   await expect(rawData.table.rowCount).toHaveText(en.rows(sample.entries.length));
   await rawData.mainToolbar.restoreView(VIEW_NAME);
   await confirmDialog.confirm();

   await expect(rawData.table.rowCount).toHaveText(en.rows(countOf(sample, e => e[column].toLowerCase().includes(value.toLowerCase()))));
});

test('raw data is exported as CSV file with a header and all rows', async ({ page, rawData }) => {
   const dayBefore = localDayOf(new Date());
   const download = await downloadOf(page, () => rawData.viewToolbar.chooseMoreMenuItem(en.get('rawData.saveAs', { format: ExportFormat.CSV })));
   const dayAfter = localDayOf(new Date());

   const [header, ...rows] = (await contentOf(download)).split('\n');
   expect(download.suggestedFilename()).toMatch(exportFileName(RAW_DATA_FILE_BASE_NAME, ExportFormat.CSV));
   expect([dayBefore, dayAfter]).toContain(exportDayOf(download.suggestedFilename(), RAW_DATA_FILE_BASE_NAME, ExportFormat.CSV));
   expect(header.split(',')).toEqual(expect.arrayContaining(sample.scene.columns.map(column => column.name)));
   expect(rows).toHaveLength(sample.entries.length);
});

test('exported CSV starts with byte order mark', async ({ page, rawData }) => {
   const download = await downloadOf(page, () => rawData.viewToolbar.chooseMoreMenuItem(en.get('rawData.saveAs', { format: ExportFormat.CSV })));

   expect([...(await bytesOf(download)).subarray(0, 3)]).toEqual([0xEF, 0xBB, 0xBF]);
});

test('raw data without matching rows is exported as CSV file with the column names only', async ({ page, rawData, notifications }) => {
   await rawData.mainToolbar.addValueFilter(firstColumnOf(sample, DataType.TEXT), NO_MATCH);
   await expect(rawData.table.rowCount).toHaveText(en.rows(0));

   const download = await downloadOf(page, () => rawData.viewToolbar.chooseMoreMenuItem(en.get('rawData.saveAs', { format: ExportFormat.CSV })));

   expect(await contentOf(download)).toBe(sample.scene.columns.map(column => column.name).join(',') + '\n');
   await expect(notifications.pane(StatusType.ERROR)).toHaveCount(0);
});

test('raw data is exported as JSON and Excel files', async ({ page, rawData }) => {
   const json = await downloadOf(page, () => rawData.viewToolbar.chooseMoreMenuItem(en.get('rawData.saveAs', { format: ExportFormat.JSON })));
   const excel = await downloadOf(page, () => rawData.viewToolbar.chooseMoreMenuItem(en.get('rawData.saveAs', { format: ExportFormat.EXCEL })));

   expect(json.suggestedFilename()).toMatch(exportFileName(RAW_DATA_FILE_BASE_NAME, ExportFormat.JSON));
   expect(excel.suggestedFilename()).toMatch(exportFileName(RAW_DATA_FILE_BASE_NAME, ExportFormat.EXCEL));
});

test('switching to German translates the toolbar, the raw data tab and the row count', async ({ rawData, tabBar, languageSelect }) => {
   await languageSelect.switchTo('de');

   await expect(rawData.mainToolbar.addFilterButton).toHaveAccessibleName(de.get('toolbar.addFilter'));
   await expect(tabBar.rawDataTitle).toHaveText(de.get('toolbar.tabs.rawData'));
   await expect(rawData.table.rowCount).toHaveText(de.rows(sample.entries.length));
});

test('Japanese chosen on raw data is kept when the front page is opened without language', async ({ rawData, languageSelect, front }) => {
   await languageSelect.switchTo('ja');
   await expect(rawData.mainToolbar.addFilterButton).toHaveAccessibleName(ja.get('toolbar.addFilter'));
   await expect(rawData.table.rowCount).toHaveText(ja.rows(sample.entries.length));

   await front.open();

   await expect(languageSelect.code).toHaveText(LANGUAGE_ABBREVIATIONS.ja);
});

test('page view buttons switch like radio buttons between screen view and pages, print enabled on pages only', async ({ rawData }) => {
   const toggles = rawData.pagingToggles;
   await expectOnlyActive(toggles.buttons, toggles.monitorButton);
   await expect(toggles.printButton).toBeDisabled();
   await expect(rawData.sheets).toHaveCount(0);

   await toggles.landscapeButton.click();
   await expectOnlyActive(toggles.buttons, toggles.landscapeButton);
   await expect(toggles.printButton).toBeEnabled();
   await expect(rawData.sheets).toHaveCount(1);
   await expect(rawData.sheets.locator('.vt-row').first()).toBeVisible();

   await toggles.portraitButton.click();
   await expectOnlyActive(toggles.buttons, toggles.portraitButton);
   const sheet = await rawData.sheets.first().boundingBox();
   expect(sheet.height / sheet.width).toBeCloseTo(297 / 210, 2);

   await toggles.monitorButton.click();
   await expectOnlyActive(toggles.buttons, toggles.monitorButton);
   await expect(toggles.printButton).toBeDisabled();
   await expect(rawData.sheets).toHaveCount(0);
});

test('landscape page prints the rows scrolled to within its sheet on one sheet', async ({ page, rawData }) => {
   await rawData.pagingToggles.landscapeButton.click();
   const scroller = rawData.sheets.first().locator('.vt');
   await expect(scroller.locator('.vt-row[data-index="0"]')).toBeVisible();
   await scroller.evaluate((element: HTMLElement) => element.scrollTop = 50 * 22);
   await expect(scroller.locator('.vt-row[data-index="50"]')).toBeVisible();
   const onScreen = await firstShownRowOf(scroller);

   const printed = await whilePrinted(page, () => firstShownRowOf(scroller));

   expect(onScreen.index).toBeGreaterThan(0);
   expect(printed).toEqual(onScreen);
   expect(await printedSheets(page)).toEqual({ A4: 1, Letter: 1, paper: 'A4 landscape' });
});

test('landscape sheet shows table at its monitor size on a wide screen', async ({ page, rawData }) => {
   await page.setViewportSize({ width: 1920, height: 1200 });
   const headerCell = rawData.table.headerCells.first();
   const monitorWidth = (await headerCell.boundingBox()).width;

   await rawData.pagingToggles.landscapeButton.click();
   await expect(rawData.sheets.first().locator('.vt-row').first()).toBeVisible();

   expect(Math.abs((await rawData.sheets.first().boundingBox()).width - PageFormat.LANDSCAPE.printWidthPx)).toBeLessThanOrEqual(1);
   expect(Math.abs((await headerCell.boundingBox()).width - monitorWidth)).toBeLessThanOrEqual(1);
});

test('printed landscape sheet shows table below the top padding without side padding', async ({ page, rawData }) => {
   await rawData.pagingToggles.landscapeButton.click();
   const sheet = rawData.sheets.first();
   await expect(sheet.locator('.vt-row').first()).toBeVisible();

   const offset = await whilePrinted(page, () => contentOffsetOf(sheet, '.vt'));

   expect(Math.abs(offset.top - PageFormat.LANDSCAPE.printTopPadding)).toBeLessThanOrEqual(0.5);
   expect(Math.abs(offset.left)).toBeLessThanOrEqual(0.5);
});

/**
 * @returns the scroll offset of the table and the index of the first row shown below its header
 */
function firstShownRowOf(scroller: Locator): Promise<{ scrollTop: number; index: number }> {
   return scroller.evaluate((element: HTMLElement) => {
      const headerBottom = element.querySelector('.vt-header').getBoundingClientRect().bottom;
      const indexes = Array.from(element.querySelectorAll<HTMLElement>('.vt-row'))
         .filter(row => row.getBoundingClientRect().bottom > headerBottom + 1)
         .map(row => Number(row.dataset['index']));
      return { scrollTop: element.scrollTop, index: Math.min(...indexes) };
   });
}
