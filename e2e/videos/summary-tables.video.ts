import { Aggregation } from 'app/shared/model/aggregation.enum';
import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { TimeUnit } from 'app/shared/model/time-unit.enum';
import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { Texts } from '../support/texts';
import { openSalesScene } from '../support/sales-scene';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const QUANTITY = 'Quantity';
const DATE = 'Date';
const NOTE = 'Fruit sales per channel and month';

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
   await recording.caption('Click a count to see its rows');

   await rawDataDialog.close();
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn('Revenue');
   await recording.caption('Numbers are aggregated, e.g. averaged');

   await dashboard.sideBar.selectAggregation(en.summaryAggregation(Aggregation.SUM));
   await recording.caption('Drag in more aggregations, e.g. Sum');

   await dashboard.sideBar.deselectAggregation(en.summaryAggregation(Aggregation.AVG));
   await recording.caption('Drag out the ones you do not need');

   await dashboard.sideBar.dragGroupByColumn('Channel');
   await recording.caption('Aggregate per group, e.g. per channel');

   await dashboard.sideBar.dragGroupByColumn(DATE);
   await dashboard.sideBar.selectGroupByTimeUnit(DATE, en.get(EnumLabelKeys.groupingTimeUnit(TimeUnit.MONTH)));
   await expect.poll(async () => (await dashboard.tile(1).tableWidths()).columnCount).toBe(3);
   await recording.caption('Group by time too, e.g. per month');

   await dashboard.sideBar.close();
   await dashboard.addSummary();
   await dashboard.sideBar.selectColumn(QUANTITY);
   await dashboard.sideBar.addValueGrouping(QUANTITY);
   await recording.caption('Count numbers per value range');

   await dashboard.sideBar.close();
   const ranges = dashboard.tile(2);
   await ranges.sortAscendingBy(QUANTITY);
   await recording.caption('Click a header to sort the rows');

   await downloadOf(page, () => ranges.saveAs(en.get('element.saveAs', { format: en.get(EnumLabelKeys.exportFormat(ExportFormat.CSV)) })));
   await recording.caption('Save a summary table as CSV file');

   const note = await dashboard.addNote();
   await note.focus();
   await note.type(NOTE);
   await dashboard.pressOutsideTextBoxes();
   await expect(note.paragraphs.first()).toHaveText(NOTE);
   await recording.caption('Add a note to explain your findings');

   await recording.save();
});
