import { RawDataPage } from './raw-data-page.po';

describe('Raw Data Page', () => {

  const page = new RawDataPage();

  beforeEach(() => {
    page.navigateTo();
  });

  it('should display table', () => {
    expect(page.getTable().then)
  });
});
