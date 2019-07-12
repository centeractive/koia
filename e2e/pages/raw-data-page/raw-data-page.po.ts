import { browser, element, by, ElementFinder } from 'protractor';
import { Route } from 'app/shared/model';

export class RawDataPage {

  navigateTo(): void {
    browser.get(Route.RAWDATA);
  }

  getTable(): ElementFinder {
    return element(by.tagName('table'));
  }
}
