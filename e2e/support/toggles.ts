import { expect, Locator } from '@playwright/test';

/**
 * expects only the active one of buttons switching like radio buttons to be marked active
 */
export async function expectOnlyActive(buttons: Locator[], active: Locator): Promise<void> {
   for (const button of buttons) {
      await expect(button).toHaveClass(button === active ? /\bkoia-toggle-active\b/ : /^(?!.*\bkoia-toggle-active\b)/);
   }
}
