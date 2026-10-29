import { expect, test } from './support/fixtures';
import { columnValuesOf, fruitSalesOf } from './support/fruit-sales-sample';
import { RECORDED_VIDEO, VIDEO_SIZE } from './support/video-options';

const REGION = 'Region';

test.use({ viewport: VIDEO_SIZE, video: RECORDED_VIDEO });

test('recorded drag glides a pivot field into the rows', async ({ front, tabBar, pivot }) => {
   await front.open('en');
   await front.openSample();
   await tabBar.addPivotTable();
   await pivot.table.waitFor();

   await pivot.dragFieldToRows(REGION);

   const regions = [...new Set(columnValuesOf<string>(fruitSalesOf('en'), REGION))].sort();
   await expect.poll(async () => (await pivot.rowLabels.allInnerTexts()).sort()).toEqual(regions);
});
