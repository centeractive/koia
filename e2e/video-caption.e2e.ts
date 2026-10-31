import { expect, test } from './support/fixtures';
import { VIDEO_SIZE } from './support/video-options';
import { captionHtml, MAX_CAPTION_LENGTH } from './videos/support/caption';
import { CAPTION_BAND_PX, VideoRecording } from './videos/support/video-recording';

const BOTTOM_PX = 40;

test.use({ viewport: VIDEO_SIZE });

test('long caption stays on one line', async ({ page }) => {
   await page.setContent(captionHtml('word '.repeat(MAX_CAPTION_LENGTH / 5).trim()));

   const box = await page.locator('div').boundingBox();
   expect(box.height).toBeLessThanOrEqual(CAPTION_BAND_PX - BOTTOM_PX);
   expect(box.width).toBeLessThan(VIDEO_SIZE.width);
});

test('pointed element below the window is scrolled above the caption band', async ({ page }) => {
   const spacer = `<div style="height:${VIDEO_SIZE.height * 2}px"></div>`;
   await page.setContent(spacer + '<button onmouseover="this.dataset.pointed = true">target</button>' + spacer);
   const target = page.getByRole('button');

   await new VideoRecording(page, 'pointer').pointAt(target);

   const box = await target.boundingBox();
   expect(box.y + box.height).toBeLessThanOrEqual(VIDEO_SIZE.height - CAPTION_BAND_PX);
   await expect(target).toHaveAttribute('data-pointed', 'true');
});

test('caption over a paginated tab header is refused', async ({ page }) => {
   await page.setContent('<nav class="mat-mdc-tab-header-pagination-controls-enabled"></nav>');

   await expect(new VideoRecording(page, 'pagination').caption('text')).rejects.toThrow('paginated tab header');
});

test('caption longer than the maximum is refused', () => {
   const text = 'x'.repeat(MAX_CAPTION_LENGTH + 1);

   expect(() => captionHtml(text)).toThrow();
});

test('caption over a sideways scrolled view is refused', async ({ page }) => {
   await page.setContent('<div class="mat-drawer-container" style="width:100px;overflow:hidden"><div style="width:300px;height:1px"></div></div>');
   await page.locator('.mat-drawer-container').evaluate(container => container.scrollLeft = 50);

   await expect(new VideoRecording(page, 'sideways').caption('text')).rejects.toThrow('sideways scrolled view');
});

test.describe('recording', () => {

   test.use({ recordingStyles: true });

   test('tooltip lets the pointer through', async ({ page, front }) => {
      await front.open('en');
      await front.openSample();

      await page.locator('#butHome').hover();

      await expect(page.locator('.mat-mdc-tooltip-panel')).toHaveCSS('pointer-events', 'none');
   });

   test('side nav container cannot be scrolled sideways', async ({ page, front }) => {
      await front.open('en');
      await front.openSample();
      const container = page.locator('.mat-drawer-container').first();

      await container.evaluate(c => c.scrollLeft = 50);

      expect(await container.evaluate(c => c.scrollLeft)).toBe(0);
   });
});
