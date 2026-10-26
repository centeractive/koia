import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const en = new Texts('en');
const PIVOT_TAB = 'tab1';
const ERROR_ROWS = 100;
const NODE_7_ERROR_ROWS = 60;

test('log sample opens from the landing page', async ({ front, rawData }) => {
   await front.open('en');

   await front.openLogSample();

   await expect(rawData.table.rowCount).toHaveText(en.rows(appLogsSampleOf('en').rowCount));
});

test('explaining the ERROR row total of the pivot names host node-7 and narrows to its rows', async ({ front, tabBar, pivot, rawDataDialog }) => {
   await front.open('en');
   await front.openLogSample();
   await tabBar.open(PIVOT_TAB);
   await pivot.firstRowTotal.click();
   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(ERROR_ROWS));

   await rawDataDialog.contrast.explain();

   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
   await expect(rawDataDialog.contrast.findings.first()).toContainText('Host = node-7');
   await expect(rawDataDialog.contrast.findings.first()).toContainText('60% here · 5% elsewhere');
   await expect(rawDataDialog.contrast.skipped).toContainText('Message');

   await rawDataDialog.contrast.findings.first().click();

   await expect(rawDataDialog.table.rowCount).toHaveText(en.rows(NODE_7_ERROR_ROWS));
   await expect(rawDataDialog.contrast.findings).toHaveCount(1);
});

test('explaining ERROR rows filtered in the raw data view names host node-7', async ({ front, rawData }) => {
   await front.open('en');
   await front.openLogSample();
   await expect(rawData.contrast.explainButton).toHaveCount(0);

   await rawData.mainToolbar.addValueFilter('Level', 'ERROR');
   await expect(rawData.table.rowCount).toHaveText(en.rows(ERROR_ROWS));
   await rawData.contrast.explain();

   await expect(rawData.contrast.findings).toHaveCount(1);
   await expect(rawData.contrast.findings.first()).toContainText('Host = node-7');
});
