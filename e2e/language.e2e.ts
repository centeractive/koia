import { Locator } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const de = new Texts('de');
const ja = new Texts('ja');

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
         boxes[pageName] = { right: box.x + box.width, centerY: box.y + box.height / 2 };
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
