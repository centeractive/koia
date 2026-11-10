import { Locator, Page } from '@playwright/test';
import { cursorProgressAt } from './cursor-progress';
import { RECORDED_VIDEO } from './video-options';

/** duration of Playwright's cursor animation of a recorded action (moveActionCursor in playwright-core) */
const GLIDE_MS = Math.max(80, Math.min(0.6 * RECORDED_VIDEO.show.actions.duration, 400));
const GLIDE_STEPS = 24;

/**
 * presses the mouse at the point and moves it by the offset without releasing it
 */
export async function pressAndMoveBy(page: Page, x: number, y: number, dx: number, dy: number): Promise<void> {
   await page.mouse.move(x, y);
   await page.mouse.down();
   if (page.video()) {
      await Promise.all([page.mouse.move(x + dx, y + dy), glide(page, x, y, dx, dy)]);
   } else {
      await page.mouse.move(x + dx, y + dy, { steps: 5 });
   }
}

/**
 * moves the pressed mouse along with the cursor of a recorded video, because Playwright sends the events of an annotated move only
 * after the cursor arrived, so the dragged item would jump
 */
async function glide(page: Page, x: number, y: number, dx: number, dy: number): Promise<void> {
   const session = await page.context().newCDPSession(page);
   const start = Date.now();
   for (let i = 1; i <= GLIDE_STEPS; i++) {
      await page.waitForTimeout(Math.max(0, start + GLIDE_MS * i / GLIDE_STEPS - Date.now()));
      const progress = cursorProgressAt(i / GLIDE_STEPS);
      await session.send('Input.dispatchMouseEvent',
         { type: 'mouseMoved', x: x + dx * progress, y: y + dy * progress, button: 'left', buttons: 1 });
   }
   await session.detach();
}

export async function pressCenterAndMoveBy(grip: Locator, dx: number, dy: number): Promise<void> {
   const box = await grip.boundingBox();
   await pressAndMoveBy(grip.page(), box.x + box.width / 2, box.y + box.height / 2, dx, dy);
}

export async function dragCenterOnto(grip: Locator, target: Locator): Promise<void> {
   await grip.scrollIntoViewIfNeeded();
   const from = await grip.boundingBox();
   const to = await target.boundingBox();
   await pressCenterAndMoveBy(grip, to.x + to.width / 2 - (from.x + from.width / 2), to.y + to.height / 2 - (from.y + from.height / 2));
   await grip.page().mouse.up();
}

/**
 * @returns the center of the element, or else the first point of two rings around it at which no other element covers it
 */
export async function uncoveredPointOf(target: Locator): Promise<{ x: number, y: number }> {
   const point = await target.evaluate((e: Element) => {
      const r = e.getBoundingClientRect();
      const [cx, cy, radius] = [r.left + r.width / 2, r.top + r.height / 2, Math.min(r.width, r.height) / 2];
      const ring = (f: number) => Array.from({ length: 12 }, (_, i) =>
         [cx + f * radius * Math.cos(i * Math.PI / 6), cy + f * radius * Math.sin(i * Math.PI / 6)]);
      const found = [[cx, cy], ...ring(0.35), ...ring(0.7)].find(([x, y]) => e.contains(document.elementFromPoint(x, y)));
      return found && { x: found[0], y: found[1] };
   });
   if (!point) {
      throw new Error('the element is covered at all probed points');
   }
   return point;
}
