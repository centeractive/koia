import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { expect, test } from './support/fixtures';
import { firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const en = new Texts('en');

test.beforeEach(async ({ front, tabBar }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.addDashboard();
});

test('saved view restores custom axis titles', async ({ dashboard, notifications, confirmDialog }) => {
   const panel = en.get('chart.legendAndScales');
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(firstColumnOf(fruitSalesOf('en'), DataType.NUMBER));
   await dashboard.sideBar.switchChartType(ChartType.LINE);
   await dashboard.sideBar.setAxisTitle(panel, en.get('chart.baseScale'), 'Sales day');
   await dashboard.sideBar.setAxisTitle(panel, en.get('chart.valueScale'), 'Sales count');
   await dashboard.sideBar.close();
   await dashboard.mainToolbar.saveView('Axis titles');
   await notifications.dismiss(StatusType.SUCCESS);
   await dashboard.tile(0).remove();

   await dashboard.mainToolbar.restoreView('Axis titles');
   await confirmDialog.confirm();

   await dashboard.tile(0).configure();
   await expect(dashboard.sideBar.axisTitleInput(en.get('chart.baseScale'))).toHaveValue('Sales day');
   await expect(dashboard.sideBar.axisTitleInput(en.get('chart.valueScale'))).toHaveValue('Sales count');
   await dashboard.tile(0).expectChartPainted();
});
