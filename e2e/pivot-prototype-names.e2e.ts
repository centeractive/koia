import { expect, test } from './support/fixtures';
import { PROTOTYPE_VALUES_CSV } from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');
const LEVELS = ['INFO', '__proto__', 'constructor', 'hasOwnProperty', 'toString'];

test('pivot table counts values named like Object.prototype members and their row total reveals their rows',
   async ({ front, scene, scenes, tabBar, pivot, rawDataDialog }) => {
      await front.open('en');
      await front.startWithFile();
      await scene.detectColumns(PROTOTYPE_VALUES_CSV);
      await scene.loadData();
      await scenes.activate(PROTOTYPE_VALUES_CSV.name);
      await tabBar.addPivotTable();
      await pivot.table.waitFor();

      await pivot.dragFieldToRows('Level');

      await expect(pivot.rowLabels).toHaveText(LEVELS);
      await expect(pivot.rowTotals).toHaveText(['2', '1', '1', '1', '1']);
      await pivot.rowTotals.nth(LEVELS.indexOf('constructor')).click();
      await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(1));
   });
