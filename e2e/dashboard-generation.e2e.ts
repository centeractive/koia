import { rowsOf } from 'app/dashboard/generator/generated-grid';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { StatusType } from 'app/shared/model/status-type.enum';
import { expect, test } from './support/fixtures';
import { DashboardTile } from './support/components/dashboard-tile';
import { LOG_LEVELS_JSON, MONTHLY_TWO_MEASURES_CSV } from './support/import-files';
import { DashboardPage } from './support/pages/dashboard-page';
import { Notifications } from './support/components/notifications';
import { Texts } from './support/texts';

const en = new Texts('en');
const REGENERATIONS = 4;

test('generation and repeated regeneration of sparse data always fill the grid with time chart, summary table and charts',
   async ({ front, scene, scenes, tabBar, dashboard, confirmDialog, notifications }) => {
      await front.open('en');
      await front.startWithFile();
      const dataTypes = await scene.detectColumns(LOG_LEVELS_JSON);
      await scene.loadData();
      await scenes.activate(LOG_LEVELS_JSON.name);
      await tabBar.addDashboard();

      await dashboard.launcher.generateDashboard();
      await expectTimeChartSummaryTableAndCharts(dashboard, notifications);
      for (let i = 0; i < REGENERATIONS; i++) {
         const previousTile = await dashboard.tiles.first().elementHandle();
         await dashboard.regenerate();
         await confirmDialog.confirm();
         await expect.poll(() => previousTile.evaluate(e => e.isConnected)).toBe(false);
         await expectTimeChartSummaryTableAndCharts(dashboard, notifications);
      }

      expect(dataTypes).toEqual(LOG_LEVELS_JSON.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
   });

test('generation of two measures over time adds summary table and scatter chart to time charts',
   async ({ front, scene, scenes, tabBar, dashboard }) => {
      await front.open('en');
      await front.startWithFile();
      await scene.detectColumns(MONTHLY_TWO_MEASURES_CSV);
      await scene.loadData();
      await scenes.activate(MONTHLY_TWO_MEASURES_CSV.name);
      await tabBar.addDashboard();

      await dashboard.launcher.generateDashboard();

      const columns = await dashboard.generatedGridColumns();
      await expect.poll(() => dashboard.occupiedCellCount()).toBeGreaterThan(columns);
      expect(await dashboard.summaryTables.count()).toBeGreaterThanOrEqual(1);
      const chartTypes: ChartType[] = [];
      for (const tile of await dashboard.chartTiles.all()) {
         await new DashboardTile(tile).configure();
         chartTypes.push(await dashboard.sideBar.selectedChartType());
         await dashboard.sideBar.close();
      }
      expect(chartTypes).toContain(ChartType.SCATTER);
   });

async function expectTimeChartSummaryTableAndCharts(dashboard: DashboardPage, notifications: Notifications): Promise<void> {
   const columns = await dashboard.generatedGridColumns();
   await expect.poll(() => dashboard.occupiedCellCount()).toBe(rowsOf(columns) * columns);
   const tableCount = await dashboard.summaryTables.count();
   expect(tableCount).toBeGreaterThanOrEqual(1);
   expect(tableCount).toBeLessThanOrEqual(2);
   expect(await dashboard.chartTiles.count()).toBeGreaterThanOrEqual(2);
   await expect.poll(() => dashboard.tile(0).spans()).toEqual({ columns, rows: 1 });
   await expect(dashboard.tile(0).root.locator('koia-chart')).toHaveCount(1);
   await expect(notifications.pane(StatusType.WARNING)).toHaveCount(0);
}
