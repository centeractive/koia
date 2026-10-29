import { readFileSync } from 'fs';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { expect, test } from './support/fixtures';
import {
   CODES_CSV, DUPLICATE_HEADERS_CSV, EPOCH_MILLIS_CSV, IMPORT_FILES, LOG_MESSAGES_CSV, MISSING_TIMES_CSV, MIXED_DATES_CSV,
   ImportFile, ORDERS_CSV, ORDERS_WITH_ID_CSV, SALES_CSV, SEMICOLON_ORDERS_CSV
} from './support/import-files';
import { FrontPage } from './support/pages/front-page';
import { ScenePage } from './support/pages/scene-page';
import { ScenesPage } from './support/pages/scenes-page';
import { Texts } from './support/texts';

const en = new Texts('en');

/**
 * @returns the labels of the detected column data types
 */
async function importFile(file: ImportFile, front: FrontPage, scene: ScenePage, scenes: ScenesPage): Promise<string[]> {
   await front.open('en');
   await front.startWithFile();
   const dataTypes = await scene.detectColumns(file);
   await scene.loadData();
   await scenes.activate(file.name);
   return dataTypes;
}

for (const file of IMPORT_FILES) {
   test(`${file.sourceName} file ${file.name} is imported with detected column types and all its rows`, async ({ front, scene, scenes, rawData }) => {
      await front.open('en');
      await front.startWithFile();

      const dataTypes = await scene.detectColumns(file);
      const panelsExpanded = await scene.panels.evaluateAll(panels => panels.map(p => p.classList.contains('mat-expanded')));
      const message = await scene.loadData();
      await scenes.activate(file.name);

      expect(dataTypes).toEqual(en.dataTypes(file.dataTypes));
      expect(panelsExpanded).toEqual([false, false, true, true]);
      expect(message).toBe(en.get('scene.itemsPersisted', { count: en.number(file.rowCount) }));
      await expect(rawData.table.headers).toHaveText(file.columns);
      await expect(rawData.table.rowCount).toHaveText(en.rows(file.rowCount));
   });
}

test('semicolon separated CSV file with commas in quoted values is split into its columns', async ({ front, scene, scenes, rawData }) => {
   const file = SEMICOLON_ORDERS_CSV;
   await front.open('en');
   await front.startWithFile();

   const dataTypes = await scene.detectColumns(file);
   await expect(scene.separator).toHaveValue(file.separator);
   await scene.loadData();
   await scenes.activate(file.name);

   expect(dataTypes).toEqual(en.dataTypes(file.dataTypes));
   await expect(rawData.table.headers).toHaveText(file.columns);
   await expect(rawData.table.rowCount).toHaveText(en.rows(file.rowCount));
});

test('CSV column starting with underscore is refused', async ({ front, scene }) => {
   await front.open('en');
   await front.startWithFile();

   await scene.detectColumns(ORDERS_WITH_ID_CSV);

   await expect(scene.columnNameErrors).toHaveText([en.get('scene.column.nameUnderscore')]);
});

test('CSV values with leading zeros or radix prefix stay text and whitespace only values stay empty',
   async ({ front, scene, scenes, rawData }) => {
      const file = CODES_CSV;

      const dataTypes = await importFile(file, front, scene, scenes);

      expect(dataTypes).toEqual(en.dataTypes(file.dataTypes));
      await expect(rawData.table.rowCount).toHaveText(en.rows(file.rowCount));
      await expect(await rawData.table.cell(0, 'Code')).toHaveText('00123');
      await expect(await rawData.table.cell(0, 'Hex')).toHaveText('0x1A');
      await expect(await rawData.table.cell(1, 'Amount')).toHaveText('');
      await expect(await rawData.table.cell(2, 'Amount')).toHaveText('12');
   });

test('CSV file with duplicate and empty headers is imported with unique column names', async ({ front, scene, scenes, rawData }) => {
   const file = DUPLICATE_HEADERS_CSV;

   await importFile(file, front, scene, scenes);

   await expect(rawData.table.headers).toHaveText(['Item', 'Item (2)', 'Column 3', 'Amount']);
   await expect(await rawData.table.cell(0, 'Item')).toHaveText('Apples');
   await expect(await rawData.table.cell(0, 'Item (2)')).toHaveText('Green');
});

test('date neither matching the detected format nor ISO 8601 is reported in the preview', async ({ front, scene }) => {
   await front.open('en');
   await front.startWithFile();

   const dataTypes = await scene.detectColumns(MIXED_DATES_CSV);

   expect(dataTypes).toEqual(en.dataTypes(MIXED_DATES_CSV.dataTypes));
   await expect(scene.previewRowWarnings).toHaveCount(1);
});

