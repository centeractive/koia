import { Rect } from './free-layout';
import { WidthScale } from './width-scale';

describe('WidthScale', () => {

  const LANDSCAPE_WIDTH = 1400;
  const PORTRAIT_WIDTH = 950;
  const MIN_WIDTH = 100;

  const toPortrait = new WidthScale(LANDSCAPE_WIDTH, PORTRAIT_WIDTH);
  const toLandscape = new WidthScale(PORTRAIT_WIDTH, LANDSCAPE_WIDTH);

  function rect(x: number, width: number): Rect {
    return { x, y: 20, width, height: 300 };
  }

  it('should keep rect for equal widths', () => {

    // given
    const original = rect(3, 50);

    // when
    const scaled = new WidthScale(LANDSCAPE_WIDTH, LANDSCAPE_WIDTH).scale(original, MIN_WIDTH);

    // then
    expect(scaled).toBe(original);
  });

  it('should scale full width to full width', () => {

    // when
    const scaled = toPortrait.scale(rect(0, LANDSCAPE_WIDTH), MIN_WIDTH);

    // then
    expect(scaled).toEqual(rect(0, PORTRAIT_WIDTH));
  });

  it('should keep gap between neighbours', () => {

    // when
    const left = toPortrait.scale(rect(0, 600), MIN_WIDTH);
    const right = toPortrait.scale(rect(610, 600), MIN_WIDTH);

    // then
    expect(left).toEqual(rect(0, 405));
    expect(right).toEqual(rect(415, 406));
  });

  it('should keep min width of tile narrower than min width after scaling', () => {

    // when
    const scaled = toPortrait.scale(rect(0, 100), MIN_WIDTH);

    // then
    expect(scaled).toEqual(rect(0, MIN_WIDTH));
  });

  it('should keep tile kept at min width within page width', () => {

    // when
    const scaled = toPortrait.scale(rect(1300, 100), MIN_WIDTH);

    // then
    expect(scaled).toEqual(rect(PORTRAIT_WIDTH - MIN_WIDTH, MIN_WIDTH));
  });

  it('should cap width at target page width', () => {

    // when
    const scaled = toPortrait.scale(rect(0, 100), 2000);

    // then
    expect(scaled).toEqual(rect(0, PORTRAIT_WIDTH));
  });

  it('should drift each edge of landscape-origin round trip by at most one unit', () => {

    // when
    const roundTrip = toLandscape.scale(toPortrait.scale(rect(2, 212), MIN_WIDTH), MIN_WIDTH);

    // then
    expect(roundTrip).toEqual(rect(1, 214));
  });

  it('should restore portrait-origin round trip exactly', () => {

    // given
    const rects = [rect(0, 405), rect(415, 406), rect(7, 133), rect(500, 450)];

    // when
    const roundTrips = rects.map(r => toPortrait.scale(toLandscape.scale(r, MIN_WIDTH), MIN_WIDTH));

    // then
    expect(roundTrips).toEqual(rects);
  });
});
