import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { DashboardTile } from '../support/components/dashboard-tile';
import { downloadOf } from '../support/downloads';
import { test } from '../support/fixtures';
import { Texts } from '../support/texts';
import { openSalesScene } from './support/sales-scene';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const REVENUE = 'Revenue';

test('dashboards and charts', async ({ page, front, scene, scenes, tabBar, dashboard }) => {
   const recording = new VideoRecording(page, 'dashboards-and-charts');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addDashboard();
   await recording.caption('A new dashboard starts with this launcher');

   await dashboard.launcher.generateDashboard();
   const gridColumns = await dashboard.generatedGridColumns();
   await recording.caption('Koia can generate a whole dashboard from your data');

   await dashboard.addChart();
   await recording.caption('Add your own chart with the toolbar');
   const chart = new DashboardTile(dashboard.tiles.last());

   await dashboard.sideBar.switchChartType(ChartType.LINE);
   await recording.caption('Choose a chart type, e.g. a line chart');

   await dashboard.sideBar.selectColumn(REVENUE);
   await recording.caption('Select the column to show, e.g. Revenue');

   await dashboard.sideBar.chooseAggregation(en.get('summary.sideBar.aggregateValues'));
   await recording.caption('Aggregate the values per month');

   await dashboard.sideBar.selectValueAggregation(en.get(EnumLabelKeys.aggregation(Aggregation.SUM)));
   await recording.caption('Choose the aggregation, e.g. the sum');

   const scalesPanel = en.get('chart.legendAndScales');
   await dashboard.sideBar.setAxisTitle(scalesPanel, en.get('chart.baseScale'), 'Month');
   await dashboard.sideBar.setAxisTitle(scalesPanel, en.get('chart.valueScale'), REVENUE);
   await recording.caption('Give the axes a title');

   await dashboard.sideBar.switchChartType(ChartType.LINEAR_BAR);
   await recording.caption('Switch the chart type at any time');

   await dashboard.sideBar.close();
   await chart.setColumnSpan(en.get('element.columns', { count: gridColumns }));
   await chart.expectChartPainted();
   await recording.caption('Let the chart span all columns');

   await downloadOf(page, () => chart.saveAs(en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.PNG)) })));
   await recording.caption('Save the chart as PNG image');

   await recording.save();
});
