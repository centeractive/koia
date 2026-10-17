import { ElementContext, SummaryContext } from 'app/shared/model';
import { FreeLayout } from './free-layout';

describe('FreeLayout', () => {

  const layout = new FreeLayout();

  function tile(x: number, y: number, width: number, height: number, z?: number): ElementContext {
    const context = new SummaryContext([]);
    context.setPosition(x, y);
    context.setSize(width, height);
    context.z = z;
    return context;
  }

  function unpositioned(width = 600, height = 400): ElementContext {
    const context = new SummaryContext([]);
    context.setSize(width, height);
    return context;
  }

  function positionsOf(contexts: ElementContext[]): number[][] {
    return contexts.map(c => [c.x, c.y]);
  }

  it('#canvasStyle should define page unit as canvas width share', () => {

    // when
    const result = layout.canvasStyle();

    // then
    expect(result).toEqual({ '--koia-pu': 'calc(100cqw / 1400)' });
  });

  it('#pageStyle should give page height in page units', () => {

    // when
    const result = layout.pageStyle();

    // then
    expect(result).toEqual({ height: 'calc(950 * var(--koia-pu))' });
  });

  it('#tileStyle should position tile relative to its page', () => {

    // when
    const style = layout.tileStyle(tile(100, 1000, 300, 200));

    // then
    expect(style).toEqual(expect.objectContaining({
      left: 'calc(100 * var(--koia-pu))',
      top: 'calc(50 * var(--koia-pu))',
      width: 'calc(300 * var(--koia-pu))',
      height: 'calc(200 * var(--koia-pu))'
    }));
  });

  it('#tileStyle should stack tile by z-order', () => {

    // when
    const style = layout.tileStyle(tile(0, 0, 300, 200, 3));

    // then
    expect(style['z-index']).toBe(3);
  });

  it('#guideStyle should place vertical guide', () => {

    // when
    const result = layout.guideStyle({ axis: 'x', position: 700 });

    // then
    expect(result).toEqual({ left: 'calc(700 * var(--koia-pu))' });
  });

  it('#guideStyle should place horizontal guide', () => {

    // when
    const result = layout.guideStyle({ axis: 'y', position: 950 });

    // then
    expect(result).toEqual({ top: 'calc(950 * var(--koia-pu))' });
  });

  it('#rectOf should limit size to page', () => {

    // when
    const rect = layout.rectOf(tile(1200, 0, 600, 1200));

    // then
    expect(rect).toEqual({ x: 1200, y: 0, width: 200, height: 950 });
  });

  it('#rectOf should default missing size', () => {

    // when
    const rect = layout.rectOf(tile(0, 0, null, null));

    // then
    expect(rect).toEqual({ x: 0, y: 0, width: 600, height: 400 });
  });

  it('#pageIndexes should add spare page after used pages', () => {

    // when
    const pages = layout.pageIndexes([tile(0, 0, 600, 400), tile(0, 950, 600, 50)]);

    // then
    expect(pages).toEqual([0, 1, 2]);
  });

  it('#pageIndexes should provide one page and spare page when empty', () => {

    // when
    const pages = layout.pageIndexes([]);

    // then
    expect(pages).toEqual([0, 1]);
  });

  it('#pageOf should return page of tile top', () => {

    // when
    const page = layout.pageOf(tile(0, 1900, 600, 400));

    // then
    expect(page).toBe(2);
  });

  it('#contextsOnPage should return contexts with top on page', () => {

    // given
    const first = tile(0, 0, 600, 400);
    const second = tile(0, 960, 600, 400);

    // when
    const contexts = layout.contextsOnPage([first, second], 1);

    // then
    expect(contexts).toEqual([second]);
  });

  it('#fitToPages should keep rects within pages', () => {

    // given
    const rects = [{ x: 0, y: 0, width: 400, height: 400 }, { x: 410, y: 0, width: 400, height: 400 }];

    // when
    const fitted = layout.fitToPages(rects);

    // then
    expect(fitted).toEqual(rects);
  });

  it('#fitToPages should push row crossing page to next page top', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 900 }, { x: 0, y: 910, width: 100, height: 400 }]);

    // then
    expect(fitted.map(r => r.y)).toEqual([0, 950]);
  });

  it('#fitToPages should shift rows below pushed row', () => {

    // when
    const fitted = layout.fitToPages([
      { x: 0, y: 0, width: 100, height: 900 },
      { x: 0, y: 910, width: 100, height: 400 },
      { x: 110, y: 910, width: 100, height: 20 },
      { x: 0, y: 1320, width: 100, height: 100 }
    ]);

    // then
    expect(fitted.map(r => r.y)).toEqual([0, 950, 950, 1360]);
  });

  it('#fitToPages should cap height at page height', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 1400 }]);

    // then
    expect(fitted).toEqual([{ x: 0, y: 0, width: 100, height: 950 }]);
  });

  it('#fitToPages should pull row to top of its page after capped tile', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 1400 }, { x: 0, y: 1410, width: 100, height: 1400 }]);

    // then
    expect(fitted).toEqual([{ x: 0, y: 0, width: 100, height: 950 }, { x: 0, y: 950, width: 100, height: 950 }]);
  });

  it('#fitToPages should not pull row above fitted bottom', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 910, width: 100, height: 400 }], 900);

    // then
    expect(fitted.map(r => r.y)).toEqual([950]);
  });

  it('#placeUnpositioned should flow tiles in rows', () => {

    // given
    const contexts = [unpositioned(), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 0], [610, 0]]);
  });

  it('#placeUnpositioned should wrap tile exceeding page width', () => {

    // given
    const contexts = [unpositioned(600, 300), unpositioned(800, 400)];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 0], [0, 310]]);
  });

  it('#placeUnpositioned should not wrap first tile of row', () => {

    // given
    const contexts = [unpositioned(2000, 400)];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 0]]);
    expect(contexts[0].width).toBe(1400);
  });

  it('#placeUnpositioned should wrap below tile capped at page height', () => {

    // given
    const contexts = [unpositioned(1400, 1200), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 0], [0, 960]]);
    expect(contexts[0].height).toBe(950);
  });

  it('#placeUnpositioned should place below positioned tiles', () => {

    // given
    const contexts = [tile(0, 0, 600, 400, 1), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 0], [0, 410]]);
  });

  it('#placeUnpositioned should push tile crossing page below positioned tiles to next page', () => {

    // given
    const contexts = [tile(0, 500, 600, 400, 1), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 500], [0, 950]]);
  });

  it('#placeUnpositioned should default missing size', () => {

    // given
    const contexts = [unpositioned(null, null)];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect([contexts[0].width, contexts[0].height]).toEqual([600, 400]);
  });

  it('#placeUnpositioned should put placed tiles in front', () => {

    // given
    const contexts = [tile(0, 0, 600, 400, 5), unpositioned(), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(contexts.map(c => c.z)).toEqual([5, 6, 7]);
  });

  it('#placeUnpositioned should keep positioned tiles', () => {

    // given
    const positioned = tile(100, 100, 300, 200);

    // when
    layout.placeUnpositioned([positioned, unpositioned()]);

    // then
    expect([positioned.x, positioned.y, positioned.width, positioned.height, positioned.z]).toEqual([100, 100, 300, 200, undefined]);
  });

  it('#rectFromRendered should convert pixels to page units', () => {

    // when
    const rect = layout.rectFromRendered(50.2, 100, 200, 299.8, 0.5);

    // then
    expect(rect).toEqual({ x: 100, y: 200, width: 400, height: 600 });
  });

  it('#bringToFront should rank tile above others', () => {

    // given
    const contexts = [tile(0, 0, 100, 100, 1), tile(0, 0, 100, 100, 2), tile(0, 0, 100, 100, 3)];

    // when
    layout.bringToFront(contexts[0], contexts);

    // then
    expect(contexts.map(c => c.z)).toEqual([3, 1, 2]);
  });

  it('#sendToBack should rank tile below others', () => {

    // given
    const contexts = [tile(0, 0, 100, 100, 1), tile(0, 0, 100, 100, 2), tile(0, 0, 100, 100, 3)];

    // when
    layout.sendToBack(contexts[2], contexts);

    // then
    expect(contexts.map(c => c.z)).toEqual([2, 3, 1]);
  });

  it('#bringToFront should rank tile without z-order as lowest', () => {

    // given
    const contexts = [tile(0, 0, 100, 100, 2), tile(0, 0, 100, 100), tile(0, 0, 100, 100), tile(0, 0, 100, 100, 1)];

    // when
    layout.bringToFront(contexts[3], contexts);

    // then
    expect(contexts.map(c => c.z)).toEqual([3, 1, 2, 4]);
  });
});
