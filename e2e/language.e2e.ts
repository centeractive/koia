import { expect, test } from './support/fixtures';
import { Texts } from './support/texts';

const de = new Texts('de');
const ja = new Texts('ja');

test('scenes page is translated when switching to German', async ({ front, rawData, scenes, languageSelect }) => {
   await front.open('en');
   await front.openSample();
   await rawData.toolbar.openScenes();

   await languageSelect.switchTo('de');

   await expect(scenes.title).toHaveText(de.get('scenes.title'));
});

test('scene page is translated when switching to Japanese', async ({ front, scene, languageSelect }) => {
   await front.open('en');
   await front.startWithFile();

   await languageSelect.switchTo('ja');

   await expect(scene.title).toHaveText(ja.get('scene.title'));
});
