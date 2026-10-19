import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { FreeLayout } from './free-layout';
import { PageFormat } from './page-format';
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

  it('should pack side by side tiles too wide for portrait page in rows in reading order', () => {

    // given
    const elements = [element(610, 0, 600, 400), element(0, 0, 600, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 410, 600, 400], [0, 0, 600, 400]]);
  });

  it('should keep arrangement fitting portrait page width', () => {

    // given
    const elements = [element(100, 50, 400, 300), element(510, 200, 400, 300)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[100, 50, 400, 300], [510, 200, 400, 300]]);
  });

  it('should cap tile width at portrait page width', () => {

    // given
    const elements = [element(0, 0, 1400, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 950, 400]]);
  });

  it('should start tiles of each former page on a new page', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 960, 600, 400)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 600, 400], [0, 1410, 600, 400]]);
  });

  it('should push packed tiles overflowing portrait page to next page', () => {

    // given
    const elements = [element(0, 0, 700, 600), element(710, 0, 690, 600), element(0, 610, 700, 300)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 700, 600], [0, 610, 690, 600], [0, 1400, 700, 300]]);
  });

  it('should cap tile height at landscape page height', () => {

    // given
    const elements = [element(0, 0, 600, 1300)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 600, 950]]);
  });

  it('should push row crossing landscape page boundary below fitted row to next page', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 800, 600, 400)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 600, 400], [0, 950, 600, 400]]);
  });

  it('should pull lone row crossing landscape page boundary to its page top', () => {

    // given
    const elements = [element(0, 800, 600, 300)];

    // when
    reflow(portrait, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 600, 300]]);
  });

  it('should fit all tiles of unpaged canvas onto pages as one group', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(0, 800, 600, 400), element(0, 2000, 600, 400)];

    // when
    reflow(unpaged, landscape, elements);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 600, 400], [0, 950, 600, 400], [0, 2150, 600, 400]]);
  });

  it('should keep offset of note to tile below its top left corner', () => {

    // given
    const elements = [element(610, 0, 600, 400), element(0, 0, 600, 400), element(910, 100, 200, 100)];

    // when
    reflow(landscape, portrait, elements, [...tiles(2), note()]);

    // then
    expect(rectsOf(elements)[2]).toEqual([300, 510, 200, 100]);
  });

  it('should anchor note to topmost of overlapping tiles', () => {

    // given
    const elements = [element(0, 0, 600, 400, 2), element(610, 0, 600, 400, 1), element(300, 300, 600, 300, 3),
      element(400, 350, 100, 100, 4)];

    // when
    reflow(landscape, portrait, elements, [...tiles(3), note()]);

    // then
    expect(rectsOf(elements)[2]).toEqual([0, 820, 600, 300]);
    expect(rectsOf(elements)[3]).toEqual([100, 870, 100, 100]);
  });

  it('should keep offset of note without tile below to its page top', () => {

    // given
    const elements = [element(0, 950, 600, 400), element(1000, 1500, 300, 150)];

    // when
    reflow(landscape, portrait, elements, [...tiles(1), note()]);

    // then
    expect(rectsOf(elements)[1]).toEqual([650, 550, 300, 150]);
  });

  it('should keep note without tile below on its own page below first page of group', () => {

    // given
    const elements = [element(0, 0, 600, 400), element(100, 2000, 300, 150)];

    // when
    reflow(unpaged, landscape, elements, [...tiles(1), note()]);

    // then
    expect(rectsOf(elements)[1]).toEqual([100, 2000, 300, 150]);
  });

  it('should start page of notes only on a new page', () => {

    // given
    const elements = [element(100, 1000, 300, 150), element(0, 2000, 600, 400)];

    // when
    reflow(landscape, portrait, elements, [note(), ...tiles(1)]);

    // then
    expect(rectsOf(elements)).toEqual([[100, 50, 300, 150], [0, 1500, 600, 400]]);
  });

  it('should keep unpositioned elements', () => {

    // given
    const unpositioned = { width: 600, height: 400 } as ViewElement;

    // when
    reflow(landscape, portrait, [unpositioned]);

    // then
    expect(unpositioned).toEqual({ width: 600, height: 400 });
  });

  it('should pack text tile by grown height and keep its own height', () => {

    // given
    const textTile = new TextBoxContext([], true);
    textTile.fitHeight = 600;
    const elements = [element(0, 0, 600, 200), element(610, 0, 600, 400)];

    // when
    reflow(landscape, portrait, elements, [textTile, ...tiles(1)]);

    // then
    expect(rectsOf(elements)).toEqual([[0, 0, 600, 200], [0, 610, 600, 400]]);
  });

  it('should keep z-order', () => {

    // given
    const elements = [element(610, 0, 600, 400, 1), element(0, 0, 600, 400, 2)];

    // when
    reflow(landscape, portrait, elements);

    // then
    expect(elements.map(e => e.z)).toEqual([1, 2]);
  });
});
