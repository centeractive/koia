import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { Texts } from '../support/texts';
import { openSalesScene } from '../support/sales-scene';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const SUM = 'Sum';
const ROW_HEATMAP = 'Row Heatmap';
const ROW_COUNT = 240;

test('pivot tables and export', async ({ page, front, scene, scenes, tabBar, pivot, rawDataDialog }) => {
   const recording = new VideoRecording(page, 'pivot-and-export');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await recording.caption('A new pivot table offers all columns as fields');

   await pivot.dragFieldToRows('Region');
   await recording.caption('Drag a field into the rows');

   await pivot.dragFieldToColumns('Product');
   await recording.caption('… and another one into the columns');

   await pivot.removeValueGrouping(en.get('pivot.sideBar.columnGrouping', { column: 'Revenue' }));
   await recording.caption('Remove the value grouping of Revenue for exact sums');

   await pivot.chooseAggregator(SUM, 'Revenue');
   await recording.caption('Sum up the revenue instead of counting rows');

   await pivot.selectRenderer(ROW_HEATMAP);
   await recording.caption('Choose another renderer, e.g. a heatmap per row');

   await pivot.columnTotalsButton.click();
   await recording.caption('Hide the column totals with one click');

   await pivot.valueCells.first().click();
   await expect.poll(() => rawDataDialog.table.rowCountValue()).toBeLessThan(ROW_COUNT);
   expect(await rawDataDialog.table.rowCountValue()).toBeGreaterThan(0);
   await recording.caption('Click a value to see the rows it sums up');
   await rawDataDialog.close();

   await pivot.dragFieldToRows('Date (per month)');
   await recording.caption('Dates are grouped per month');

   await pivot.setTimeUnit('Date', en.get('pivot.timeUnit.year'));
   await recording.caption('Switch the time unit, e.g. to years');

   await pivot.mainToolbar.addValueFilter('Channel', 'Online');
   await recording.caption('Filter the data, e.g. online sales only');

   await pivot.pagingToggles.landscapeButton.click();
   await expect(pivot.sheets.first()).toBeVisible();
   await recording.caption('Preview the pivot table as printable pages');
   await pivot.pagingToggles.monitorButton.click();

   await downloadOf(page, () => pivot.viewToolbar.chooseMoreMenuItem(en.get('pivot.saveAsExcel')));
   await recording.caption('Save the pivot table as Excel file');

   await recording.save();
});
