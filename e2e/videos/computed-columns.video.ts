import { Aggregation } from 'app/shared/model/aggregation.enum';
import { ChartType } from 'app/shared/model/chart/chart-type';
import { ComputeOperator } from 'app/shared/model/compute-operator.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { expect, test } from '../support/fixtures';
import { openSalesScene } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { CAPTION_BAND_PX, VideoRecording } from './support/video-recording';

const en = new Texts('en');
const DASHBOARD_TAB = 'tab1';
const PIVOT_TAB = 'tab2';
const QUANTITY = 'Quantity';
const UNIT_PRICE = 'Unit Price';
const REVENUE = 'Revenue';
const AMOUNT = 'Amount';
const PRICE_PER_ITEM = 'Price per item';
const SALES = 'Sales';
const DATE = 'Date';
const APPLES_AMOUNT = 3250.49;

function formulaLabelOf(operator: ComputeOperator, left: string, right: string): string {
   return en.get('computedColumn.formulaLabel', { formula: en.computeFormula(operator, left, right) });
}

test('computed columns', async ({ page, front, scene, scenes, tabBar, rawData, dashboard, pivot, computedColumnDialog }) => {
   const recording = new VideoRecording(page, 'computed-columns');
   const sideBar = dashboard.sideBar;
   await openSalesScene(front, scene, scenes);
   await tabBar.addDashboard();
   await dashboard.launcher.cancel();
   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await tabBar.openRawData();
   recording.markStart();

   await rawData.viewToolbar.chooseMoreSubmenuItem(en.get('computedColumn.menu'), en.get('computedColumn.new'));
   await expect(computedColumnDialog.nameInput).toBeVisible();
   await recording.caption('Raw data\'s ⋮ menu creates computed columns');

   await computedColumnDialog.selectLeftColumn(QUANTITY);
   await computedColumnDialog.selectOperator(en.computeOperator(ComputeOperator.MULTIPLY));
   await computedColumnDialog.selectRightColumn(UNIT_PRICE);
   await computedColumnDialog.fillName(AMOUNT);
   await expect(computedColumnDialog.formula).toHaveText(formulaLabelOf(ComputeOperator.MULTIPLY, QUANTITY, UNIT_PRICE));
   await recording.caption('Pick two number columns and an operation, then name it');

   await computedColumnDialog.ok();
   await expect(rawData.table.header(AMOUNT)).toHaveAttribute('title', en.computeFormula(ComputeOperator.MULTIPLY, QUANTITY, UNIT_PRICE));
   await recording.caption('Raw data shows its values, the formula as tooltip');

   await tabBar.open(DASHBOARD_TAB);
   await dashboard.addSummary();
   await sideBar.selectColumn(AMOUNT);
   await sideBar.selectAggregation(en.summaryAggregation(Aggregation.SUM));
   await sideBar.deselectAggregation(en.summaryAggregation(Aggregation.AVG));
   await sideBar.dragGroupByColumn('Product');
   await expect.poll(async () => (await dashboard.tile(0).tableWidths()).columnCount).toBe(2);
   await recording.caption('Summarize it like any number, e.g. its sum per product');

   await sideBar.close();
   await dashboard.addChart();
   await sideBar.createComputedColumn();
   await computedColumnDialog.selectLeftColumn(QUANTITY);
   await computedColumnDialog.selectRightColumn(REVENUE);
   await computedColumnDialog.selectOperator(en.computeOperator(ComputeOperator.DIVIDE));
   await expect(computedColumnDialog.formula).toHaveText(formulaLabelOf(ComputeOperator.DIVIDE, QUANTITY, REVENUE));
   await recording.caption('Create one right in a chart\'s side bar');

   await computedColumnDialog.swapOperands();
   await computedColumnDialog.fillName(PRICE_PER_ITEM);
   await expect(computedColumnDialog.formula).toHaveText(formulaLabelOf(ComputeOperator.DIVIDE, REVENUE, QUANTITY));
   await recording.caption('Swap the columns with one click');

   await computedColumnDialog.ok();
   await sideBar.switchChartType(ChartType.LINE);
   await sideBar.selectGroupBy(DATE);
   await sideBar.chooseAggregation(en.get('summary.sideBar.aggregateValues'));
   await sideBar.selectValueAggregation(en.get(EnumLabelKeys.aggregation(Aggregation.AVG)));
   await expect(sideBar.dataColumnButton(PRICE_PER_ITEM)).toHaveClass(/\bmat-accent\b/);
   await expect(sideBar.groupByField()).toContainText(DATE);
   const chart = dashboard.tile(1);
   await chart.expectChartPainted();
   await expect(chart.root).toBeInViewport({ ratio: 1 });
   const chartBox = await chart.root.boundingBox();
   expect(chartBox.y + chartBox.height).toBeLessThanOrEqual(page.viewportSize().height - CAPTION_BAND_PX);
   await recording.caption('The chart averages it per month at once');

   await sideBar.close();
   await tabBar.open(PIVOT_TAB);
   await pivot.dragFieldToRows('Product');
   await pivot.chooseAggregator('Sum', AMOUNT);
   await expect.poll(async () => Number(await pivot.firstRowTotal.getAttribute('data-value'))).toBeCloseTo(APPLES_AMOUNT, 2);
   await recording.caption('Pivot tables sum computed columns at once');

   await pivot.viewToolbar.chooseMoreSubmenuItem(en.get('computedColumn.menu'), AMOUNT);
   await computedColumnDialog.fillName(SALES);
   await computedColumnDialog.ok();
   await expect(pivot.aggregatorAttribute).toHaveValue(SALES);
   await recording.caption('Rename it in any tab…');

   await tabBar.openRawData();
   await expect(rawData.table.header(SALES)).toBeVisible();
   await expect(rawData.table.header(AMOUNT)).toHaveCount(0);
   await recording.caption('…and every tab and saved view follows');

   await recording.save();
});
