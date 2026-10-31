import { Aggregation } from 'app/shared/model/aggregation.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { Box } from '../support/box';
import { DashboardTile } from '../support/components/dashboard-tile';
import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { openSalesScene } from '../support/sales-scene';
import { SNAP_TOLERANCE_PX } from '../support/snap';
import { Texts } from '../support/texts';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const QUANTITY = 'Quantity';
const DATE = 'Date';
const NOTE = 'Orders per quantity range';
const NOTE_GAP_PX = 16;
const EDGE_TOLERANCE_PX = 1;

function intersect(a: Box, b: Box): boolean {
   return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

function contains(outer: Box, inner: Box): boolean {
   return inner.x >= outer.x - EDGE_TOLERANCE_PX && inner.y >= outer.y - EDGE_TOLERANCE_PX
      && inner.x + inner.width <= outer.x + outer.width + EDGE_TOLERANCE_PX
      && inner.y + inner.height <= outer.y + outer.height + EDGE_TOLERANCE_PX;
}

test('summary tables', async ({ page, front, scene, scenes, tabBar, dashboard, rawDataDialog }) => {
   const recording = new VideoRecording(page, 'summary-tables');
   await openSalesScene(front, scene, scenes);
   recording.markStart();

   await tabBar.addDashboard();
   await dashboard.launcher.addSummary();
   await dashboard.sideBar.selectColumn('Product');
   await recording.caption('Count the distinct values of a column');

   await dashboard.sideBar.dragGroupByColumn('Region');
   await recording.caption('Group the counts, e.g. by region');

   await dashboard.sideBar.close();
   await expect.poll(async () => (await dashboard.tile(0).tableWidths()).columnCount).toBe(3);
   await dashboard.tile(0).firstCountLink.click();
   await recording.caption('Click a count to list its rows');

   await rawDataDialog.close();
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn('Revenue');
   await recording.caption('Numbers are aggregated, e.g. averaged');

   await dashboard.sideBar.selectAggregation(en.summaryAggregation(Aggregation.SUM));
   await recording.caption('Drag in more aggregations, e.g. Sum');

   await dashboard.sideBar.deselectAggregation(en.summaryAggregation(Aggregation.AVG));
   await recording.caption('Drag out the ones you do not need');

   await dashboard.sideBar.selectAggregation(en.summaryAggregation(Aggregation.MAX));
   await dashboard.sideBar.selectAggregation(en.summaryAggregation(Aggregation.MIN));
   await recording.caption('Add others beside the sum, e.g. max and min');

   await dashboard.sideBar.dragGroupByColumn('Channel');
   await recording.caption('Aggregate per group, e.g. per channel');

   await dashboard.sideBar.dragGroupByColumn(DATE);
   await dashboard.sideBar.selectGroupByTimeUnit(DATE, en.get(EnumLabelKeys.groupingTimeUnit(TimeUnit.MONTH)));
   await expect.poll(async () => (await dashboard.tile(1).tableWidths()).columnCount).toBe(5);
   const heights = await dashboard.tile(1).tableHeights();
   expect(heights.maxContent).toBeLessThanOrEqual(heights.scrollerClientWidth);
   await recording.caption('Group by time too, e.g. per month');

   await dashboard.sideBar.close();
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn(QUANTITY);
   await dashboard.sideBar.addValueGrouping(QUANTITY);
   await recording.caption('Count numbers per value range');

   await dashboard.sideBar.close();
   const ranges = new DashboardTile(dashboard.summaryTiles.nth(2));
   await ranges.sortAscendingBy(QUANTITY);
   await recording.caption('Click a header to sort the rows');

   await downloadOf(page, () => ranges.saveAs(en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.CSV)) })));
   await recording.caption('Save a summary table as CSV file');

   const rangesBox = await ranges.root.boundingBox();
   for (const tile of [dashboard.summaryTiles.nth(0), dashboard.summaryTiles.nth(1)]) {
      const box = await tile.boundingBox();
      expect(rangesBox.x).toBeGreaterThan(box.x + box.width - EDGE_TOLERANCE_PX);
   }
   const note = await dashboard.addNote();
   await note.focus();
   await note.type(NOTE);
   await dashboard.pressOutsideTextBoxes();
   await expect(note.paragraphs.first()).toHaveText(NOTE);
   const tableBox = await ranges.summaryTable.boundingBox();
   const noteHeight = (await note.tile.boundingBox()).height;
   expect(rangesBox.y + rangesBox.height - (tableBox.y + tableBox.height)).toBeGreaterThanOrEqual(noteHeight + NOTE_GAP_PX + SNAP_TOLERANCE_PX);
   await note.moveTopLeftTo(tableBox.x, tableBox.y + tableBox.height + NOTE_GAP_PX);
   const noteBox = await note.tile.boundingBox();
   for (const table of await dashboard.summaryTiles.locator('table').all()) {
      expect(intersect(noteBox, await table.boundingBox())).toBe(false);
   }
   expect(contains(rangesBox, noteBox)).toBe(true);
   await recording.caption('Add a note where a table leaves room');

   await recording.save();
});
