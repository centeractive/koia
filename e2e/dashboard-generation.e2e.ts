import { rowsOf } from 'app/dashboard/generator/generated-grid';
import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { StatusType } from 'app/shared/model/status-type.enum';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { SUMMARY_TABLE_STYLE } from 'app/summary-table/summary-table-style';
import { averageRevenueTourOf, expectAverageRevenueChart } from './support/average-revenue-tour';
import { expect, test } from './support/fixtures';
import { DashboardTile } from './support/components/dashboard-tile';
import { ChartTitles } from './support/chart-titles';
import { CUMULATIVE_DOSES_CSV, ImportFile, LOG_LEVELS_JSON, MONTHLY_TWO_MEASURES_CSV, SMALL_ORDERS_CSV, YEARLY_GREENHOUSE_CSV } from './support/import-files';
import { ID_COLUMN } from './support/id-column';
import { openLogSampleScene } from './support/log-sample';
import { FrontPage } from './support/pages/front-page';
import { ScenePage } from './support/pages/scene-page';
import { ScenesPage } from './support/pages/scenes-page';
import { TabBar } from './support/components/tab-bar';
import { DashboardPage } from './support/pages/dashboard-page';
import { Notifications } from './support/components/notifications';
import { openSalesScene } from './support/sales-scene';
import { Texts } from './support/texts';

const en = new Texts('en');
const titles = new ChartTitles(en);
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

      expect(dataTypes).toEqual(en.dataTypes(LOG_LEVELS_JSON.dataTypes));
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

test('average revenue tour turns the generated time chart of the sales data shrunk by two columns into unstacked linear bars of the average '
   + 'revenue per month split by channel', async ({ front, scene, scenes, tabBar, dashboard }) => {
   await openSalesScene(front, scene, scenes);
   await tabBar.addDashboard();
   await dashboard.launcher.generateDashboard();
   const columns = await dashboard.generatedGridColumns();
   const chart = dashboard.tile(0);
   const box = await chart.root.boundingBox();

   await chart.startResizeBy(-2 * (box.width + DashboardPage.GRID_GAP_PX) / columns, 0);
   await chart.release();
   await expect.poll(() => chart.spans()).toEqual({ columns: columns - 2, rows: 1 });
   await chart.configure();
   await expect(chart.root).toBeInViewport({ ratio: 1 });
   for (const step of averageRevenueTourOf(dashboard.sideBar, en)) {
      await step.run();
   }

   await expect(chart.root).toBeInViewport({ ratio: 1 });
   await expectAverageRevenueChart(chart, dashboard.sideBar, en);
});

test('generated summary tables of sales data render the estimated height when they fit their tile width',
   async ({ front, scene, scenes, tabBar, dashboard, confirmDialog }) => {
      const { headerHeight, firstRowHeight, rowHeight, footerHeight } = SUMMARY_TABLE_STYLE;
      await openSalesScene(front, scene, scenes);
      await tabBar.addDashboard();
      let checkedTables = 0;

      for (let i = 0; i <= 3; i++) {
         if (i === 0) {
            await dashboard.launcher.generateDashboard();
         } else {
            const previousTile = await dashboard.tiles.first().elementHandle();
            await dashboard.regenerate();
            await confirmDialog.confirm();
            await expect.poll(() => previousTile.evaluate(e => e.isConnected)).toBe(false);
         }
         await expect(dashboard.summaryTiles.first()).toBeVisible();
         for (const summaryTile of await dashboard.summaryTiles.all()) {
            const heights = await new DashboardTile(summaryTile).tableHeights();
            if (heights.maxContent <= heights.scrollerClientWidth) {
               expect(heights.table).toBeCloseTo(headerHeight + firstRowHeight + (heights.rows.length - 1) * rowHeight + footerHeight, 0);
               checkedTables++;
            }
         }
      }

      expect(checkedTables).toBeGreaterThan(0);
   });

async function generateFrom(file: ImportFile, front: FrontPage, scene: ScenePage, scenes: ScenesPage, tabBar: TabBar,
   dashboard: DashboardPage): Promise<void> {
   await front.open('en');
   await front.startWithFile();
   await scene.detectColumns(file);
   await scene.loadData();
   await scenes.activate(file.name);
   await tabBar.addDashboard();
   await dashboard.launcher.generateDashboard();
}

