import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { copyFileSync } from 'fs';
import { expect, test } from './support/fixtures';
import { ORDERS_CSV } from './support/import-files';
import { Texts } from './support/texts';

const en = new Texts('en');

test.describe('scenes of the sample and the imported orders', () => {

   test.beforeEach(async ({ front, rawData, scene }) => {
      await front.open('en');
      await front.openSample();
      await rawData.mainToolbar.addScene();
      await scene.detectColumns(ORDERS_CSV);
      await scene.loadData();
   });

   test('filter shows the matching scene only', async ({ scenes }) => {
      await scenes.filter(ORDERS_CSV.name);

      await expect(scenes.rows).toHaveCount(1);
      await expect(scenes.rows).toContainText(ORDERS_CSV.name);
   });

   test('activated scene shows its rows', async ({ scenes, rawData }) => {
      await scenes.activate(ORDERS_CSV.name);

      await expect(rawData.table.rowCount).toHaveText(en.rows(ORDERS_CSV.rowCount));
   });

   test('most recently activated scene is on top and marked active', async ({ scenes, rawData }) => {
      const sampleName = fruitSalesSampleOf('en').sceneName;

      await scenes.activate(ORDERS_CSV.name);
      await rawData.mainToolbar.openScenes();

      await expect(scenes.rows.first()).toContainText(ORDERS_CSV.name);
      await expect(scenes.rows.first()).toHaveClass(/active-scene/);
      await expect(scenes.rows.nth(1)).toContainText(sampleName);

      await scenes.activate(sampleName);
      await rawData.mainToolbar.openScenes();

      await expect(scenes.rows.first()).toContainText(sampleName);
      await expect(scenes.rows.first()).toHaveClass(/active-scene/);
      await expect(scenes.rows.nth(1)).toContainText(ORDERS_CSV.name);
   });

   test('deleted scene disappears from the list', async ({ scenes }) => {
      const message = await scenes.delete(ORDERS_CSV.name);

      expect(message).toBe(en.get('scenes.sceneDeleted'));
      await expect(scenes.rows).toHaveCount(1);
      await expect(scenes.rows).toContainText(fruitSalesSampleOf('en').sceneName);
   });

   test('new scene with file of existing scene gets numbered name and rejects existing name', async ({ scenes, rawData, scene }) => {
      await scenes.activate(ORDERS_CSV.name);
      await rawData.mainToolbar.addScene();
      await scene.selectFile(ORDERS_CSV);

      await expect(scene.nameInput).toHaveValue(/ \(2\)$/);
      await expect(scene.nameError).toBeHidden();
      await expect(scene.detectColumnsButton).toBeEnabled();

      const existingName = (await scene.nameInput.inputValue()).replace(/ \(2\)$/, '');
      await scene.nameInput.fill(existingName);

      await expect(scene.nameError).toHaveText(en.get('scene.nameExists'));
      await expect(scene.detectColumnsButton).toBeDisabled();

      await scene.nameInput.fill('unique name');

      await expect(scene.nameError).toBeHidden();
      await expect(scene.detectColumnsButton).toBeEnabled();
   });
});

test.describe('new scene name', () => {

   test.beforeEach(async ({ front, rawData }) => {
      await front.open('en');
      await front.openSample();
      await rawData.mainToolbar.addScene();
   });

   test('typed scene name is cut at 40 characters', async ({ scene }) => {
      await scene.nameInput.fill('');
      await scene.nameInput.pressSequentially('x'.repeat(41));

      await expect(scene.nameInput).toHaveValue('x'.repeat(40));
   });

   test('scene name generated from long file name keeps 40 characters', async ({ scene }, testInfo) => {
      const longPath = testInfo.outputPath('orders with a file name exceeding the scene name limit.csv');
      copyFileSync(ORDERS_CSV.path, longPath);

      await scene.selectFile({ ...ORDERS_CSV, path: longPath });

      await expect(scene.nameInput).toHaveValue(/^orders with a file .+\.\.\. \/ [A-Z][a-z]{2} \d{1,2}, \d{4}$/);
      expect((await scene.nameInput.inputValue()).length).toBe(40);
   });
});
