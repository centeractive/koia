import { ComputeOperator } from 'app/shared/model/compute-operator.enum';
import { DataType } from 'app/shared/model/data-type.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { TabBar } from './support/components/tab-bar';
import { expect, test } from './support/fixtures';
import { columnsOf, fruitSalesOf, pivotTabOf } from './support/fruit-sales-sample';
import { PivotPage } from './support/pages/pivot-page';
import { Texts } from './support/texts';

const RENAMED_COLUMN = 'Share';
const SUM = 'Sum';
const en = new Texts('en');
const sample = fruitSalesOf('en');
const pivotTab = pivotTabOf(sample);
const [quantity, revenue] = columnsOf(sample, DataType.NUMBER);
const defaultName = en.computeFormula(ComputeOperator.PERCENTAGE, quantity, revenue);
const menu = en.get('computedColumn.menu');
const newItem = en.get('computedColumn.new');

async function openPivot(tabBar: TabBar, pivot: PivotPage): Promise<void> {
   await tabBar.open(pivotTab.id);
   await pivot.valueCells.first().waitFor();
}

test.beforeEach(async ({ front }) => {
   await front.open('en');
   await front.openSample();
});

test('computed column created in the more menu of raw data is shown with its formula as header title', async ({ rawData, computedColumnDialog }) => {
   await rawData.viewToolbar.chooseMoreSubmenuItem(menu, newItem);

   await computedColumnDialog.ok();

   await expect(rawData.table.header(defaultName)).toHaveAttribute('title', defaultName);
});

test('computed column edited in the more menu of raw data renames its header', async ({ rawData, computedColumnDialog }) => {
   await rawData.viewToolbar.chooseMoreSubmenuItem(menu, newItem);
   await computedColumnDialog.ok();

   await rawData.viewToolbar.chooseMoreSubmenuItem(menu, defaultName);
   await computedColumnDialog.fillName(RENAMED_COLUMN);
   await computedColumnDialog.ok();

   await expect(rawData.table.header(RENAMED_COLUMN)).toBeVisible();
   await expect(rawData.table.header(defaultName)).toHaveCount(0);
});

test('computed column deleted in the more menu of raw data removes its header', async ({ rawData, computedColumnDialog, confirmDialog }) => {
   await rawData.viewToolbar.chooseMoreSubmenuItem(menu, newItem);
   await computedColumnDialog.ok();

   await rawData.viewToolbar.chooseMoreSubmenuItem(menu, defaultName);
   await computedColumnDialog.delete();
   await confirmDialog.confirm();

   await expect(rawData.table.header(quantity)).toBeVisible();
   await expect(rawData.table.header(defaultName)).toHaveCount(0);
});

test('computed column created in the more menu of a pivot table is a row field whose cells warn instead of revealing raw data', async ({ page, tabBar, pivot, computedColumnDialog, notifications }) => {
   await openPivot(tabBar, pivot);
   await pivot.viewToolbar.chooseMoreSubmenuItem(menu, newItem);
   await computedColumnDialog.ok();

   await pivot.dragFieldToRows(defaultName);
   await pivot.valueCells.first().click();

   expect(await notifications.dismiss(StatusType.WARNING)).toBe(en.get('computedColumn.noRawData', { column: defaultName }));
   await expect(page.locator('koia-raw-data-dialog')).toHaveCount(0);
});

test('value cell of a pivot table aggregating a computed column reveals its rows', async ({ tabBar, pivot, computedColumnDialog, rawDataDialog }) => {
   await openPivot(tabBar, pivot);
   await pivot.viewToolbar.chooseMoreSubmenuItem(menu, newItem);
   await computedColumnDialog.ok();

   await pivot.chooseAggregator(SUM, defaultName);
   await pivot.valueCells.first().click();

   await expect(pivot.aggregatorAttribute).toHaveValue(defaultName);
   await expect.poll(() => rawDataDialog.table.rowCountValue()).toBeLessThan(sample.entries.length);
   expect(await rawDataDialog.table.rowCountValue()).toBeGreaterThan(0);
});

test('computed column renamed in raw data renames the row field of the cached pivot table', async ({ tabBar, pivot, rawData, computedColumnDialog }) => {
   await openPivot(tabBar, pivot);
   await pivot.viewToolbar.chooseMoreSubmenuItem(menu, newItem);
   await computedColumnDialog.ok();
   await pivot.dragFieldToRows(defaultName);
   await tabBar.openRawData();

   await rawData.viewToolbar.chooseMoreSubmenuItem(menu, defaultName);
   await computedColumnDialog.fillName(RENAMED_COLUMN);
   await computedColumnDialog.ok();
   await tabBar.open(pivotTab.id);

   await expect(pivot.rowField(RENAMED_COLUMN)).toBeVisible();
   await expect(pivot.rowField(defaultName)).toHaveCount(0);
});
