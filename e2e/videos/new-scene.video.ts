import { test } from '../support/fixtures';
import { SALES_CSV } from '../support/import-files';
import { VideoRecording } from './support/video-recording';

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

   await rawData.table.sortBy('Revenue');
   await recording.caption('Sort, filter and explore your data');

   await recording.save();
});
