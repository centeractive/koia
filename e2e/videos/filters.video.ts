import { Operator } from 'app/shared/model/operator.enum';
import { expect, test } from '../support/fixtures';
import { openSalesScene } from '../support/sales-scene';
import { Texts } from '../support/texts';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const PIVOT_TAB = 'tab1';

test('filters', async ({ page, front, scene, scenes, tabBar, rawData, pivot }) => {
   const recording = new VideoRecording(page, 'filters');
   await openSalesScene(front, scene, scenes);
   await tabBar.addPivotTable();
   await pivot.table.waitFor();
   await pivot.dragFieldToRows('Region');
   await tabBar.openRawData();
   const toolbar = rawData.mainToolbar;
   const expectRows = (count: number) => expect(rawData.table.rowCount).toHaveText(en.rows(count));
   recording.markStart();

   const rangeFilter = await toolbar.addRangeFilter('Quantity', en.get('toolbar.valueRange'));
   await expectRows(240);
   await recording.caption('Add a range filter to a number or time column');

   await rangeFilter.dragMaxBy(-20);
   await expectRows(204);
   await recording.caption('Drag the right end to lower the maximum');

   await rangeFilter.dragMinBy(45);
   await expectRows(112);
   await recording.caption('Drag the left end to raise the minimum');

   await rangeFilter.dragRangeBy(-20);
   await expectRows(105);
   await recording.caption('Drag the range itself to move it');

   await rangeFilter.chooseRangeType(en.get('filter.range.outside'));
   await expectRows(135);
   await recording.caption('Switch to outside range to keep all other rows');

   await rangeFilter.remove();
   await expect(toolbar.rangeFilterPanel.locator('koia-range-filter')).toHaveCount(0);
   await expectRows(240);
   await recording.caption('Remove a filter with its button');

   await toolbar.addValueFilter('Region', 'North;South', en.operator(Operator.ANY_OF));
   await expectRows(122);
   await recording.caption('Text filters offer contains, =, ≠, is any of and more');

   await toolbar.chooseValueFilterOperator(0, en.operator(Operator.NONE_OF));
   await expectRows(118);
   await recording.caption('Change the operator at any time, e.g. to is none of');

   await toolbar.addNumberValueFilter('Unit Price', en.get('toolbar.value'), '3', en.operator(Operator.GREATER_THAN_OR_EQUAL));
   await expectRows(38);
   await recording.caption('Number filters compare values, e.g. unit price >= 3');

   await tabBar.open(PIVOT_TAB);
   await expect(pivot.mainToolbar.valueFilterInputs).toHaveCount(0);
   await expect(pivot.rowLabels).toHaveCount(4);
   await recording.caption('Each tab has its own filters – the pivot shows all regions');

   await tabBar.openRawData();
   await toolbar.toggleLinkedFilters();
   await expect(toolbar.linkFiltersToggle).toHaveAttribute('aria-pressed', 'true');
   await recording.caption('Link the filters to share them with all tabs');

   await tabBar.open(PIVOT_TAB);
   await expect(pivot.mainToolbar.valueFilters).toHaveCount(2);
   await expect(pivot.rowLabels).toHaveText(['East', 'West']);
   await recording.caption('The pivot table now shows the same rows');

   await pivot.mainToolbar.removeValueFilter();
   await expect(pivot.mainToolbar.valueFilters).toHaveCount(1);
   await recording.caption('Remove a filter on any tab…');

   await tabBar.openRawData();
   await expectRows(118);
   await expect(toolbar.valueFilters).toHaveCount(1);
   await recording.caption('…and it is gone on every linked tab');

   await toolbar.toggleLinkedFilters();
   await expect(toolbar.linkFiltersToggle).toHaveAttribute('aria-pressed', 'false');
   await recording.caption('Unlink them to let every tab filter on its own');

   await recording.save();
});
