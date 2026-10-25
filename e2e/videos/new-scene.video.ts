import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { SALES_CSV } from '../support/import-files';
import { Texts } from '../support/texts';
import { VideoRecording } from './support/video-recording';

const en = new Texts('en');
const REVENUE = 'Revenue';

test('creating a new scene', async ({ page, front, scene, scenes, rawData }) => {
   const recording = new VideoRecording(page, 'new-scene');
   await front.open('en');
   await front.dismissCouchDBTip();
   recording.markStart();
   await recording.caption('Koia runs in your browser – your data stays on your machine');

   await front.startWithFile();
   await recording.caption('Choose CSV and pick your file');

   await scene.selectFile(SALES_CSV);
   await recording.caption('Koia shows a sample of the file content');

   await scene.detectColumnsButton.click();
   await scene.dataTypes.first().waitFor();
   await recording.caption('Column names and data types are detected');
   await recording.caption('Adjust names, types or formats if needed');

   await scene.loadData();
   await recording.caption('The data is stored in your browser');

   await scenes.activate(SALES_CSV.name);
   await recording.caption('Your new scene opens in the raw data view');

   await rawData.table.sortBy(REVENUE);
   await recording.caption('Click a header to sort, e.g. by revenue');

   await rawData.table.sortBy(REVENUE);
   await expect(rawData.table.sortIndicator(REVENUE)).toHaveText(SORT_INDICATORS.desc);
   await recording.caption('Click it again to sort descending');

   const rangeFilter = await rawData.mainToolbar.addRangeFilter('Quantity', en.get('toolbar.valueRange'));
   await recording.caption('Filter a number column by a value range');

   await rangeFilter.moveMinToMax();
   await expect(rawData.table.rowCount).toHaveText(en.rows(2));
   await recording.caption('Narrow the range, e.g. to the largest quantity');

   await rangeFilter.remove();
   await expect(rawData.table.rowCount).toHaveText(en.rows(240));
   await recording.caption('Remove a filter with its close button');

   await rawData.mainToolbar.addValueFilter('Region', 'West');
   await expect(rawData.table.rowCount).toHaveText(en.rows(69));
   await recording.caption('Filter by a value, e.g. the region West');

   await rawData.pagingToggles.landscapeButton.click();
   await expect(rawData.sheets.first()).toBeVisible();
   await recording.caption('Preview the rows as printable pages');
   await rawData.pagingToggles.monitorButton.click();

   await downloadOf(page, () => rawData.viewToolbar.chooseMoreMenuItem(en.get('rawData.saveAs', { format: ExportFormat.CSV })));
   await recording.caption('Save the rows as CSV, JSON or Excel file');

   await recording.save();
});
