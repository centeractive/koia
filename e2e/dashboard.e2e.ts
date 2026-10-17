import { ChartType } from 'app/shared/model/chart/chart-type';
import { DataType } from 'app/shared/model/data-type.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { StatusType } from 'app/shared/model/status-type.enum';
import { StringUtils } from 'app/shared/utils/string-utils';
import { downloadOf, exportFileName } from './support/downloads';
import { expect, test } from './support/fixtures';
import { firstColumnOf, fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const VIEW_NAME = 'Regions overview';
const en = new Texts('en');
const column = firstColumnOf(fruitSalesOf('en'), DataType.TEXT);

test.beforeEach(async ({ front, tabBar }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.addDashboard();
});

test('switching to pie chart selects its type instead of bar and keeps the chart painted', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(column);

   await dashboard.sideBar.switchChartType(ChartType.PIE);

   await expect(dashboard.sideBar.chartTypeButton(ChartType.PIE)).toHaveClass(/\bmat-accent\b/);
   await expect(dashboard.sideBar.chartTypeButton(ChartType.BAR)).not.toHaveClass(/\bmat-accent\b/);
   await dashboard.tile(0).expectChartPainted();
});

test('count of a summary table opens a raw data dialog with the counted rows', async ({ dashboard, rawDataDialog }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();

   const count = (await dashboard.tile(0).firstCountLink.innerText()).trim();
   await dashboard.tile(0).firstCountLink.click();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.get('ui.rows', { count }));
});

test('double click on the graph root node reveals all rows', async ({ dashboard, rawDataDialog }) => {
   await dashboard.launcher.addGraph();
   await dashboard.sideBar.close();

   await dashboard.tile(0).graphRootNode.dblclick();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(fruitSalesOf('en').entries.length));
});

test('saved view restores the removed element', async ({ dashboard, notifications }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();

   await dashboard.viewToolbar.saveView(VIEW_NAME);
   const message = await notifications.dismiss(StatusType.SUCCESS);
   await dashboard.tile(0).remove();
   await dashboard.viewToolbar.restoreView(VIEW_NAME);

   expect(message).toBe(en.get('view.saved', { name: VIEW_NAME }));
   await expect(dashboard.tiles).toHaveCount(1);
   await expect(dashboard.tile(0).title).toHaveValue(en.get('element.title.dataUndefined'));
});

test('chart is saved as PNG file named after its title', async ({ page, dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   await dashboard.tile(0).expectChartPainted();

   const download = await downloadOf(page, () => dashboard.tile(0).saveAs(
      en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.PNG)) })));

   expect(download.suggestedFilename()).toMatch(exportFileName(en.get('chart.title.countDistinctValuesOf', { columns: column }), ExportFormat.PNG));
});

test('summary table is saved as CSV file named after its title', async ({ page, dashboard }) => {
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn(column);
   await dashboard.sideBar.close();
   await dashboard.tile(0).firstCountLink.waitFor();

   const download = await downloadOf(page, () => dashboard.tile(0).saveAs(
      en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.CSV)) })));

   expect(download.suggestedFilename()).toMatch(exportFileName(en.get('element.title.distinctValuesOf', { column: StringUtils.quote(column) }), ExportFormat.CSV));
});

test('column span widens the tile of the element', async ({ dashboard }) => {
   await dashboard.launcher.addChart();
   await dashboard.sideBar.close();

   await dashboard.tile(0).setColumnSpan(en.get('element.columns', { count: 2 }));

   await expect(dashboard.tile(0).root).toHaveCSS('grid-column-end', 'span 2');
});
