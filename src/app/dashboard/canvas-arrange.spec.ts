import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { CanvasArrange } from './canvas-arrange';
import { FreeLayout, Rect } from './free-layout';

describe('CanvasArrange', () => {

  const landscape = new CanvasArrange(new FreeLayout(PageFormat.LANDSCAPE));
  const unpaged = new CanvasArrange(new FreeLayout(PageFormat.UNPAGED));

  function rect(x: number, y: number, width: number, height: number): Rect {
    return { x, y, width, height };
  }

  function rectsOf(rects: Rect[]): number[][] {
    return rects.map(r => [r.x, r.y, r.width, r.height]);
  }

  const rects = [rect(100, 100, 200, 100), rect(400, 300, 100, 300)];

  it('#align left should move rects to left edge of bounds', () => {

    // when
    const aligned = landscape.align(rects, 'left');

    // then
    expect(rectsOf(aligned)).toEqual([[100, 100, 200, 100], [100, 300, 100, 300]]);
  });

  it('#align center should center rects horizontally in bounds', () => {

    // when
    const aligned = landscape.align(rects, 'center');

    // then
    expect(rectsOf(aligned)).toEqual([[200, 100, 200, 100], [250, 300, 100, 300]]);
  });

  it('#align right should move rects to right edge of bounds', () => {

    // when
    const aligned = landscape.align(rects, 'right');

    // then
    expect(rectsOf(aligned)).toEqual([[300, 100, 200, 100], [400, 300, 100, 300]]);
  });

  it('#align top should move rects to top edge of bounds', () => {

    // when
    const aligned = landscape.align(rects, 'top');

    // then
    expect(rectsOf(aligned)).toEqual([[100, 100, 200, 100], [400, 100, 100, 300]]);
  });

  it('#align middle should center rects vertically in bounds', () => {

    // when
    const aligned = landscape.align(rects, 'middle');

    // then
    expect(rectsOf(aligned)).toEqual([[100, 300, 200, 100], [400, 200, 100, 300]]);
  });

  it('#align bottom should move rects to bottom edge of bounds', () => {

    // when
    const aligned = landscape.align(rects, 'bottom');

    // then
    expect(rectsOf(aligned)).toEqual([[100, 500, 200, 100], [400, 300, 100, 300]]);
  });

  it('#align bottom should keep each rect within the page it is moved onto', () => {

    // when
    const aligned = landscape.align([rect(0, 900, 200, 400), rect(300, 1000, 200, 100)], 'bottom');

    // then
    expect(rectsOf(aligned)).toEqual([[0, 550, 200, 400], [300, 1200, 200, 100]]);
  });

  it('#distribute should space centres equally between outermost centres', () => {

    // when
    const distributed = landscape.distribute([rect(600, 0, 100, 100), rect(0, 0, 100, 100), rect(100, 0, 300, 100)], 'x');

    // then
    expect(rectsOf(distributed)).toEqual([[600, 0, 100, 100], [0, 0, 100, 100], [200, 0, 300, 100]]);
  });

  it('#distribute should space vertically', () => {

    // when
    const distributed = landscape.distribute([rect(0, 0, 100, 100), rect(0, 50, 100, 100), rect(0, 401, 100, 100)], 'y');

    // then
    expect(rectsOf(distributed)).toEqual([[0, 0, 100, 100], [0, 201, 100, 100], [0, 401, 100, 100]]);
  });

  it('#distribute should keep fewer than three rects', () => {

    // when
    const distributed = landscape.distribute(rects, 'x');

    // then
    expect(distributed).toBe(rects);
  });

  it('#nudge should move all rects by delta', () => {

    // when
    const nudged = landscape.nudge(rects, 10, -1);

    // then
    expect(rectsOf(nudged)).toEqual([[110, 99, 200, 100], [410, 299, 100, 300]]);
  });

  it('#nudge should stop at page width and left edge', () => {

    // when
    const right = landscape.nudge([rect(1195, 0, 200, 100), rect(0, 0, 100, 100)], 10, 0);
    const left = landscape.nudge([rect(5, 0, 200, 100)], -10, 0);

    // then
    expect(rectsOf(right)).toEqual([[1200, 0, 200, 100], [5, 0, 100, 100]]);
    expect(rectsOf(left)).toEqual([[0, 0, 200, 100]]);
  });

  it('#nudge should keep each rect within its page', () => {

    // when
    const down = landscape.nudge([rect(0, 845, 100, 100), rect(200, 1000, 100, 100)], 0, 10);
    const up = landscape.nudge([rect(0, 955, 100, 100)], 0, -10);

    // then
    expect(rectsOf(down)).toEqual([[0, 850, 100, 100], [200, 1005, 100, 100]]);
    expect(rectsOf(up)).toEqual([[0, 950, 100, 100]]);
  });

  it('#nudge should move unpaged rects down without limit and stop at top', () => {

    // when
    const down = unpaged.nudge([rect(0, 945, 100, 100)], 0, 10);
    const up = unpaged.nudge([rect(0, 5, 100, 100)], 0, -10);

    // then
    expect(rectsOf(down)).toEqual([[0, 955, 100, 100]]);
    expect(rectsOf(up)).toEqual([[0, 0, 100, 100]]);
  });

  it('#moveBy should keep arrangement within page width and below top', () => {

    // when
    const moved = landscape.moveBy(rects, 1000, -200);

    // then
    expect(rectsOf(moved)).toEqual([[1000, 0, 200, 100], [1300, 200, 100, 300]]);
  });

  it('#moveBy should keep rect within its page', () => {

    // when
    const moved = landscape.moveBy([rect(0, 800, 100, 100)], 0, 100);

    // then
    expect(rectsOf(moved)).toEqual([[0, 850, 100, 100]]);
  });
});
