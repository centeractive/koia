import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { FreeLayout } from './free-layout';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { PageReflow } from './page-reflow';

describe('PageReflow', () => {

  const landscape = new FreeLayout(PageFormat.LANDSCAPE);
  const portrait = new FreeLayout(PageFormat.PORTRAIT);
  const unpaged = new FreeLayout(PageFormat.UNPAGED);

  function element(x: number, y: number, width: number, height: number, z?: number): ViewElement {
    return { x, y, width, height, z } as ViewElement;
  }

  function rectsOf(elements: ViewElement[]): number[][] {
    return elements.map(e => [e.x, e.y, e.width, e.height]);
  }

  function tiles(count: number): ElementContext[] {
    return Array.from({ length: count }, () => new SummaryContext([]));
  }

  function note(): TextBoxContext {
    return new TextBoxContext([]);
  }

  function reflow(source: FreeLayout, target: FreeLayout, elements: ViewElement[], contexts = tiles(elements.length)): void {
    new PageReflow(source, target).reflow(elements, contexts);
  }

  it('should scale side by side tiles to portrait page width and keep them side by side', () => {

    // given
    const elements = [element(610, 0, 600, 400), element(0, 0, 600, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[415, 10, 406, 400], [0, 10, 405, 400]]);
  });

  it('should keep scaled arrangement and offsets within page', () => {

    // given
    const elements = [element(100, 50, 400, 300), element(510, 200, 400, 300)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[68, 50, 269, 300], [347, 200, 269, 300]]);
  });

  it('should scale full width tile to portrait page width', () => {

    // given
    const elements = [element(0, 0, 1400, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 950, 400]]);
  });

  it('should keep min width of tile scaled below it even when overlapping its neighbour', () => {

    // given
    const elements = [element(0, 0, 100, 400), element(110, 0, 100, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 100, 400], [75, 10, 100, 400]]);
  });

  it('should flow tiles of later former page onto previous page with room', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 960, 600, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 405, 400], [0, 420, 405, 400]]);
  });

  it('should move flowed row crossing portrait page boundary to next page', () => {

    // given
    const elements = [element(0, 0, 600, 900), element(0, 960, 600, 600)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 405, 900], [0, 1410, 405, 600]]);
  });

  it('should cap tile height at landscape page height less top padding', () => {

    // given
    const elements = [element(0, 0, 600, 1300)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 886, 940]]);
  });

  it('should push row crossing landscape page boundary below fitted row to next page', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 800, 600, 400)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 886, 400], [0, 960, 886, 400]]);
  });

  it('should pull lone row crossing landscape page boundary to top padding of its page', () => {

    // given
    const elements = [element(0, 800, 600, 300)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 886, 300]]);
  });

  it('should remove leading empty page of portrait tile placed below landscape page height', () => {

    // given
    const elements = [element(0, 1000, 600, 300)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 50, 886, 300]]);
  });

  it('should fit all tiles of unpaged canvas onto pages as one group', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 800, 600, 400), element(0, 2000, 600, 400)];

    // when
    reflow(unpaged, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 600, 400], [0, 960, 600, 400], [0, 2160, 600, 400]]);
  });

  it('should remove empty page left by gap of unpaged canvas', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 2000, 600, 400)];

    // when
    reflow(unpaged, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 600, 400], [0, 1060, 600, 400]]);
  });

  it('should keep offset of note to tile below its top left corner', () => {

    // given
    const elements = [element(610, 0, 600, 400), element(0, 0, 600, 400), element(910, 100, 200, 100)];

    // when
    reflow(landscape, portrait, elements, [...tiles(2), note()]);

    // then
    expect(rectsOf(elements)[2]).toEqual([618, 110, 133, 100]);
  });

  it('should anchor note to topmost of overlapping tiles', () => {

    // given
    const elements = [element(0, 0, 600, 400, 2), element(610, 0, 600, 400, 1), element(300, 300, 600, 300, 3),
      element(400, 350, 100, 100, 4)];

    // when
    reflow(landscape, portrait, elements, [...tiles(3), note()]);

    // then
    expect(rectsOf(elements)[2]).toEqual([204, 310, 406, 300]);
    expect(rectsOf(elements)[3]).toEqual([272, 360, 65, 100]);
  });

  it('should keep offset of note without tile below to its page top', () => {

    // given
    const elements = [element(0, 950, 600, 400), element(1000, 1500, 300, 150)];

    // when
    reflow(landscape, portrait, elements, [...tiles(1), note()]);

    // then
    expect(rectsOf(elements)[1]).toEqual([681, 550, 201, 150]);
  });

  it('should remove empty page above note without tile below', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(100, 2000, 300, 150)];

    // when
    reflow(unpaged, landscape, elements, [...tiles(1), note()]);

    // then
    expect(rectsOf(elements)[1]).toEqual([100, 1050, 300, 150]);
  });

  it('should flow tiles of later former page below page of notes only', () => {

    // given
    const elements = [element(100, 1000, 300, 150), element(0, 2000, 600, 400)];

    // when
    reflow(landscape, portrait, elements, [note(), ...tiles(1)]);

    // then
    expect(rectsOf(elements)).toEqual([[68, 50, 201, 150], [0, 210, 405, 400]]);
  });

  it('should keep unpositioned elements', () => {

    // given
    const unpositioned = { width: 600, height: 400 } as ViewElement;

    // when
    reflow(landscape, portrait, [unpositioned]);

    // then
    expect(unpositioned).toEqual({ width: 600, height: 400 });
  });

  it('should flow next former page below grown height of text tile and keep its own height', () => {

    // given
    const textTile = new TextBoxContext([], true);
    textTile.fitHeight = 600;
    const elements = [element(0, 0, 600, 200), element(0, 1400, 600, 200)];

    // when
    reflow(portrait, landscape, elements, [textTile, ...tiles(1)]);

    // then
    expect(rectsOf(elements)).toEqual([[0, 10, 886, 200], [0, 620, 886, 200]]);
  });

  it('should keep z-order', () => {

    // given
    const elements = [element(610, 0, 600, 400, 1), element(0, 0, 600, 400, 2)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(elements.map(e => e.z)).toEqual([1, 2]);
  });

  it('should only scale horizontally onto free canvas', () => {

    // given
    const elements = [element(100, 1500, 400, 300)];

    // when
    reflow(portrait, unpaged, elements);

    // then
    expect(rectsOf(elements)).toEqual([[147, 1500, 592, 300]]);
  });

  it('should keep elements onto free canvas of same width', () => {

    // given
    const elements = [element(100, 960, 700, 400)];

    // when
    reflow(landscape, unpaged, elements);

    // then
    expect(rectsOf(elements)).toEqual([[100, 960, 700, 400]]);
  });
});
