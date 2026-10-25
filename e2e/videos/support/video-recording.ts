import { Page } from '@playwright/test';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { TAIL_SECONDS } from './soundtrack.mjs';

const RAW_DIR = resolve(__dirname, '../../../test-results/videos/raw');
const CAPTION_STYLE = 'position:absolute;left:50%;bottom:40px;transform:translateX(-50%);padding:10px 20px;border-radius:12px;'
   + 'background:rgba(26,35,126,.88);color:#fff;font:500 22px/1.4 system-ui,sans-serif';

/** bottom band covered by a one-line caption: about 51 px high, ending 40 px above the bottom, so its top is about 91 px up */
export const CAPTION_BAND_PX = 100;

/**
 * saves the raw video of a page together with the offset of its first meaningful frame, which scripts/mix-videos.mjs trims to
 */
export class VideoRecording {

   private readonly started = Date.now();
   private trimStart = 0;

   constructor(private readonly page: Page, private readonly slug: string) {
   }

   markStart(): void {
      this.trimStart = (Date.now() - this.started) / 1000;
   }

   /**
    * shows the text for its reading time and resolves once it disappeared
    */
   async caption(text: string): Promise<void> {
      await this.page.screencast.showOverlay('<div style="' + CAPTION_STYLE + '">' + text + '</div>', { duration: Math.max(1800, 60 * text.length) });
   }

   async save(): Promise<void> {
      await this.page.waitForTimeout(TAIL_SECONDS * 1000);
      const video = this.page.video();
      await this.page.close();
      await video.saveAs(resolve(RAW_DIR, this.slug + '.webm'));
      writeFileSync(resolve(RAW_DIR, this.slug + '.json'), JSON.stringify({ trimStart: this.trimStart }));
   }
}
