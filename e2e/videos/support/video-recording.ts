import { expect, Locator, Page } from '@playwright/test';
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { captionHtml } from './caption';
import { Cut } from './cuts.mjs';
import { fileDialogHtml, FileDialogKind } from './file-dialog';
import { TAIL_SECONDS } from './soundtrack.mjs';

const RAW_DIR = resolve(__dirname, '../../../test-results/videos/raw');

const FILE_DIALOG_MS = 2500;
/** seconds of a long wait kept in the mixed video, showing that the app works */
const CUT_KEPT_SECONDS = 1.5;
const PAGINATED_TAB_HEADER = 'nav.mat-mdc-tab-header-pagination-controls-enabled';

/** bottom band covered by a one-line caption: about 51 px high, ending 40 px above the bottom, so its top is about 91 px up */
export const CAPTION_BAND_PX = 100;

/**
 * saves the raw video of a page together with the offset of its first meaningful frame, which scripts/mix-videos.mjs trims to
 */
export class VideoRecording {

   private readonly started = Date.now();
   private trimStart = 0;
   private readonly cuts: Cut[] = [];

   constructor(private readonly page: Page, private readonly slug: string) {
   }

   markStart(): void {
      this.trimStart = this.secondsSinceStarted();
   }

   /**
    * shows the text for its reading time and resolves once it disappeared, fails if the tab header paginates or the view is scrolled
    * sideways
    */
   async caption(text: string): Promise<void> {
      if (await this.page.locator(PAGINATED_TAB_HEADER).count() > 0) {
         throw new Error('paginated tab header under caption: ' + text);
      }
      if (await this.page.locator('.mat-drawer-container').evaluateAll(containers => containers.some(c => c.scrollLeft > 0))) {
         throw new Error('sideways scrolled view under caption: ' + text);
      }
      await this.page.screencast.showOverlay(captionHtml(text), { duration: Math.max(1800, 60 * text.length) });
   }

   /**
    * scrolls the target to the middle of the window, as captions cover its bottom band, and moves the pointer over it
    */
   async pointAt(target: Locator): Promise<void> {
      await target.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await target.hover();
      const box = await target.boundingBox();
      expect(box.y + box.height).toBeLessThanOrEqual(this.page.viewportSize().height - CAPTION_BAND_PX);
   }

   /**
    * shows a fake file dialog for the native one, which videos cannot record and which would reveal the local folders
    */
   async fileDialog(kind: FileDialogKind, fileName: string): Promise<void> {
      await this.page.screencast.showOverlay(fileDialogHtml(kind, fileName), { duration: FILE_DIALOG_MS });
   }

   /**
    * resolves with the result of the action and cuts the time it takes beyond the kept seconds out of the mixed video
    */
   async cutWhile<T>(action: () => Promise<T>, keptSeconds = CUT_KEPT_SECONDS): Promise<T> {
      const start = this.secondsSinceStarted();
      const result = await action();
      const end = this.secondsSinceStarted();
      if (end - start > keptSeconds) {
         this.cuts.push({ start: start + keptSeconds - this.trimStart, end: end - this.trimStart });
      }
      return result;
   }

   async save(): Promise<void> {
      await this.page.waitForTimeout(TAIL_SECONDS * 1000);
      const video = this.page.video();
      await this.page.close();
      await video.saveAs(resolve(RAW_DIR, this.slug + '.webm'));
      writeFileSync(resolve(RAW_DIR, this.slug + '.json'), JSON.stringify({ trimStart: this.trimStart, cuts: this.cuts }));
   }

   private secondsSinceStarted(): number {
      return (Date.now() - this.started) / 1000;
   }
}
