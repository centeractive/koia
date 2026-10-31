import { SORT_INDICATORS } from 'app/raw-data/sort-indicators';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { basename } from 'path';
import { downloadOf } from '../support/downloads';
import { expect, test } from '../support/fixtures';
import { ID_COLUMN } from '../support/id-column';
import { SALES_CSV } from '../support/import-files';
import { Texts } from '../support/texts';
import { FileDialogKind } from './support/file-dialog';
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
   await scene.selectFile(SALES_CSV, () => recording.fileDialog(FileDialogKind.OPEN, basename(SALES_CSV.path)));
   await recording.caption('Pick a CSV file – Koia shows a sample of its content');

   await expect(scene.idColumnToggle).toBeChecked();
   await recording.pointAt(scene.idColumnToggle);
   await recording.caption('An ID column numbers the rows – switch it off if not needed');

   await scene.detectColumnsButton.click();
   await scene.dataTypes.first().waitFor();
   await expect(scene.columnNames.first()).toHaveValue(ID_COLUMN);
   await recording.caption('Column names and data types are detected');

   await recording.pointAt(scene.dataTypes.nth(1));
   await recording.caption('Adjust names, types or formats if needed');

   await scene.loadData();
   await recording.caption('The data is stored in your browser and listed as a scene');

   await scenes.activate(SALES_CSV.name);
   await expect(rawData.table.headers).toHaveText([ID_COLUMN, ...SALES_CSV.columns]);
   await recording.caption('Activate the scene to open its raw data');

   await rawData.table.sortBy(REVENUE);
   await recording.caption('Click a header to sort, e.g. by revenue');

   await rawData.table.sortBy(REVENUE);
   await expect(rawData.table.sortIndicator(REVENUE)).toHaveText(SORT_INDICATORS.desc);
   await recording.caption('Click it again to sort descending');

   const rangeFilter = await rawData.mainToolbar.addRangeFilter('Quantity', en.get('toolbar.valueRange'));
   await recording.caption('Filter a number column by a value range');

   await rangeFilter.dragMinBy(75);
   await expect(rawData.table.rowCount).toHaveText(en.rows(83));
   await recording.caption('Drag the left end to narrow the range');

   await rangeFilter.dragRangeBy(-30);
   await expect(rawData.table.rowCount).toHaveText(en.rows(97));
   await recording.caption('Drag the whole range to shift it');

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
   await recording.caption('Save the filtered rows as CSV – or as JSON or Excel');

   await recording.save();
});
