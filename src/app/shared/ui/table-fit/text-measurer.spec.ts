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

  it.each(['日本語のテキスト', 'ｶﾀｶﾅ と ひらがな', 'Mixed 日本 text 123'])('#width should match rendered width of "%s"', text => {

    // given
    const font = '12px "Segoe UI", system-ui, -apple-system, sans-serif';
    const span = document.createElement('span');
    span.style.cssText = 'position: absolute; white-space: pre; font: ' + font;
    span.textContent = text;
    document.body.appendChild(span);

    // when
    const width = new TextMeasurer(font).width(text);

    // then
    expect(Math.abs(width - span.getBoundingClientRect().width)).toBeLessThan(1);
    span.remove();
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
