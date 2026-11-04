import { Rect } from './free-layout';
import { GroupResize } from './group-resize';

describe('GroupResize', () => {

  const MIN = { width: 100, height: 100 };

  function rect(x: number, y: number, width: number, height: number): Rect {
    return { x, y, width, height };
  }

  function rectsOf(rects: Rect[]): number[][] {
    return rects.map(r => [r.x, r.y, r.width, r.height]);
  }

  const bounds = rect(100, 100, 610, 400);
  const rects = [rect(100, 100, 300, 400), rect(410, 100, 300, 200)];

  it('#resize should scale rects with bounds keeping the gap scaled', () => {

    // given
    const resize = new GroupResize(bounds, rects, [MIN, MIN]);

    // when
    const resized = resize.resize(rect(100, 100, 1220, 800));

    // then
    expect(rectsOf(resized)).toEqual([[100, 100, 600, 800], [720, 100, 600, 400]]);
  });

  it('#resize should move rects with moved start edges', () => {

    // given
    const resize = new GroupResize(bounds, rects, [MIN, MIN]);

    // when
    const resized = resize.resize(rect(0, 50, 610, 400));

    // then
    expect(rectsOf(resized)).toEqual([[0, 50, 300, 400], [310, 50, 300, 200]]);
  });

  it('#resize should keep min size of shrunk rect within the new bounds', () => {

    // given
    const resize = new GroupResize(rect(0, 0, 400, 100), [rect(0, 0, 100, 100), rect(300, 0, 100, 100)], [MIN, MIN]);

    // when
    const resized = resize.resize(rect(0, 0, 300, 100));

    // then
    expect(rectsOf(resized)).toEqual([[0, 0, 100, 100], [200, 0, 100, 100]]);
  });

  it('#resize should keep size of rect already below its min size', () => {

    // given
    const resize = new GroupResize(rect(0, 0, 200, 100), [rect(0, 0, 50, 100), rect(100, 0, 100, 100)], [MIN, MIN]);

    // when
    const resized = resize.resize(rect(0, 0, 100, 100));

    // then
    expect(rectsOf(resized)[0]).toEqual([0, 0, 50, 100]);
  });

  it('#minSize should keep every rect at its min size', () => {

    // given
    const resize = new GroupResize(bounds, rects, [MIN, { width: 150, height: 150 }]);

    // when
    const minSize = resize.minSize();

    // then
    expect(minSize).toEqual({ width: 305, height: 300 });
  });

  it('#minSize should not exceed bounds of rect below its min size', () => {

    // given
    const resize = new GroupResize(rect(0, 0, 50, 50), [rect(0, 0, 50, 50)], [MIN]);

    // when
    const minSize = resize.minSize();

    // then
    expect(minSize).toEqual({ width: 50, height: 50 });
  });
});