test('number column changed to time is interpreted as epoch milliseconds', async ({ front, scene }) => {
   await front.open('en');
   await front.startWithFile();
   await scene.detectColumns(EPOCH_MILLIS_CSV);

   await scene.changeDataType(1, en.get(EnumLabelKeys.dataType(DataType.TIME)));

   await expect(await scene.preview.cell(0, 'Shipped')).toHaveText('1970');
   await expect(scene.previewRowWarnings).toHaveCount(0);
});

test('count of a summary table row without time reveals the rows without time',
   async ({ front, scene, scenes, tabBar, dashboard, rawDataDialog }) => {
      await importFile(MISSING_TIMES_CSV, front, scene, scenes);
      await tabBar.addDashboard();
      await dashboard.launcher.addSummary();
      await dashboard.sideBar.selectColumn('Item');
      await dashboard.sideBar.dragGroupByColumn('Shipped');
      await dashboard.sideBar.selectGroupByTimeUnit('Shipped', en.get(EnumLabelKeys.groupingTimeUnit(TimeUnit.MONTH)));
      await dashboard.sideBar.close();

      await dashboard.tile(0).root.locator('tr.mat-mdc-row').filter({ hasText: 'Pears' }).locator('td.td_aggregation a').click();

      await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(1));
   });

test('longest display format is shown in full', async ({ page, front, scene }) => {
   await page.clock.setFixedTime(new Date(2024, 4, 28, 23, 59, 59, 999));
   await front.open('en');
   await front.startWithFile();
   await scene.detectColumns(LOG_MESSAGES_CSV);

   await scene.selectDisplayFormat('28 May 2024 23:59:59 999');

   await expect(scene.displayFormatValues).toHaveText('28 May 2024 23:59:59 999');
   await expect.poll(() => scene.displayFormatValues.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
});

test('data sample shows whole file of up to 20,000 bytes without truncation', async ({ front, scene }) => {
   await front.open('en');
   await front.startWithFile();

   await scene.selectFile(SALES_CSV);

   await expect(scene.dataSample).toHaveValue(readFileSync(SALES_CSV.path, 'utf8'));
});

test('detect columns button starts row below source attributes aligned left', async ({ front, scene }) => {
   await front.open('en');
   await front.startWithFile();

   await scene.selectFile(SALES_CSV);

   const language = await scene.languageField.boundingBox();
   const button = await scene.detectColumnsButton.boundingBox();
   expect(button.y).toBeGreaterThanOrEqual(language.y + language.height);
   expect(Math.abs(button.x - language.x)).toBeLessThanOrEqual(1);
});

test.describe('ID column', () => {

   test.use({ idColumnOffAtFirst: false });

   for (const file of IMPORT_FILES) {
      test(`${file.sourceName} file ${file.name} is imported with its rows numbered from 1`, async ({ front, scene, scenes, rawData }) => {
         const dataTypes = await importFile(file, front, scene, scenes);

         expect(dataTypes).toEqual(en.dataTypes([DataType.NUMBER, ...file.dataTypes]));
         await expect(rawData.table.headers).toHaveText(['ID', ...file.columns]);
         await expect(rawData.table.rowCount).toHaveText(en.rows(file.rowCount));
         await expect(await rawData.table.cell(0, 'ID')).toHaveText('1');
         await rawData.table.sortBy('ID');
         await rawData.table.sortBy('ID');
         await expect(await rawData.table.cell(0, 'ID')).toHaveText(en.number(file.rowCount));
      });
   }

   test('adopted ID column keeps its name', async ({ front, scene, scenes, rawData }) => {
      await front.open('en');
      await front.startWithFile();
      await scene.detectColumns(ORDERS_CSV);
      await scene.columnNames.first().fill('Nr');
      await scene.columnNames.first().press('Tab');
      await scene.loadData();
      await scenes.activate(ORDERS_CSV.name);
      await rawData.mainToolbar.addScene();
      await scene.selectFile(ORDERS_CSV);

      await scene.adoptColumnsToggle.getByRole('switch').click();
      await scene.detectColumnsButton.click();

      await expect(scene.columnNames.first()).toHaveValue('Nr');
   });

   test('switched off toggle stays off when the scene page is opened again', async ({ front, scene }) => {
      await front.open('en');
      await front.startWithFile();
      await scene.selectFile(ORDERS_CSV);
      await scene.idColumnToggle.click();
      await expect(scene.idColumnToggle).not.toBeChecked();

      await front.open('en');
      await front.startWithFile();
      await scene.selectFile(ORDERS_CSV);

      await expect(scene.idColumnToggle).not.toBeChecked();
   });
});
