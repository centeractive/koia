import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { expect, test } from './support/fixtures';
import {
   CODES_CSV, DUPLICATE_HEADERS_CSV, EPOCH_MILLIS_CSV, IMPORT_FILES, MISSING_TIMES_CSV, MIXED_DATES_CSV,
   ORDERS_WITH_ID_CSV, SEMICOLON_ORDERS_CSV
} from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');

for (const file of IMPORT_FILES) {
   test(`${file.sourceName} file ${file.name} is imported with detected column types and all its rows`, async ({ front, scene, scenes, rawData }) => {
      await front.open('en');
      await front.startWithFile();

      const dataTypes = await scene.detectColumns(file);
      const panelsExpanded = await scene.panels.evaluateAll(panels => panels.map(p => p.classList.contains('mat-expanded')));
      const message = await scene.loadData();
      await scenes.activate(file.name);

      expect(dataTypes).toEqual(file.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
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

   expect(dataTypes).toEqual(file.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
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
      await front.open('en');
      await front.startWithFile();

      const dataTypes = await scene.detectColumns(file);
      await scene.loadData();
      await scenes.activate(file.name);

      expect(dataTypes).toEqual(file.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
      await expect(rawData.table.rowCount).toHaveText(en.rows(file.rowCount));
      await expect(await rawData.table.cell(0, 'Code')).toHaveText('00123');
      await expect(await rawData.table.cell(0, 'Hex')).toHaveText('0x1A');
      await expect(await rawData.table.cell(1, 'Amount')).toHaveText('');
      await expect(await rawData.table.cell(2, 'Amount')).toHaveText('12');
   });

test('CSV file with duplicate and empty headers is imported with unique column names', async ({ front, scene, scenes, rawData }) => {
   const file = DUPLICATE_HEADERS_CSV;
   await front.open('en');
   await front.startWithFile();

   await scene.detectColumns(file);
   await scene.loadData();
   await scenes.activate(file.name);

   await expect(rawData.table.headers).toHaveText(['Item', 'Item (2)', 'Column 3', 'Amount']);
   await expect(await rawData.table.cell(0, 'Item')).toHaveText('Apples');
   await expect(await rawData.table.cell(0, 'Item (2)')).toHaveText('Green');
});

test('date neither matching the detected format nor ISO 8601 is reported in the preview', async ({ front, scene }) => {
   await front.open('en');
   await front.startWithFile();

   const dataTypes = await scene.detectColumns(MIXED_DATES_CSV);

   expect(dataTypes).toEqual(MIXED_DATES_CSV.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
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
      await front.open('en');
      await front.startWithFile();
      await scene.detectColumns(MISSING_TIMES_CSV);
      await scene.loadData();
      await scenes.activate(MISSING_TIMES_CSV.name);
      await tabBar.addDashboard();
      await dashboard.launcher.addSummary();
      await dashboard.sideBar.selectColumn('Item');
      await dashboard.sideBar.dragGroupByColumn('Shipped');
      await dashboard.sideBar.selectGroupByTimeUnit('Shipped', en.get(EnumLabelKeys.groupingTimeUnit(TimeUnit.MONTH)));
      await dashboard.sideBar.close();

      await dashboard.tile(0).root.locator('tr.mat-mdc-row').filter({ hasText: 'Pears' }).locator('td.td_aggregation a').click();

      await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(1));
   });
