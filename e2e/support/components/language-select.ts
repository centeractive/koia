import { expect, Locator, Page } from '@playwright/test';
import { Language } from 'app/shared/services/language/language';

export class LanguageSelect {

   readonly button: Locator;
   readonly code: Locator;

   constructor(private readonly page: Page) {
      this.button = page.locator('#but_language');
      this.code = this.button.locator('.language-code');
   }

   async switchTo(language: Language): Promise<void> {
      await this.button.click();
      await this.page.locator(`.menu_item_language[lang="${language}"]`).click();
      await expect(this.button).toHaveAttribute('lang', language);
   }
}
