import { expect, Locator } from '@playwright/test';

/**
 * expects only the active ones of buttons switching like radio buttons to be marked active
 */
export async function expectOnlyActive(buttons: Locator[], active: Locator | Locator[]): Promise<void> {
   const actives = [active].flat();
   for (const button of buttons) {
      await expect(button).toHaveClass(actives.includes(button) ? /\bkoia-toggle-active\b/ : /^(?!.*\bkoia-toggle-active\b)/);
   }
}
