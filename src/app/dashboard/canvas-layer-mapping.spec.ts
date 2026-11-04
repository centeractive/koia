import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { CanvasLayerMapping } from './canvas-layer-mapping';
import { FreeLayout } from './free-layout';

describe('CanvasLayerMapping', () => {

  const SCALE = 0.5;
  const GAP = PageFormat.DESK_GUTTER_PX / SCALE;

  let grid: boolean;
  let layer: HTMLElement;
  let layout: FreeLayout;
  let mapping: CanvasLayerMapping;

  beforeEach(() => {
    grid = false;
    layer = { clientWidth: PageFormat.LANDSCAPE.sheetWidth * SCALE } as HTMLElement;
    layout = new FreeLayout(PageFormat.LANDSCAPE);
    mapping = new CanvasLayerMapping(() => grid, layout, () => layer);
  });

  it('should map x and y onto canvas sheets and back', () => {

    // when
    const layer = [mapping.layerXOf(100), mapping.layerYOf(1000, SCALE)];
    const back = [mapping.layoutXOf(layer[0]), mapping.layoutYOf(layer[1], SCALE)];

    // then
    expect(layer).toEqual([layout.layerXOf(100), layout.layerYOf(1000, GAP)]);
    expect(back[0]).toBeCloseTo(100, 10);
    expect(back[1]).toBeCloseTo(1000, 10);
  });

  it('should keep x and y in grid', () => {

    // given
    grid = true;

    // when
    const result = [mapping.layerXOf(100), mapping.layoutXOf(100), mapping.layerYOf(1000, SCALE), mapping.layoutYOf(1000, SCALE)];

    // then
    expect(result).toEqual([100, 100, 1000, 1000]);
  });

  it('should keep x and y on unpaged canvas', () => {

    // given
    layout.pageFormat = PageFormat.UNPAGED;

    // when
    const result = [mapping.layerXOf(100), mapping.layoutXOf(100), mapping.layerYOf(1000, SCALE), mapping.layoutYOf(1000, SCALE)];

    // then
    expect(result).toEqual([100, 100, 1000, 1000]);
  });

  it('should scale canvas by sheet width', () => {

    // when
    const scale = mapping.scale();

    // then
    expect(scale).toBeCloseTo(SCALE, 10);
  });

  it('should scale grid by page width', () => {

    // given
    grid = true;
    layer = { clientWidth: PageFormat.LANDSCAPE.width * SCALE } as HTMLElement;

    // when
    const scale = mapping.scale();

    // then
    expect(scale).toBeCloseTo(SCALE, 10);
  });

  it('should scale by 0 while layer is not rendered', () => {

    // given
    layer = undefined;

    // when
    const scale = mapping.scale();

    // then
    expect(scale).toBe(0);
  });

  it('should map rect onto client rect of layer', () => {

    // given
    const layerRect = { left: 20, top: 30 } as DOMRect;
    const rect = { x: 100, y: 1000, width: 200, height: 100 };

    // when
    const clientRect = mapping.clientRectOf(rect, layerRect, SCALE);

    // then
    const left = 20 + layout.layerXOf(100) * SCALE;
    const top = 30 + layout.layerYOf(1000, GAP) * SCALE;
    expect(clientRect).toEqual({ left, top, right: left + 100, bottom: top + 50 });
  });

  it('should draw top edge snapped to page boundary on lower page', () => {

    // when
    const guide = mapping.layerGuideOf({ axis: 'y', position: 950 }, SCALE, { x: 0, y: 950, width: 100, height: 100 });

    // then
    expect(guide).toEqual({ axis: 'y', position: layout.layerYOf(950, GAP) });
  });

  it('should draw bottom edge on page boundary on upper page', () => {

    // when
    const guide = mapping.layerGuideOf({ axis: 'y', position: 950 }, SCALE, { x: 0, y: 850, width: 100, height: 100 });

    // then
    expect(guide).toEqual({ axis: 'y', position: layout.layerYOf(949, GAP) + 1 });
  });

  it('should draw group bottom guide on other page than dragged tile', () => {

    // given
    const groupBounds = { x: 0, y: 500, width: 100, height: 1000 };

    // when
    const guide = mapping.layerGuideOf({ axis: 'y', position: 1500 }, SCALE, groupBounds);

    // then
    expect(guide).toEqual({ axis: 'y', position: layout.layerYOf(1500, GAP) });
  });

  it('should draw x guide at layer x', () => {

    // when
    const guide = mapping.layerGuideOf({ axis: 'x', position: 300 }, SCALE, { x: 300, y: 0, width: 100, height: 100 });

    // then
    expect(guide).toEqual({ axis: 'x', position: layout.layerXOf(300) });
  });

  it('should draw grid note bottom guide at its position', () => {

    // given
    grid = true;

    // when
    const guide = mapping.layerGuideOf({ axis: 'y', position: 950 }, SCALE, { x: 0, y: 850, width: 100, height: 100 });

    // then
    expect(guide).toEqual({ axis: 'y', position: 950 });
  });

  it('should draw unpaged canvas bottom guide on former page boundary at its position', () => {

    // given
    layout.pageFormat = PageFormat.UNPAGED;

    // when
    const guide = mapping.layerGuideOf({ axis: 'y', position: 950 }, SCALE, { x: 0, y: 850, width: 100, height: 100 });

    // then
    expect(guide).toEqual({ axis: 'y', position: 950 });
  });
});
