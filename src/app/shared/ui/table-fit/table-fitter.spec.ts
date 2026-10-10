import { TableFitter } from './table-fitter';

describe('TableFitter', () => {

  it('#contentWidth should add scrollbar width to column widths', () => {

    // when
    const width = TableFitter.contentWidth(15, [100, 200, 50]);

    // then
    expect(width).toBe(365);
  });

  it('#hasHorizontalOverflow should return true when content is wider than available space', () => {

    // when
    const overflow = TableFitter.hasHorizontalOverflow(501, 500);

    // then
    expect(overflow).toBe(true);
  });

  it('#hasHorizontalOverflow should return false when content fits', () => {

    // when
    const overflow = TableFitter.hasHorizontalOverflow(500, 500);

    // then
    expect(overflow).toBe(false);
  });

  it('#contentHeight should add header, body and horizontal scrollbar', () => {

    // when
    const height = TableFitter.contentHeight(36, 400, 15);

    // then
    expect(height).toBe(451);
  });
});
