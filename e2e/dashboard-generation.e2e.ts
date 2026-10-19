import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { StatusType } from 'app/shared/model/status-type.enum';
import { expect, test } from './support/fixtures';
import { LOG_LEVELS_JSON } from './support/import-files';
import { DashboardPage } from './support/pages/dashboard-page';
import { Notifications } from './support/components/notifications';
import { Texts } from './support/texts';

const en = new Texts('en');
const REGENERATIONS = 4;

test('generation and repeated regeneration of sparse data always fill two rows with time chart and three small charts',
   async ({ front, scene, scenes, tabBar, dashboard, confirmDialog, notifications }) => {
      await front.open('en');
      await front.startWithFile();
      const dataTypes = await scene.detectColumns(LOG_LEVELS_JSON);
      await scene.loadData();
      await scenes.activate(LOG_LEVELS_JSON.name);
      await tabBar.addDashboard();

      await dashboard.launcher.generateDashboard();
      await expectTimeChartAndThreeSmallCharts(dashboard, notifications);
      for (let i = 0; i < REGENERATIONS; i++) {
         const previousTile = await dashboard.tiles.first().elementHandle();
         await dashboard.regenerate();
         await confirmDialog.confirm();
         await expect.poll(() => previousTile.evaluate(e => e.isConnected)).toBe(false);
         await expectTimeChartAndThreeSmallCharts(dashboard, notifications);
      }

      expect(dataTypes).toEqual(LOG_LEVELS_JSON.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
   });

async function expectTimeChartAndThreeSmallCharts(dashboard: DashboardPage, notifications: Notifications): Promise<void> {
   await expect(dashboard.tiles).toHaveCount(4);
   const columns = await dashboard.generatedGridColumns();
   await expect.poll(() => dashboard.occupiedCellCount()).toBe(2 * columns);
   await expect.poll(() => dashboard.tile(0).spans()).toEqual({ columns, rows: 1 });
   await expect(dashboard.tile(0).root.locator('koia-chart')).toHaveCount(1);
   await expect(notifications.pane(StatusType.WARNING)).toHaveCount(0);
}
