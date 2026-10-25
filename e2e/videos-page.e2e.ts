import { expect, test } from './support/fixtures';

const VIDEOS_PAGE = '/intro/videos.html';

test('intro nav videos link opens videos page', async ({ page }) => {
   await page.goto('/intro/index.html');

   await page.locator('nav.landing-nav a[href="videos.html"]').click();

   await expect(page).toHaveURL(new RegExp(VIDEOS_PAGE + '$'));
   await expect(page.locator('h1')).toHaveText('Koia in short videos');
});

test('every video tile plays its self-hosted webm', async ({ page }) => {
   await page.goto(VIDEOS_PAGE);
   const ids = await page.locator('dialog.video-dialog').evaluateAll(dialogs => dialogs.map(d => d.id));

   for (const id of ids) {
      await page.locator(`.video-play[commandfor="${id}"]`).click();

      const video = page.locator(`#${id} video`);
      await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime > 0 && !v.paused)).toBe(true);
      await page.locator(`#${id} .landing-zoom-close`).click();
   }
   expect(ids.length).toBeGreaterThan(0);
});

test('closing video dialog pauses video', async ({ page }) => {
   await page.goto(VIDEOS_PAGE);
   await page.locator('.video-play[commandfor="video-new-scene"]').click();
   const video = page.locator('#video-new-scene video');
   await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime > 0)).toBe(true);

   await page.locator('#video-new-scene .landing-zoom-close').click();

   await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused && v.currentTime === 0)).toBe(true);
   await expect(page.locator('#video-new-scene')).not.toHaveAttribute('open');
});
