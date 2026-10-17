import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { expect, test } from './support/fixtures';
import { IMPORT_FILES, SEMICOLON_ORDERS_CSV } from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');

for (const file of IMPORT_FILES) {
   test(`${file.sourceName} file is imported with detected column types and all its rows`, async ({ front, scene, scenes, rawData }) => {
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
