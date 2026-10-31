import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { Texts } from '../support/texts';
import { openSalesScene } from '../support/sales-scene';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const SUM = 'Sum';
const ROW_HEATMAP = 'Row Heatmap';
const ROW_COUNT = 240;
const QUANTITY_RANGES = ['min - 20', '20 - 40', '40 - 60', '60 - 80', '80 - 100', '100 - max'];

test('pivot tables and export', async ({ page, front, scene, scenes, tabBar, pivot, rawDataDialog }) => {
   const recording = new VideoRecording(page, 'pivot-and-export');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await recording.caption('A new pivot table offers all columns as fields');

   await pivot.dragFieldToRows('Region');
   await recording.caption('Drag a field into the rows');

   await pivot.dragFieldToColumns('Quantity');
   await expect(pivot.columnLabels).toHaveText(QUANTITY_RANGES);
   await recording.caption('Numbers come in ranges, e.g. quantities in steps of 20');

   await pivot.removeValueGrouping(en.get('pivot.sideBar.columnGrouping', { column: 'Revenue' }));
   await pivot.chooseAggregator(SUM, 'Revenue');
   await recording.caption('Remove Revenue\'s ranges to sum its exact values');

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
   await recording.caption('Switch the time unit, e.g. to years – 2025 vs. 2026');

   await pivot.mainToolbar.addValueFilter('Channel', 'Store');
   await recording.caption('Filter the data, e.g. store sales only');

   await downloadOf(page, () => pivot.viewToolbar.chooseMoreMenuItem(en.get('pivot.saveAsExcel')));
   await recording.caption('Save the pivot table as Excel file');

   await recording.save();
});
