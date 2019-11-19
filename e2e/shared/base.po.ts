import { browser, element, by, ElementFinder } from 'protractor';

export class BasePage {

  /**
   * see https://github.com/angular/protractor/issues/3276#issuecomment-380986649
   */
  async navigateTo(path: string): Promise<any> {
    browser.waitForAngularEnabled(true);
    await browser.get(browser.baseUrl + path);
    browser.waitForAngularEnabled(false);
  }

  getButtonByCss(css: string): ElementFinder {
    return element(by.css(css));
  }
}
