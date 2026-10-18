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
