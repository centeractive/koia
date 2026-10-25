import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { StatusType } from 'app/shared/model/status-type.enum';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { averageRevenueTourOf, expectAverageRevenueChart } from './support/average-revenue-tour';
import { ChartTitles } from './support/chart-titles';
import { DashboardPage } from './support/pages/dashboard-page';
import { expect, test } from './support/fixtures';
import { columnsOf, firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const VIEW_NAME = 'Monthly rows';
const en = new Texts('en');
const sample = fruitSalesOf('en');
const dateColumn = firstColumnOf(sample, DataType.TIME);
const revenueColumn = columnsOf(sample, DataType.NUMBER)[1];
const quantityColumn = firstColumnOf(sample, DataType.NUMBER);
const regionColumn = firstColumnOf(sample, DataType.TEXT);
const monthTimeUnit = en.get(EnumLabelKeys.timeUnit(TimeUnit.MONTH));
const titles = new ChartTitles(en);
const rowCountTitle = titles.groupedByMonth(titles.rowCount(), dateColumn);

async function addTimeChart(dashboard: DashboardPage, chartType: ChartType): Promise<void> {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.switchChartType(chartType);
   await expect(dashboard.sideBar.groupByField()).toContainText(dateColumn);
}

async function addRowCountChart(dashboard: DashboardPage, chartType = ChartType.LINE): Promise<void> {
   await addTimeChart(dashboard, chartType);
   await dashboard.sideBar.chooseAggregation(en.get('chart.countRows'));
   await dashboard.sideBar.selectTimeUnit(monthTimeUnit);
}

async function addStackedRegionCountChart(dashboard: DashboardPage): Promise<void> {
   await addRowCountChart(dashboard);
   await dashboard.sideBar.selectColumn(regionColumn);
   await expect(dashboard.tile(0).title).toHaveValue(new RegExp('^' + en.get('chart.title.countDistinctValuesOf', { columns: regionColumn })));
   await dashboard.sideBar.setCheckbox(en.get('chart.stacked'), true);
}

async function addQuantitySumSplitByRegionChart(dashboard: DashboardPage): Promise<void> {
   await addTimeChart(dashboard, ChartType.LINEAR_BAR);
   await dashboard.sideBar.selectColumn(quantityColumn);
   await dashboard.sideBar.chooseAggregation(en.get('summary.sideBar.aggregateValues'));
   await dashboard.sideBar.selectTimeUnit(monthTimeUnit);
   await dashboard.sideBar.splitBy(regionColumn);
}

test.beforeEach(async ({ front, tabBar }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.addDashboard();
});

test('line chart of aggregated values shows the average per month', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(revenueColumn);
   await dashboard.sideBar.switchChartType(ChartType.LINE);

   await dashboard.sideBar.chooseAggregation(en.get('summary.sideBar.aggregateValues'));
   await dashboard.sideBar.selectValueAggregation(en.get(EnumLabelKeys.aggregation(Aggregation.AVG)));
   await dashboard.sideBar.selectTimeUnit(en.get(EnumLabelKeys.timeUnit(TimeUnit.MONTH)));

   await expect(dashboard.tile(0).title)
      .toHaveValue(titles.groupedByMonth(titles.aggregationOf(Aggregation.AVG, revenueColumn), dateColumn));
   await dashboard.tile(0).expectChartPainted();
});

test('line chart of counted rows shows the row count per month without data column', async ({ dashboard }) => {
   await addRowCountChart(dashboard);

   await expect(dashboard.tile(0).title).toHaveValue(rowCountTitle);
   for (const column of [...columnsOf(sample, DataType.TEXT), ...columnsOf(sample, DataType.NUMBER)]) {
      await expect(dashboard.sideBar.dataColumnButton(column)).not.toHaveClass(/\bmat-accent\b/);
   }
   await dashboard.tile(0).expectChartPainted();
});

test('saved view restores the row count chart', async ({ dashboard, notifications, confirmDialog }) => {
   await addRowCountChart(dashboard);
   await dashboard.sideBar.close();

   await dashboard.mainToolbar.saveView(VIEW_NAME);
   await notifications.dismiss(StatusType.SUCCESS);
   await dashboard.tile(0).remove();
   await dashboard.mainToolbar.restoreView(VIEW_NAME);
   await confirmDialog.confirm();

   await expect(dashboard.tiles).toHaveCount(1);
   await expect(dashboard.tile(0).title).toHaveValue(rowCountTitle);
   await dashboard.tile(0).expectChartPainted();
});

test('row count chart split by a column titles the split until the split column is removed', async ({ dashboard }) => {
   await addRowCountChart(dashboard);

   await dashboard.sideBar.splitBy(regionColumn);
   await expect(dashboard.tile(0).title).toHaveValue(titles.splitBy(rowCountTitle, regionColumn));
   await dashboard.sideBar.removeSplitColumns();

   await expect(dashboard.tile(0).title).toHaveValue(rowCountTitle);
});

test('stacked checkbox and legend switch keep the state they are set to when set again', async ({ dashboard }) => {
   await addRowCountChart(dashboard);
   const legendAndScales = en.get('chart.legendAndScales');
   const [stacked, showLegend] = [en.get('chart.stacked'), en.get('chart.showLegend')];

   await dashboard.sideBar.setCheckbox(stacked, true);
   await dashboard.sideBar.setCheckbox(stacked, true);
   await dashboard.sideBar.setToggle(legendAndScales, showLegend, false);
   await dashboard.sideBar.setToggle(legendAndScales, showLegend, false);

   await expect(dashboard.sideBar.checkbox(stacked)).toBeChecked();
   await expect(dashboard.sideBar.switchButton(showLegend)).not.toBeChecked();
});

const TOUR_STARTS: { variant: string; addChart: (dashboard: DashboardPage) => Promise<void> }[] = [
   { variant: 'a stacked line chart counting regions per month', addChart: addStackedRegionCountChart },
   { variant: 'linear bars summing quantities per month split by region', addChart: addQuantitySumSplitByRegionChart },
   { variant: 'an area chart counting rows per month', addChart: dashboard => addRowCountChart(dashboard, ChartType.AREA) }
];

for (const { variant, addChart } of TOUR_STARTS) {
   test(`average revenue tour turns ${variant} into unstacked linear bars of the average revenue per month split by channel`,
      async ({ dashboard }) => {
         await addChart(dashboard);

         for (const step of averageRevenueTourOf(dashboard.sideBar, en)) {
            await step.run();
         }

         await expectAverageRevenueChart(dashboard.tile(0), dashboard.sideBar, en);
      });
}
