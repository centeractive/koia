import { EnumLabelKeys } from 'app/shared/model/enum-label-keys';
import { expect, test } from './support/fixtures';
import { SERVER_ISO_LOG, SERVER_LOG } from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');

test.beforeEach(async ({ front }) => {
   await front.open('en');
   await front.startWithFile();
});

test('log file is split by detected logback pattern and keeps stack trace in message of its entry', async ({ scene }) => {
   await scene.detectColumns(SERVER_LOG);

   await expect(scene.linePattern).toHaveValue('{Time:time} [{Thread}] {Level:level} {Logger} - {Message}');
   await expect(await scene.preview.cell(4, 'Message')).toContainText('Caused by: java.net.SocketTimeoutException');
   await expect(await scene.preview.cell(5, 'Message')).toHaveText('Request r1005 handled');
   await expect(scene.preview.row(4)).toHaveCSS('background-color', 'rgb(255, 120, 90)');
});

test('edited line pattern defines the columns', async ({ scene }) => {
   await scene.selectFile(SERVER_LOG);
   await scene.linePattern.fill('{Time:time} [{Thread}] {Rest}');
   await scene.linePattern.press('Tab');

   await scene.detectColumnsButton.click();

   await expect(scene.columnNames).toHaveCount(3);
   expect(await scene.columnNames.evaluateAll(inputs => inputs.map(i => (i as HTMLInputElement).value))).toEqual(['Time', 'Thread', 'Rest']);
});

test('error and warn entries of imported log are highlighted', async ({ page, scene, scenes, rawData }) => {
   await scene.detectColumns(SERVER_LOG);
   await scene.loadData();
   await scenes.activate(SERVER_LOG.name);
   await page.mouse.move(0, 0);

   await expect(rawData.table.row(4)).toHaveCSS('background-color', 'rgb(255, 120, 90)');
   await expect(rawData.table.row(2)).toHaveCSS('background-color', 'rgb(254, 210, 85)');
   await expect(rawData.table.row(0)).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('ISO times of log file are detected as time', async ({ scene }) => {
   const dataTypes = await scene.detectColumns(SERVER_ISO_LOG);

   expect(dataTypes).toEqual(SERVER_ISO_LOG.dataTypes.map(dataType => en.get(EnumLabelKeys.dataType(dataType))));
});
