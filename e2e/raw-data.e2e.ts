import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { DataType } from 'app/shared/model/data-type.enum';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { RAW_DATA_FILE_BASE_NAME } from 'app/shared/services/export/export-file';
import { LANGUAGE_ABBREVIATIONS } from 'app/shared/services/language/language';
import { contentOf, downloadOf, exportDayOf, exportFileName, localDayOf } from './support/downloads';
import { expect, test } from './support/fixtures';
import { columnValuesOf, countOf, firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

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
