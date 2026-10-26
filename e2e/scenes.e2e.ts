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

   test('edited scene keeps its data and shows new name and description', async ({ scenes, rawData }) => {
      const message = await scenes.edit(ORDERS_CSV.name, 'renamed orders', 'edited description');

      expect(message).toBe(en.get('scenes.sceneUpdated'));

      await scenes.activate('renamed orders');

      await expect(rawData.table.rowCount).toHaveText(en.rows(ORDERS_CSV.rowCount));

      await rawData.mainToolbar.openScenes();

      await expect(scenes.rows.first()).toContainText('renamed orders');
      await expect(scenes.rows.first()).toContainText('edited description');
   });

   test('editing the active sample scene disables other actions and hides its active chip', async ({ scenes }) => {
      const otherControls = [scenes.filterInput, scenes.deleteAllButton, scenes.cancelButton, scenes.continueButton, scenes.activateButtons];

      await scenes.startEdit(fruitSalesSampleOf('en').sceneName);

      await expect(scenes.moreButtons).toHaveCount(2);
      for (const control of [...await scenes.moreButtons.all(), ...otherControls]) {
         await expect(control).toBeDisabled();
      }
      await expect(scenes.activeChips).toHaveCount(0);

      await scenes.editNameInput.press('Escape');

      for (const control of [...await scenes.moreButtons.all(), ...otherControls]) {
         await expect(control).toBeEnabled();
      }
      await expect(scenes.activeChips).toHaveCount(1);
   });

   test('edit rejects name of other scene', async ({ scenes }) => {
      await scenes.startEdit(ORDERS_CSV.name);
      await scenes.editNameInput.fill(fruitSalesSampleOf('en').sceneName);

      await expect(scenes.editNameError).toHaveText(en.get('scene.nameExists'));
      await expect(scenes.saveEditButton).toBeDisabled();
   });

   test('edit row does not scroll while table container keeps horizontal scroll', async ({ scenes }) => {
      await scenes.startEdit(ORDERS_CSV.name);

      await expect(scenes.editRow).toHaveCSS('overflow-x', 'visible');
      await expect(scenes.editRow).toHaveCSS('overflow-y', 'visible');
      await expect(scenes.tableContainer).toHaveCSS('overflow-x', 'auto');
   });

   test('renamed sample scene is reopened instead of imported again', async ({ front, scenes, rawData }) => {
      const sample = fruitSalesSampleOf('en');

      await scenes.edit(sample.sceneName, 'my fruits');
      await front.open('en');
      await front.openSample();

      await expect(rawData.table.rowCount).toHaveText(en.rows(sample.rowCount));

      await rawData.mainToolbar.openScenes();

      await expect(scenes.rows).toHaveCount(2);
      await expect(scenes.rows.filter({ hasText: 'my fruits' })).toHaveCount(1);
      await expect(scenes.rows.filter({ hasText: sample.sceneName })).toHaveCount(0);
   });

   test('deleted sample scene is imported again when reopened', async ({ front, scenes, rawData }) => {
      const sample = fruitSalesSampleOf('en');

      await scenes.delete(sample.sceneName);
      await front.open('en');
      await front.openSample();

      await expect(rawData.table.rowCount).toHaveText(en.rows(sample.rowCount));

      await rawData.mainToolbar.openScenes();

      await expect(scenes.rows).toHaveCount(2);
      await expect(scenes.rows.filter({ hasText: sample.sceneName })).toHaveCount(1);
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
