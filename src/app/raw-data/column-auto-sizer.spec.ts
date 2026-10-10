import { ColumnAutoSizer } from './column-auto-sizer';

describe('ColumnAutoSizer', () => {

  const measureByLength = (text: string) => text.length * 10;

  it('#width should add padding to widest text', () => {

    // when
    const width = ColumnAutoSizer.width(['abcde', 'abcdefgh', 'ab'], measureByLength);

    // then
    expect(width).toBe(80 + ColumnAutoSizer.PADDING);
  });

  it('#width should round measured width up', () => {

    // when
    const width = ColumnAutoSizer.width(['x'], () => 50.2);

    // then
    expect(width).toBe(51 + ColumnAutoSizer.PADDING);
  });

  it('#width should clamp to min', () => {

    // when
    const width = ColumnAutoSizer.width(['a'], measureByLength);

    // then
    expect(width).toBe(ColumnAutoSizer.MIN);
  });

  it('#width should clamp to max', () => {

    // when
    const width = ColumnAutoSizer.width(['a'.repeat(100)], measureByLength);

    // then
    expect(width).toBe(ColumnAutoSizer.MAX);
  });

  it('#width should measure longest line of multi-line text', () => {

    // when
    const width = ColumnAutoSizer.width(['abc\nabcdefg\nab'], measureByLength);

    // then
    expect(width).toBe(70 + ColumnAutoSizer.PADDING);
  });

  it('#width should return min for no texts', () => {

    // when
    const width = ColumnAutoSizer.width([], measureByLength);

    // then
    expect(width).toBe(ColumnAutoSizer.MIN);
  });
});
