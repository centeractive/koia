import { TextMeasurer } from './text-measurer';

describe('TextMeasurer', () => {

  const measurer = new TextMeasurer('12px sans-serif');

  it('#width should grow with text length', () => {

    // when
    const shortWidth = measurer.width('abc');
    const longWidth = measurer.width('abcabc');

    // then
    expect(shortWidth).toBeGreaterThan(0);
    expect(longWidth).toBeGreaterThan(shortWidth);
  });

  it('#width should be zero for empty text', () => {

    // when
    const width = measurer.width('');

    // then
    expect(width).toBe(0);
  });

  it('#width should depend on font', () => {

    // given
    const largeMeasurer = new TextMeasurer('24px sans-serif');

    // when
    const width = largeMeasurer.width('abc');

    // then
    expect(width).toBeGreaterThan(measurer.width('abc'));
  });
});
