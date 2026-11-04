import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { CanvasLayerMapping } from './canvas-layer-mapping';
import { FreeLayout } from './free-layout';
import { selectionBoundsOf } from './selection-bounds';

describe('selectionBoundsOf', () => {

  const SCALE = 0.5;

  function setup(pageFormat: PageFormat): { layout: FreeLayout, mapping: CanvasLayerMapping } {
    const layout = new FreeLayout(pageFormat);
    return { layout, mapping: new CanvasLayerMapping(() => false, layout, () => undefined) };
  }

  function tile(x: number, y: number, width: number, height: number): ElementContext {
    const context = new SummaryContext([]);
    context.setPosition(x, y);
    context.setSize(width, height);
    return context;
  }

  function grownTextTile(x: number, y: number, width: number, height: number, fitHeight: number): ElementContext {
    const context = new TextBoxContext([], true);
    context.setPosition(x, y);
    context.setSize(width, height);
    context.fitHeight = fitHeight;
    return context;
  }

  it('should draw box around drawn tiles on the layer', () => {

    // given
    const { layout, mapping } = setup(PageFormat.LANDSCAPE);
    const contexts = [tile(100, 100, 200, 100), grownTextTile(400, 150, 200, 100, 300)];

    // when
    const bounds = selectionBoundsOf(contexts, layout, mapping, SCALE);

    // then
    const top = mapping.layerYOf(100, SCALE);
    expect(bounds.style).toEqual(layout.layerRectStyle({ x: mapping.layerXOf(100), y: top, width: 500, height: mapping.layerYOfBottom(450, SCALE) - top }));
  });

  it('should report bounds of own sizes and growth of drawn bounds', () => {

    // given
    const { layout, mapping } = setup(PageFormat.LANDSCAPE);
    const contexts = [tile(100, 100, 200, 100), grownTextTile(400, 150, 200, 100, 300)];

    // when
    const bounds = selectionBoundsOf(contexts, layout, mapping, SCALE);

    // then
    expect(bounds.rectBounds).toEqual({ x: 100, y: 100, width: 500, height: 150 });
    expect(bounds.growth).toBe(200);
  });

  it('should be resizable within a page', () => {

    // given
    const { layout, mapping } = setup(PageFormat.LANDSCAPE);

    // when
    const bounds = selectionBoundsOf([tile(0, 0, 200, 100), tile(300, 850, 200, 100)], layout, mapping, SCALE);

    // then
    expect(bounds.resizable).toBe(true);
  });

  it('should not be resizable across pages', () => {

    // given
    const { layout, mapping } = setup(PageFormat.LANDSCAPE);

    // when
    const bounds = selectionBoundsOf([tile(0, 0, 200, 100), tile(300, 900, 200, 100)], layout, mapping, SCALE);

    // then
    expect(bounds.resizable).toBe(false);
  });

  it('should not be resizable on free canvas when taller than a page', () => {

    // given
    const { layout, mapping } = setup(PageFormat.UNPAGED);

    // when
    const bounds = selectionBoundsOf([tile(0, 0, 200, 100), tile(300, 900, 200, 100)], layout, mapping, SCALE);

    // then
    expect(bounds.resizable).toBe(false);
  });

  it('should be resizable on free canvas when fitting a page height', () => {

    // given
    const { layout, mapping } = setup(PageFormat.UNPAGED);

    // when
    const bounds = selectionBoundsOf([tile(0, 2000, 200, 100), tile(300, 2800, 200, 100)], layout, mapping, SCALE);

    // then
    expect(bounds.resizable).toBe(true);
  });
});
