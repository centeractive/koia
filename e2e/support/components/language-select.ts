import { expect, Locator, Page } from '@playwright/test';
import { Language } from 'app/shared/services/language/language';

export class LanguageSelect {

   readonly code: Locator;

   constructor(private readonly page: Page) {
      this.code = page.locator('#but_language .language-code');
   }

   async switchTo(language: Language): Promise<void> {
      await this.page.locator('#but_language').click();
      await this.page.locator(`.menu_item_language[lang="${language}"]`).click();
      await expect(this.page.locator('#but_language')).toHaveAttribute('lang', language);
   }
}
