import { ChartType } from 'app/shared/model/chart/chart-type';
import { ComputeOperator } from 'app/shared/model/compute-operator.enum';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { StatusType } from 'app/shared/model/status-type.enum';
import { Locator } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { columnsOf, fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const VIEW_NAME = 'Shares';
const RENAMED_COLUMN = 'Share';
const en = new Texts('en');
const [quantity, revenue] = columnsOf(fruitSalesOf('en'), DataType.NUMBER);
const defaultName = formulaOf(ComputeOperator.PERCENTAGE);

function formulaOf(operator: ComputeOperator): string {
   return en.get(EnumLabelKeys.computeOperatorFormula(operator), { left: quantity, right: revenue });
}

function operatorLabelOf(operator: ComputeOperator): string {
   return en.get(EnumLabelKeys.computeOperator(operator));
}

function editLabelOf(name: string): string {
   return en.get('computedColumn.edit', { name });
}

async function numberOf(cell: Locator): Promise<number> {
   await expect(cell).not.toBeEmpty();
   return Number((await cell.innerText()).replace(/,/g, ''));
}

test.beforeEach(async ({ front, tabBar }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.addDashboard();
});

test('computed column created in the chart side bar is selected and painted', async ({ dashboard, computedColumnDialog }) => {
   await dashboard.launcher.addChart();

   await dashboard.sideBar.createComputedColumn();
   await expect(computedColumnDialog.nameInput).toHaveValue(defaultName);
   await computedColumnDialog.ok();

   await expect(dashboard.sideBar.dataColumnButton(defaultName)).toHaveClass(/\bmat-accent\b/);
   await dashboard.tile(0).expectChartPainted();
});

test('computed column is shown in raw data with its formula as header title and computed values', async ({ dashboard, computedColumnDialog, tabBar, rawData }) => {
   const formula = formulaOf(ComputeOperator.MULTIPLY);
   await dashboard.launcher.addChart();
   await dashboard.sideBar.createComputedColumn();
   await computedColumnDialog.selectOperator(operatorLabelOf(ComputeOperator.MULTIPLY));
   await computedColumnDialog.ok();
   await dashboard.sideBar.close();

   await tabBar.openRawData();
   const q = await numberOf(await rawData.table.cell(0, quantity));
   const r = await numberOf(await rawData.table.cell(0, revenue));

   await expect(rawData.table.header(formula)).toHaveAttribute('title', formula);
   await expect(await rawData.table.cell(0, formula)).toHaveText(en.number(q * r));
});

test('computed column is not offered as a filter', async ({ page, dashboard, computedColumnDialog, tabBar, rawData }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.createComputedColumn();
   await computedColumnDialog.ok();
   await dashboard.sideBar.close();
   await tabBar.openRawData();

   await rawData.mainToolbar.addFilterButton.click();

   await expect(page.getByRole('menuitem', { name: quantity, exact: true })).toBeVisible();
   await expect(page.getByRole('menuitem', { name: defaultName, exact: true })).toHaveCount(0);
});

test('editing the operator of a computed column changes its formula', async ({ dashboard, computedColumnDialog }) => {
   const formula = formulaOf(ComputeOperator.DIVIDE);
   await dashboard.launcher.addChart();
   await dashboard.sideBar.createComputedColumn();
   await computedColumnDialog.ok();

   await dashboard.sideBar.editComputedColumn(editLabelOf(defaultName));
   await computedColumnDialog.selectOperator(operatorLabelOf(ComputeOperator.DIVIDE));
   await computedColumnDialog.ok();
   await dashboard.sideBar.editComputedColumn(editLabelOf(formula));

   await expect(computedColumnDialog.formula).toHaveText(en.get('computedColumn.formulaLabel', { formula }));
   await computedColumnDialog.cancel();
});

test('renaming a computed column updates the element and the saved view', async ({ dashboard, computedColumnDialog, notifications, confirmDialog }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.createComputedColumn();
   await computedColumnDialog.ok();
   await dashboard.sideBar.close();
   await dashboard.mainToolbar.saveView(VIEW_NAME);
   await notifications.dismiss(StatusType.SUCCESS);

   await dashboard.tile(0).configure();
   await dashboard.sideBar.editComputedColumn(editLabelOf(defaultName));
   await computedColumnDialog.fillName(RENAMED_COLUMN);
   await computedColumnDialog.ok();

   await expect(dashboard.sideBar.dataColumnButton(defaultName)).toHaveCount(0);
   await expect(dashboard.sideBar.dataColumnButton(RENAMED_COLUMN)).toBeVisible();
   await dashboard.sideBar.close();
   await dashboard.tile(0).remove();
   await dashboard.mainToolbar.restoreView(VIEW_NAME);
   await confirmDialog.confirm();
   await expect(dashboard.tile(0).title).toHaveValue(en.get('chart.title.countDistinctValuesOf', { columns: RENAMED_COLUMN }));
});

test('deleting a computed column removes it from the element', async ({ dashboard, computedColumnDialog, confirmDialog }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.createComputedColumn();
   await computedColumnDialog.ok();

   await dashboard.sideBar.editComputedColumn(editLabelOf(defaultName));
   await computedColumnDialog.delete();
   const question = await confirmDialog.confirm();

   expect(question).toBe(en.get('computedColumn.deleteQuestion', { name: defaultName }));
   await expect(dashboard.sideBar.dataColumnButton(defaultName)).toHaveCount(0);
   await expect(dashboard.tile(0).title).toHaveValue(en.get('element.title.dataUndefined'));
});

test('clicking a count distinct value of a computed column warns instead of revealing raw data', async ({ page, dashboard, computedColumnDialog, notifications }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.createComputedColumn();
   await computedColumnDialog.ok();
   await dashboard.sideBar.switchChartType(ChartType.PIE);
   await dashboard.sideBar.toggle(en.get('chart.legendAndLabels'), en.get('chart.showLegend'));
   await dashboard.sideBar.close();

   await dashboard.tile(0).clickChartNearBottomCenter();

   expect(await notifications.dismiss(StatusType.WARNING)).toBe(en.get('computedColumn.noRawData', { column: defaultName }));
   await expect(page.locator('koia-raw-data-dialog')).toHaveCount(0);
});
