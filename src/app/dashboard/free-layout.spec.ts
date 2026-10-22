import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { FreeLayout } from './free-layout';
import { PageFormat } from 'app/shared/ui/sheets/page-format';

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

  it('#fitToPages should keep rects within pages below top padding', () => {

    // given
    const rects = [{ x: 0, y: 0, width: 400, height: 400 }, { x: 410, y: 0, width: 400, height: 400 }];

    // when
    const fitted = layout.fitToPages(rects);

    // then
    expect(fitted).toEqual(rects.map(r => ({ ...r, y: 10 })));
  });

  it('#fitToPages should push row crossing page to top padding of next page', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 900 }, { x: 0, y: 910, width: 100, height: 400 }]);

    // then
    expect(fitted.map(r => r.y)).toEqual([10, 960]);
  });

  it('#fitToPages should move row within top padding of its page below it', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 955, width: 100, height: 100 }]);

    // then
    expect(fitted.map(r => r.y)).toEqual([960]);
  });

  it('#fitToPages should keep row at top padding of its page', () => {

    // given
    const rects = [{ x: 0, y: 10, width: 100, height: 100 }];

    // when
    const fitted = layout.fitToPages(rects);

    // then
    expect(fitted).toEqual(rects);
  });

  it('#fitToPages should push row filling page bottom to next page after top padding', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 900 }, { x: 700, y: 50, width: 100, height: 900 }]);

    // then
    expect(fitted.map(r => r.y)).toEqual([10, 960]);
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
    expect(fitted.map(r => r.y)).toEqual([10, 960, 960, 1370]);
  });

  it('#fitToPages should cap height at page height less top padding', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 1400 }]);

    // then
    expect(fitted).toEqual([{ x: 0, y: 10, width: 100, height: 940 }]);
  });

  it('#fitToPages should pull row to top padding of its page after capped tile', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 0, width: 100, height: 1400 }, { x: 0, y: 1410, width: 100, height: 1400 }]);

    // then
    expect(fitted).toEqual([{ x: 0, y: 10, width: 100, height: 940 }, { x: 0, y: 960, width: 100, height: 940 }]);
  });

  it('#fitToPages should not pull row above fitted bottom', () => {

    // when
    const fitted = layout.fitToPages([{ x: 0, y: 910, width: 100, height: 400 }], 900);

    // then
    expect(fitted.map(r => r.y)).toEqual([960]);
  });

  it('#placeUnpositioned should flow tiles in rows', () => {

    // given
    const contexts = [unpositioned(), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 10], [610, 10]]);
  });

  it('#placeUnpositioned should wrap tile exceeding page width', () => {

    // given
    const contexts = [unpositioned(600, 300), unpositioned(800, 400)];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 10], [0, 320]]);
  });

  it('#placeUnpositioned should not wrap first tile of row', () => {

    // given
    const contexts = [unpositioned(2000, 400)];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 10]]);
    expect(contexts[0].width).toBe(1400);
  });

  it('#placeUnpositioned should wrap below tile capped at page height less top padding', () => {

    // given
    const contexts = [unpositioned(1400, 1200), unpositioned()];

    // when
    layout.placeUnpositioned(contexts);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 10], [0, 960]]);
    expect(contexts[0].height).toBe(940);
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
    expect(positionsOf(contexts)).toEqual([[0, 500], [0, 960]]);
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

  function textBox(x?: number, y?: number, z?: number): TextBoxContext {
    const context = new TextBoxContext([]);
    if (x != null) {
      context.setPosition(x, y);
    }
    context.z = z;
    return context;
  }

  it('#tileStyle should stack overlay above tiles', () => {

    // when
    const style = layout.tileStyle(textBox(0, 0, 3));

    // then
    expect(style['z-index']).toBe(FreeLayout.OVERLAY_Z_OFFSET + 3);
  });

  it('#tileStyle should stack overlay without z-order directly above tiles', () => {

    // when
    const style = layout.tileStyle(textBox(0, 0));

    // then
    expect(style['z-index']).toBe(FreeLayout.OVERLAY_Z_OFFSET);
  });

  it('#overlayStyle should give fallback position, size and z-order by custom properties without anchor', () => {

    // given
    const context = textBox(100, 1000, 2);
    context.setSize(200, 50);

    // when
    const style = layout.overlayStyle(context, '--koia-tile-0');

    // then
    expect(style).toEqual({
      '--koia-left': 'calc(100 * var(--koia-pu))',
      '--koia-top': 'calc(1000 * var(--koia-pu))',
      width: 'calc(200 * var(--koia-pu))',
      height: 'calc(50 * var(--koia-pu))',
      'z-index': FreeLayout.OVERLAY_Z_OFFSET + 2
    });
  });

  it('#overlayStyle should give anchor name and offset as percentages when anchored', () => {

    // given
    const context = textBox(100, 200, 2);
    context.setAnchor(new SummaryContext([]), { x: 0.6, y: 0.75 });

    // when
    const style = layout.overlayStyle(context, '--koia-tile-3');

    // then
    expect(style).toEqual(expect.objectContaining({
      '--koia-left': 'calc(100 * var(--koia-pu))',
      '--koia-top': 'calc(200 * var(--koia-pu))',
      '--koia-anchor': '--koia-tile-3',
      '--koia-anchor-fx': '60%',
      '--koia-anchor-fy': '75%'
    }));
    expect(Object.keys(style)).not.toContain('left');
    expect(Object.keys(style)).not.toContain('top');
  });

  it.each([
    { case: 'larger fit height', fitHeight: 400, height: 400 },
    { case: 'fit height beyond page height', fitHeight: 1200, height: 1200 },
    { case: 'smaller fit height', fitHeight: 100, height: 150 },
    { case: 'no fit height', fitHeight: undefined, height: 150 }
  ])('#grownRect should give height of text box with $case', ({ fitHeight, height }) => {

    // given
    const context = textBox(10, 20);
    context.fitHeight = fitHeight;

    // when
    const rect = layout.grownRect(layout.rectOf(context), context);

    // then
    expect(rect).toEqual({ x: 10, y: 20, width: 300, height });
  });

  it('#grownRect should return rect of other element', () => {

    // given
    const context = tile(0, 0, 300, 200);
    const rect = layout.rectOf(context);

    // when
    const grown = layout.grownRect(rect, context);

    // then
    expect(grown).toBe(rect);
  });

  it('#tileStyle should give grown height of text box', () => {

    // given
    const context = textBox(0, 0);
    context.fitHeight = 400;

    // when
    const style = layout.tileStyle(context);

    // then
    expect(style['height']).toBe('calc(400 * var(--koia-pu))');
  });

  it('#overlayStyle should give grown height of text box', () => {

    // given
    const context = textBox(0, 0);
    context.fitHeight = 400;

    // when
    const style = layout.overlayStyle(context, '--a');

    // then
    expect(style['height']).toBe('calc(400 * var(--koia-pu))');
  });

  it('#pageIndexes should count page a grown text box reaches into', () => {

    // given
    const context = textBox(0, 900);
    context.fitHeight = 100;

    // when
    const pages = layout.pageIndexes([context]);

    // then
    expect(pages).toEqual([0, 1, 2]);
  });

  it('#placeUnpositioned should place below grown text box', () => {

    // given
    const grown = textBox(0, 0, 1);
    grown.fitHeight = 300;
    const placed = unpositioned(300, 200);

    // when
    layout.placeUnpositioned([grown, placed]);

    // then
    expect(positionsOf([placed])).toEqual([[0, 310]]);
  });

  it('#minSizeOf should return text box minimum size for text box', () => {

    // when
    const size = layout.minSizeOf(textBox());

    // then
    expect(size).toEqual({ width: 40, height: 30 });
  });

  it('#minSizeOf should return tile minimum size for other element', () => {

    // when
    const size = layout.minSizeOf(unpositioned());

    // then
    expect(size).toEqual({ width: FreeLayout.MIN_SIZE, height: FreeLayout.MIN_SIZE });
  });

  it('#anchorAt should return undefined when no tile contains top left corner', () => {

    // given
    const tiles = [{ tile: tile(0, 0, 100, 100), rect: { x: 0, y: 0, width: 100, height: 100 } }];

    // when
    const anchoring = layout.anchorAt({ x: 100, y: 50, width: 50, height: 50 }, tiles);

    // then
    expect(anchoring).toBeUndefined();
  });

  it('#anchorAt should return containing tile with offset as fractions of tile size', () => {

    // given
    const other = { tile: tile(0, 0, 0, 0), rect: { x: 0, y: 0, width: 100, height: 100 } };
    const containing = { tile: tile(0, 0, 0, 0), rect: { x: 200, y: 100, width: 400, height: 200 } };

    // when
    const anchoring = layout.anchorAt({ x: 300, y: 250, width: 500, height: 500 }, [other, containing]);

    // then
    expect(anchoring).toEqual({ tile: containing.tile, offset: { x: 0.25, y: 0.75 } });
  });

  it('#anchorAt should return tile with top left corner at its start edges', () => {

    // given
    const tiles = [{ tile: tile(0, 0, 0, 0), rect: { x: 200, y: 100, width: 400, height: 200 } }];

    // when
    const anchoring = layout.anchorAt({ x: 200, y: 100, width: 50, height: 50 }, tiles);

    // then
    expect(anchoring.offset).toEqual({ x: 0, y: 0 });
  });

  it('#anchorAt should return topmost of overlapping tiles', () => {

    // given
    const top = { tile: tile(0, 0, 0, 0, 3), rect: { x: 0, y: 0, width: 400, height: 400 } };
    const middle = { tile: tile(0, 0, 0, 0, 2), rect: { x: 0, y: 0, width: 400, height: 400 } };
    const bottom = { tile: tile(0, 0, 0, 0), rect: { x: 0, y: 0, width: 400, height: 400 } };

    // when
    const anchoring = layout.anchorAt({ x: 10, y: 10, width: 50, height: 50 }, [top, bottom, middle]);

    // then
    expect(anchoring.tile).toBe(top.tile);
  });

  it('#anchorAt should return last of overlapping tiles with equal z-order', () => {

    // given
    const first = { tile: tile(0, 0, 0, 0), rect: { x: 0, y: 0, width: 400, height: 400 } };
    const last = { tile: tile(0, 0, 0, 0), rect: { x: 0, y: 0, width: 400, height: 400 } };

    // when
    const anchoring = layout.anchorAt({ x: 10, y: 10, width: 50, height: 50 }, [first, last]);

    // then
    expect(anchoring.tile).toBe(last.tile);
  });

  it('#placeUnpositionedOverlays should cascade unpositioned overlays from rounded top and put them in front', () => {

    // given
    const contexts = [tile(0, 0, 600, 400, 4), textBox(), unpositioned(), textBox()];

    // when
    layout.placeUnpositionedOverlays(contexts, 503);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 0], [0, 500], [undefined, undefined], [20, 520]]);
    expect(contexts.map(c => c.z)).toEqual([4, 5, undefined, 6]);
  });

  it('#placeUnpositionedOverlays should continue cascade after overlays occupying cascade slots', () => {

    // given
    const contexts = [textBox(0, 500, 1), textBox(20, 520, 2), textBox()];

    // when
    layout.placeUnpositionedOverlays(contexts, 500);

    // then
    expect(positionsOf(contexts)).toEqual([[0, 500], [20, 520], [40, 540]]);
    expect(contexts[2].z).toBe(3);
  });

  it('#placeUnpositionedOverlays should ignore overlays outside cascade slots', () => {

    // given
    const contexts = [textBox(15, 515), textBox(20, 500), textBox()];

    // when
    layout.placeUnpositionedOverlays(contexts, 500);

    // then
    expect(positionsOf(contexts)[2]).toEqual([0, 500]);
  });

  it('#clampIntoPage should keep rect within page', () => {

    // when
    const rect = layout.clampIntoPage({ x: 100, y: 1000, width: 300, height: 200 }, PageFormat.LANDSCAPE.height);

    // then
    expect(rect).toEqual({ x: 100, y: 1000, width: 300, height: 200 });
  });

  it('#clampIntoPage should move rect crossing page edges into page', () => {

    // when
    const rect = layout.clampIntoPage({ x: 1300, y: 1800, width: 300, height: 200 }, PageFormat.LANDSCAPE.height);

    // then
    expect(rect).toEqual({ x: 1100, y: 1700, width: 300, height: 200 });
  });

  it('#clampIntoPage should move rect above page to page top and cap size', () => {

    // when
    const rect = layout.clampIntoPage({ x: -10, y: 900, width: 2000, height: 1000 }, PageFormat.LANDSCAPE.height);

    // then
    expect(rect).toEqual({ x: 0, y: 950, width: 1400, height: 950 });
  });

  describe('page formats', () => {

    const portrait = new FreeLayout(PageFormat.PORTRAIT);
    const unpaged = new FreeLayout(PageFormat.UNPAGED);

    it('should lay out landscape pages by default', () => {

      // when
      const format = new FreeLayout().pageFormat;

      // then
      expect(format).toBe(PageFormat.LANDSCAPE);
    });

    it('#canvasStyle should define page unit as share of portrait page width', () => {

      // when
      const result = portrait.canvasStyle();

      // then
      expect(result).toEqual({ '--koia-pu': 'calc(100cqw / 950)' });
    });

    it.each([
      { layout, page: 0, height: 'calc(950 * var(--koia-pu))' },
      { layout: portrait, page: 1, height: 'calc(1400 * var(--koia-pu))' },
      { layout: unpaged, page: 0, height: 'calc(810 * var(--koia-pu))' },
      { layout: unpaged, page: 1, height: 'calc(950 * var(--koia-pu))' }
    ])('#pageContentStyle should give height $height to page $page of $layout.pageFormat.paging layout', ({ layout, page, height }) => {

      // when
      const result = layout.pageContentStyle(page, [tile(0, 0, 600, 400), tile(0, 410, 600, 400)]);

      // then
      expect(result).toEqual({ height });
    });

    const GAP = 40;
    const contentTop = PageFormat.LANDSCAPE.marginY + PageFormat.SHEET_HEADER;
    const pitch = PageFormat.LANDSCAPE.sheetHeight + GAP;

    it.each([
      { case: 'first page', y: 100, layerY: contentTop + 100 },
      { case: 'second page top', y: 950, layerY: pitch + contentTop },
      { case: 'third page', y: 2000, layerY: 2 * pitch + contentTop + 100 }
    ])('#layerYOf should add sheet margins, header, footer and gap above y on $case', ({ y, layerY }) => {

      // when
      const result = layout.layerYOf(y, GAP);

      // then
      expect(result).toBeCloseTo(layerY, 10);
    });

    it('#layerYOf should add sheets of portrait pages', () => {

      // when
      const result = portrait.layerYOf(1500, GAP);

      // then
      expect(result).toBeCloseTo(PageFormat.PORTRAIT.sheetHeight + GAP + PageFormat.PORTRAIT.marginY + PageFormat.SHEET_HEADER + 100, 10);
    });

    it.each([
      { case: 'first page', layerY: contentTop + 100, y: 100 },
      { case: 'second page', layerY: pitch + contentTop, y: 950 },
      { case: 'top margin of first sheet', layerY: 10, y: 0 },
      { case: 'header of first sheet', layerY: contentTop - 10, y: 0 },
      { case: 'footer of first sheet', layerY: contentTop + 960, y: 950 },
      { case: 'gap between sheets', layerY: PageFormat.LANDSCAPE.sheetHeight + 20, y: 950 },
      { case: 'header of second sheet', layerY: pitch + contentTop - 10, y: 950 },
      { case: 'point above first sheet', layerY: -200, y: 0 }
    ])('#layoutYOf should map $case to y $y', ({ layerY, y }) => {

      // when
      const result = layout.layoutYOf(layerY, GAP);

      // then
      expect(result).toBeCloseTo(y, 10);
    });

    it('#layerXOf and #layoutXOf should add and remove side margin of sheet', () => {

      // when
      const result = [layout.layerXOf(100), layout.layoutXOf(100)];

      // then
      expect(result).toEqual([100 + PageFormat.LANDSCAPE.marginX, 100 - PageFormat.LANDSCAPE.marginX]);
    });

    it('#layerXOf and #layoutXOf should keep x without pages', () => {

      // when
      const result = [unpaged.layerXOf(100), unpaged.layoutXOf(100)];

      // then
      expect(result).toEqual([100, 100]);
    });

    it('#layerYOf and #layoutYOf should keep y without pages', () => {

      // when
      const result = [unpaged.layerYOf(2000, GAP), unpaged.layoutYOf(2000, GAP)];

      // then
      expect(result).toEqual([2000, 2000]);
    });

    it('#rectOf should limit size to portrait page', () => {

      // when
      const rect = portrait.rectOf({ x: 400, y: 0, width: 800, height: 1600 });

      // then
      expect(rect).toEqual({ x: 400, y: 0, width: 550, height: 1400 });
    });

    it('#pageIndexes should count portrait pages', () => {

      // when
      const pages = portrait.pageIndexes([tile(0, 1300, 600, 400)]);

      // then
      expect(pages).toEqual([0, 1, 2]);
    });

    it('#pageIndexes should provide content and spare page without pages', () => {

      // when
      const pages = unpaged.pageIndexes([tile(0, 3000, 600, 400)]);

      // then
      expect(pages).toEqual([0, 1]);
    });

    it('#pageOf should place every tile on first page without pages', () => {

      // when
      const page = unpaged.pageOf(tile(0, 3000, 600, 400));

      // then
      expect(page).toBe(0);
    });

    it('#fitToPages should push row crossing portrait page to top padding of next page', () => {

      // when
      const rects = portrait.fitToPages([{ x: 0, y: 0, width: 600, height: 400 }, { x: 0, y: 1200, width: 600, height: 400 }]);

      // then
      expect(rects.map(r => r.y)).toEqual([10, 1410]);
    });

    it('#fitToPages should not pad page top without pages', () => {

      // given
      const rects = [{ x: 0, y: 0, width: 600, height: 400 }];

      // when
      const fitted = unpaged.fitToPages(rects);

      // then
      expect(fitted).toEqual(rects);
    });

    it('#fitToPages should only cap heights without pages', () => {

      // when
      const rects = unpaged.fitToPages([{ x: 0, y: 900, width: 600, height: 1200 }]);

      // then
      expect(rects).toEqual([{ x: 0, y: 900, width: 600, height: 950 }]);
    });

    it('#placeUnpositioned should wrap tiles at portrait page width', () => {

      // given
      const contexts = [unpositioned(), unpositioned()];

      // when
      portrait.placeUnpositioned(contexts);

      // then
      expect(positionsOf(contexts)).toEqual([[0, 10], [0, 420]]);
    });

    it('#placeUnpositioned should place tiles across former page boundary without pages', () => {

      // given
      const contexts = [unpositioned(600, 900), unpositioned(1400, 400)];

      // when
      unpaged.placeUnpositioned(contexts);

      // then
      expect(positionsOf(contexts)).toEqual([[0, 0], [0, 910]]);
    });

    it('#clampIntoPage should keep rect within portrait page', () => {

      // when
      const rect = portrait.clampIntoPage({ x: 800, y: 1300, width: 300, height: 200 }, 0);

      // then
      expect(rect).toEqual({ x: 650, y: 1200, width: 300, height: 200 });
    });

    it('#clampIntoPage should only keep rect below top without pages', () => {

      // when
      const rects = [unpaged.clampIntoPage({ x: 1300, y: 2000, width: 300, height: 200 }, 0),
        unpaged.clampIntoPage({ x: 0, y: -50, width: 300, height: 200 }, 0)];

      // then
      expect(rects).toEqual([{ x: 1100, y: 2000, width: 300, height: 200 }, { x: 0, y: 0, width: 300, height: 200 }]);
    });

    it('#packRows should start rows at given top and wrap at page width', () => {

      // when
      const rects = layout.packRows([{ width: 700, height: 300 }, { width: 700, height: 200 }, { width: 600, height: 100 }], 100);

      // then
      expect(rects).toEqual([
        { x: 0, y: 100, width: 700, height: 300 },
        { x: 0, y: 410, width: 700, height: 200 },
        { x: 710, y: 410, width: 600, height: 100 }
      ]);
    });

    it('#packRows should cap sizes at page size less top padding', () => {

      // when
      const rects = portrait.packRows([{ width: 1200, height: 1500 }], 0);

      // then
      expect(rects).toEqual([{ x: 0, y: 0, width: 950, height: 1390 }]);
    });

    it('#packRows should cap height at page height without pages', () => {

      // when
      const rects = unpaged.packRows([{ width: 600, height: 1200 }], 0);

      // then
      expect(rects).toEqual([{ x: 0, y: 0, width: 600, height: 950 }]);
    });

    it('#anchoredRect should move rect to rounded offset within anchor rect keeping its size', () => {

      // when
      const rect = layout.anchoredRect({ x: 5, y: 5, width: 300, height: 150 }, { x: 100, y: 200, width: 333, height: 101 },
        { x: 0.5, y: 0.25 });

      // then
      expect(rect).toEqual({ x: 267, y: 225, width: 300, height: 150 });
    });
  });

  describe('#placeCentered', () => {

    it('should centre overlay at centre and put it in front', () => {

      // given
      const note = textBox();
      const contexts = [tile(0, 0, 600, 400, 4), note];

      // when
      layout.placeCentered(note, { x: 700.4, y: 500.6 }, contexts, false);

      // then
      expect([note.x, note.y, note.z]).toEqual([550, 426, 5]);
    });

    it('should cascade overlay past overlays at its spot', () => {

      // given
      const note = textBox();
      const contexts = [textBox(550, 425), textBox(570, 445), tile(570, 445, 600, 400), note];

      // when
      layout.placeCentered(note, { x: 700, y: 500 }, contexts, false);

      // then
      expect([note.x, note.y]).toEqual([590, 465]);
    });

    it('should cascade overlay clamped at top past overlay at clamped spot', () => {

      // given
      const note = textBox();
      const contexts = [textBox(550, 0), note];

      // when
      layout.placeCentered(note, { x: 700, y: 10 }, contexts, false);

      // then
      expect([note.x, note.y]).toEqual([570, 20]);
    });

    it('should stop cascading when clamped overlay cannot move further', () => {

      // given
      const note = textBox();
      const bottomRight = { x: PageFormat.LANDSCAPE.width - 300, y: PageFormat.LANDSCAPE.height - 150 };
      const contexts = [textBox(bottomRight.x, bottomRight.y), note];

      // when
      layout.placeCentered(note, { x: PageFormat.LANDSCAPE.width, y: PageFormat.LANDSCAPE.height - 1 }, contexts, true);

      // then
      expect([note.x, note.y]).toEqual([bottomRight.x, bottomRight.y]);
    });

    it('should clamp overlay into width and below top', () => {

      // given
      const left = textBox();
      const right = textBox();

      // when
      layout.placeCentered(left, { x: 10, y: -50 }, [left], false);
      layout.placeCentered(right, { x: PageFormat.LANDSCAPE.width, y: 2000 }, [right], false);

      // then
      expect([[left.x, left.y], [right.x, right.y]]).toEqual([[0, 0], [PageFormat.LANDSCAPE.width - 300, 1925]]);
    });

    it('should clamp overlay into page of centre when within page', () => {

      // given
      const note = textBox();

      // when
      layout.placeCentered(note, { x: 700, y: PageFormat.LANDSCAPE.height + 20 }, [note], true);

      // then
      expect([note.x, note.y]).toEqual([550, PageFormat.LANDSCAPE.height]);
    });

    it('should not compare overlay with itself', () => {

      // given
      const note = textBox(550, 425);

      // when
      layout.placeCentered(note, { x: 700, y: 500 }, [note], false);

      // then
      expect([note.x, note.y]).toEqual([550, 425]);
    });

    it('should clamp overlay into portrait page of centre', () => {

      // given
      const note = textBox();

      // when
      new FreeLayout(PageFormat.PORTRAIT).placeCentered(note, { x: 940, y: 1390 }, [note], true);

      // then
      expect([note.x, note.y]).toEqual([PageFormat.PORTRAIT.width - 300, PageFormat.PORTRAIT.height - 150]);
    });
  });

  describe('#fitSizeOf', () => {

    it('should not grow beyond portrait page height', () => {

      // when
      const size = new FreeLayout(PageFormat.PORTRAIT).fitSizeOf(textBox(0, 0), { width: 100, height: 2000 }, 1);

      // then
      expect(size.height).toBe(PageFormat.PORTRAIT.height);
    });

    it('should convert extent to page units rounding up', () => {

      // when
      const size = layout.fitSizeOf(textBox(0, 0), { width: 101, height: 61 }, 0.5);

      // then
      expect(size).toEqual({ width: 202, height: 122 });
    });

    it('should not shrink below minimum fit width nor minimum height', () => {

      // when
      const size = layout.fitSizeOf(textBox(0, 0), { width: 1, height: 1 }, 1);

      // then
      expect(size).toEqual({ width: TextBoxContext.MIN_FIT_WIDTH, height: TextBoxContext.MIN_HEIGHT });
    });

    it('should keep current width narrower than minimum fit width', () => {

      // given
      const narrow = textBox(0, 0);
      narrow.setSize(80, 100);

      // when
      const size = layout.fitSizeOf(narrow, { width: 1, height: 50 }, 1);

      // then
      expect(size).toEqual({ width: 80, height: 50 });
    });

    it('should not grow beyond current width nor page height', () => {

      // when
      const size = layout.fitSizeOf(textBox(0, 0), { width: 400, height: 2000 }, 1);

      // then
      expect(size).toEqual({ width: 300, height: PageFormat.LANDSCAPE.height });
    });
  });
});
