import { FrontPage } from './front.po';
import { browser, logging } from 'protractor';

describe('front page', () => {

  const page = new FrontPage();

  beforeEach(async () => {
    page.navigateTo();
  });

  it('should display Koia logo', () => {
    expect(page.getKoiaLogoImage().getAttribute('src'))
      .toBe(browser.baseUrl + 'assets/koialogo_textblack.png');
  });

  it('#click on connection definition button should open dialog', () => {
    page.getButtonByCss('#but_define_connection').click();

    expect(page.getButtonByCss('#but_ok').isDisplayed()).toBe(true);
    expect(page.getButtonByCss('#but_cancel').isDisplayed()).toBe(true);
  });

  it('#click on start button should navigate to "scenes" page', () => {
    page.getStartButton().click();

    expect(browser.driver.getCurrentUrl()).toBe(browser.baseUrl + 'scenes');
  });

  afterEach(async () => {
    // Assert that there are no errors emitted from the browser
    const logs = await browser.manage().logs().get(logging.Type.BROWSER);
    expect(logs).not.toContain(jasmine.objectContaining({
      level: logging.Level.SEVERE,
    } as logging.Entry));
  });
});
