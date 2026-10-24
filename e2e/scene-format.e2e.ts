import { expect, test } from './support/fixtures';

const SCENE_SCHEMA = '/assets/scene-format/1.0/scene.schema.json';

test('koia serves supported scene format versions', async ({ page }) => {
   const response = await page.request.get('/assets/scene-format/versions.json');

   expect(await response.json()).toEqual({ versions: ['1.0'] });
});

test('koia serves scene schema at its id', async ({ page }) => {
   const response = await page.request.get(SCENE_SCHEMA);

   expect((await response.json()).$id).toBe('https://www.koia.io' + SCENE_SCHEMA);
});
