import { Locator } from '@playwright/test';
import { centerYOf } from './support/box';
import { expect, test } from './support/fixtures';
import { fruitSalesOf } from './support/fruit-sales-sample';
import { Texts } from './support/texts';

const en = new Texts('en');
const de = new Texts('de');
const ja = new Texts('ja');
const rowCount = fruitSalesOf('en').entries.length;
const swissRowCount = new Intl.NumberFormat('de-CH').format(rowCount);

test('scenes page is translated when switching to German', async ({ front, rawData, scenes, languageSelect }) => {
   await front.open('en');
   await front.openSample();
   await rawData.mainToolbar.openScenes();

   await languageSelect.switchTo('de');

   await expect(scenes.title).toHaveText(de.get('scenes.title'));
});

test('scene page is translated when switching to Japanese', async ({ front, scene, languageSelect }) => {
   await front.open('en');
   await front.startWithFile();

   await languageSelect.switchTo('ja');

   await expect(scene.title).toHaveText(ja.get('scene.title'));
});

test('language button sits at top right of every page, at same height on scene, scenes and unfiltered raw data pages',
   async ({ page, front, scene, rawData, scenes, languageSelect }) => {
      const boxes: Record<string, { right: number, centerY: number }> = {};
      const measure = async (pageName: string, button: Locator) => {
         const box = await button.boundingBox();
         boxes[pageName] = { right: box.x + box.width, centerY: centerYOf(box) };
      };

      await front.open('en');
      await measure('front', languageSelect.button);
      await page.goto('/intro/index.html');
      await measure('intro', page.locator('.intro-languages summary'));
      await front.open('en');
      await front.startWithFile();
      await expect(scene.title).toBeVisible();
      await measure('scene', languageSelect.button);
      await front.open('en');
      await front.openSample();
      await measure('rawData', languageSelect.button);
      await rawData.mainToolbar.openScenes();
      await expect(scenes.title).toBeVisible();
      await measure('scenes', languageSelect.button);

      const viewportWidth = page.viewportSize().width;
      Object.values(boxes).forEach(b => expect(Math.abs(b.right - (viewportWidth - 8))).toBeLessThanOrEqual(1));
      [boxes.scene, boxes.scenes].forEach(b => expect(Math.abs(b.centerY - boxes.rawData.centerY)).toBeLessThanOrEqual(1));
   });

test('numbers follow the Swiss format chosen in the language menu after a reload, and the toolbar keeps its widths',
   async ({ front, rawData, tabBar, languageSelect }) => {
      await front.open('en');
      await front.openSample();
      await expect(rawData.table.rowCount).toHaveText(en.rows(rowCount));
      const button = await languageSelect.button.boundingBox();
      const rawDataTab = await tabBar.rawDataTitle.boundingBox();

      await languageSelect.selectNumberFormat('de-CH');

      await expect(rawData.table.rowCount).toHaveText(en.get('ui.rows', { count: swissRowCount }));
      expect(await languageSelect.button.boundingBox()).toEqual(button);
      expect(await tabBar.rawDataTitle.boundingBox()).toEqual(rawDataTab);
      await front.open();
      await front.openSample();
      await expect(rawData.table.rowCount).toHaveText(en.get('ui.rows', { count: swissRowCount }));
   });

test.describe('with German (Switzerland) preferred in the browser', () => {
   test.use({ locale: 'de-CH' });

   test('automatic number format is Swiss in German and the US one in English', async ({ front, rawData, languageSelect }) => {
      await front.open('de');
      await front.openSample();
      await expect(rawData.table.rowCount).toHaveText(de.get('ui.rows', { count: swissRowCount }));

      await languageSelect.switchTo('en');

      await expect(rawData.table.rowCount).toHaveText(en.rows(rowCount));
   });
});
