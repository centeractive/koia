import { Locator, Page } from '@playwright/test';

/**
 * presses the mouse at the point and moves it by the offset without releasing it
 */
export async function pressAndMoveBy(page: Page, x: number, y: number, dx: number, dy: number): Promise<void> {
   await page.mouse.move(x, y);
   await page.mouse.down();
   await page.mouse.move(x + dx, y + dy, { steps: 5 });
}

export async function pressCenterAndMoveBy(grip: Locator, dx: number, dy: number): Promise<void> {
   const box = await grip.boundingBox();
   await pressAndMoveBy(grip.page(), box.x + box.width / 2, box.y + box.height / 2, dx, dy);
}

export async function dragCenterOnto(grip: Locator, target: Locator): Promise<void> {
   const from = await grip.boundingBox();
   const to = await target.boundingBox();
   await pressCenterAndMoveBy(grip, to.x + to.width / 2 - (from.x + from.width / 2), to.y + to.height / 2 - (from.y + from.height / 2));
   await grip.page().mouse.up();
}