async function tileTitles(dashboard: DashboardPage): Promise<string[]> {
   const titleValues: string[] = [];
   for (const tile of await dashboard.tiles.all()) {
      titleValues.push(await new DashboardTile(tile).title.inputValue());
   }
   return titleValues;
}

test('generation of running totals features their daily sum, summarizes their latest values and charts no counts',
   async ({ front, scene, scenes, tabBar, dashboard, notifications }) => {
   await generateFrom(CUMULATIVE_DOSES_CSV, front, scene, scenes, tabBar, dashboard);

   const columns = await dashboard.generatedGridColumns();
   await expect.poll(() => dashboard.occupiedCellCount()).toBe(rowsOf(columns) * columns);
   const dailySum = (measures: string) => titles.groupedBy(titles.aggregationOf(Aggregation.SUM, measures), 'Date', TimeUnit.DAY);
   const singles = ['First Doses', 'Second Doses'].flatMap(m => [dailySum(m), titles.splitBy(dailySum(m), 'Gender'),
      titles.splitBy(dailySum(m), 'Age Class')]);
   expect([...singles, dailySum('First Doses, Second Doses')]).toContain(await dashboard.tile(0).title.inputValue());
   const countLabels = [titles.rowCount(), en.get('chart.title.countDistinctValuesOf', { columns: '' }).trim()];
   const titleValues = await tileTitles(dashboard);
   titleValues.forEach(title => countLabels.forEach(label => expect(title).not.toContain(label)));
   const latestValues = ['First Doses', 'Second Doses'].map(m => titles.aggregationOf(Aggregation.MAX, m));
   expect(titleValues.some(title => latestValues.some(latest => title.startsWith(latest)))).toBe(true);
   const tables = await dashboard.summaryTables.all();
   expect(tables.length).toBeGreaterThanOrEqual(1);
   expect(tables.length).toBeLessThanOrEqual(2);
   for (const table of tables) {
      const headers = (await table.locator('th.mat-mdc-header-cell').allInnerTexts()).map(h => h.trim());
      expect(headers).toEqual(expect.arrayContaining(['Gender', 'Age Class', en.summaryAggregation(Aggregation.MAX)]));
   }
   await expect(notifications.pane(StatusType.WARNING)).toHaveCount(0);
});

test('generation of yearly measures imported as years features a time chart over the years', async ({ front, scene, scenes, tabBar, dashboard }) => {
   await generateFrom(YEARLY_GREENHOUSE_CSV, front, scene, scenes, tabBar, dashboard);

   const columns = await dashboard.generatedGridColumns();
   await expect.poll(() => dashboard.occupiedCellCount()).toBeGreaterThan(columns);
   expect(['CH4 (ppb) by Year AD', 'CO2 (ppm) by Year AD', 'CH4 (ppb), CO2 (ppm) by Year AD'])
      .toContain(await dashboard.tile(0).title.inputValue());
});

test.describe('with ID column', () => {

   test.use({ idColumnOffAtFirst: false });

   test('generated dashboard of a small scene never uses its ID column', async ({ front, scene, scenes, tabBar, dashboard }) => {
      await generateFrom(SMALL_ORDERS_CSV, front, scene, scenes, tabBar, dashboard);

      await expect(dashboard.tiles.first()).toBeVisible();
      const idWord = new RegExp('\\b' + ID_COLUMN + '\\b');
      (await tileTitles(dashboard)).forEach(title => expect(title).not.toMatch(idWord));
      for (const header of await dashboard.summaryTables.locator('th.mat-mdc-header-cell').allInnerTexts()) {
         expect(header).not.toMatch(idWord);
      }
   });
});

for (const [sampleName, openSample] of [
   ['fruit sales', async (front: FrontPage) => { await front.open('en'); await front.openSample(); }],
   ['app logs', openLogSampleScene]
] as [string, (front: FrontPage) => Promise<void>][]) {
   test(`generation and repeated regeneration of the ${sampleName} sample always fill the grid with time chart, summary table and charts`,
      async ({ front, tabBar, dashboard, confirmDialog, notifications }) => {
         await openSample(front);
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
      });
}
