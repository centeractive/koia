import { by, element, ElementFinder } from 'protractor';
import { BasePage } from '../shared/base.po';

export class FrontPage extends BasePage {

  async navigateTo() {
    super.navigateTo('front');
  }

  getKoiaLogoImage(): ElementFinder {
    return element(by.css('#img_koia'));
  }

  getStartButton(): ElementFinder {
    return element(by.css('#start_button'));
  }
}
