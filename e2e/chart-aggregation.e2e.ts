import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { StatusType } from 'app/shared/model/status-type.enum';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { DashboardPage } from './support/pages/dashboard-page';
import { expect, test } from './support/fixtures';
import { columnsOf, firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const VIEW_NAME = 'Monthly rows';
const en = new Texts('en');
const sample = fruitSalesOf('en');
const dateColumn = firstColumnOf(sample, DataType.TIME);
const revenueColumn = columnsOf(sample, DataType.NUMBER)[1];
const rowCountTitle = groupedByMonth(en.get(EnumLabelKeys.aggregation(Aggregation.ROW_COUNT)));

function groupedByMonth(title: string): string {
   return en.get('chart.title.groupedBy', { title, columns: dateColumn + ' ' + en.get(EnumLabelKeys.groupingTimeUnit(TimeUnit.MONTH)) });
}

async function addRowCountChart(dashboard: DashboardPage): Promise<void> {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.switchChartType(ChartType.LINE);
   await expect(dashboard.sideBar.groupByField()).toContainText(dateColumn);
   await dashboard.sideBar.chooseAggregation(en.get('chart.countRows'));
   await dashboard.sideBar.selectTimeUnit(en.get(EnumLabelKeys.timeUnit(TimeUnit.MONTH)));
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

   const aggregation = en.get(EnumLabelKeys.aggregation(Aggregation.AVG));
   await expect(dashboard.tile(0).title)
      .toHaveValue(groupedByMonth(en.get('chart.title.aggregationOf', { aggregation, columns: revenueColumn })));
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
