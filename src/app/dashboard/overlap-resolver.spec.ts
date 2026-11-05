import { ElementContext, SummaryContext, TextBoxContext } from 'app/shared/model';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { FreeLayout } from './free-layout';
import { OverlapResolver } from './overlap-resolver';

describe('OverlapResolver', () => {

  const landscape = new OverlapResolver(new FreeLayout(PageFormat.LANDSCAPE));
  const unpaged = new OverlapResolver(new FreeLayout(PageFormat.UNPAGED));

  function tile(x: number, y: number, width: number, height: number): ElementContext {
    const context = new SummaryContext([]);
    context.setPosition(x, y);
    context.setSize(width, height);
    return context;
  }

  function note(x: number, y: number): TextBoxContext {
    const context = new TextBoxContext([]);
    context.setPosition(x, y);
    context.setSize(200, 100);
    return context;
  }

  function positionsOf(contexts: ElementContext[]): number[][] {
    return contexts.map(c => [c.x, c.y]);
  }

  it('should push covered tile below fixed tile', () => {

    // given
    const fixed = tile(0, 10, 600, 400);
    const covered = tile(300, 200, 600, 300);

    // when
    landscape.pushDown([fixed, covered], [fixed]);

    // then
    expect(positionsOf([fixed, covered])).toEqual([[0, 10], [300, 420]]);
  });

  it('#pushedRectsOf should return the rects of the tiles pushed by fixed rects other than drawn, notes ignored', () => {

    // given
    const moved = tile(0, 600, 600, 400);
    const covered = tile(300, 200, 600, 300);
    const aside = tile(1000, 10, 300, 200);
    const covering = note(300, 100);

    // when
    const pushed = landscape.pushedRectsOf([moved, covered, aside, covering], new Map([[moved, { x: 0, y: 10, width: 600, height: 400 }]]));

    // then
    expect([...pushed.entries()]).toEqual([[covered, { x: 300, y: 420, width: 600, height: 300 }]]);
    expect(positionsOf([moved, covered])).toEqual([[0, 600], [300, 200]]);
  });

  it('should move tile above covered by top edge of resized tile below it', () => {

    // given
    const above = tile(0, 10, 600, 300);
    const resized = tile(0, 200, 600, 300);

    // when
    landscape.pushDown([above, resized], [resized]);

    // then
    expect(positionsOf([above])).toEqual([[0, 510]]);
  });

  it('should cascade pushed tile onto tiles below', () => {

    // given
    const fixed = tile(0, 10, 600, 400);
    const covered = tile(0, 300, 600, 200);
    const below = tile(0, 510, 600, 200);

    // when
    landscape.pushDown([fixed, covered, below], [fixed]);

    // then
    expect(positionsOf([covered, below])).toEqual([[0, 420], [0, 630]]);
  });

  it('should leave freed space without pulling tiles up', () => {

    // given
    const fixed = tile(0, 10, 300, 100);
    const below = tile(0, 600, 300, 100);

    // when
    landscape.pushDown([fixed, below], [fixed]);

    // then
    expect(positionsOf([below])).toEqual([[0, 600]]);
  });

  it('should neither push notes nor be pushed by them', () => {

    // given
    const fixed = tile(0, 10, 600, 400);
    const covering = note(100, 100);
    const tileBelowNote = tile(700, 150, 300, 200);
    const fixedNote = note(700, 160);

    // when
    landscape.pushDown([fixed, covering, tileBelowNote, fixedNote], [fixed, fixedNote]);

    // then
    expect(positionsOf([covering, tileBelowNote])).toEqual([[100, 100], [700, 150]]);
  });

  it('should push tile crossing page break to next page below top padding', () => {

    // given
    const fixed = tile(0, 10, 600, 700);
    const covered = tile(0, 500, 600, 300);

    // when
    landscape.pushDown([fixed, covered], [fixed]);

    // then
    expect(positionsOf([covered])).toEqual([[0, 950 + PageFormat.TOP_PADDING]]);
  });

  it('should place tile of page height at top of next page', () => {

    // given
    const fixed = tile(0, 10, 600, 400);
    const covered = tile(0, 300, 600, 950);

    // when
    landscape.pushDown([fixed, covered], [fixed]);

    // then
    expect(positionsOf([covered])).toEqual([[0, 950]]);
  });

  it('should place drawn tile taller than a page at top of next page', () => {

    // given
    const fixed = tile(0, 10, 600, 400);
    const textTile = new TextBoxContext([], true);
    textTile.setPosition(0, 300);
    textTile.setSize(600, 300);
    textTile.fitHeight = 1200;

    // when
    landscape.pushDown([fixed, textTile], [fixed]);

    // then
    expect(positionsOf([textTile])).toEqual([[0, 950]]);
  });

  it('should push without page breaks when unpaged', () => {

    // given
    const fixed = tile(0, 10, 600, 700);
    const covered = tile(0, 500, 600, 300);

    // when
    unpaged.pushDown([fixed, covered], [fixed]);

    // then
    expect(positionsOf([covered])).toEqual([[0, 720]]);
  });

  it('should resolve all overlaps without fixed tiles', () => {

    // given
    const top = tile(0, 10, 600, 400);
    const middle = tile(100, 100, 600, 400);
    const bottom = tile(200, 200, 600, 100);

    // when
    landscape.pushDown([bottom, middle, top], []);

    // then
    expect(positionsOf([top, middle, bottom])).toEqual([[0, 10], [100, 420], [200, 830]]);
  });

  it('should return moved tiles only', () => {

    // given
    const fixed = tile(0, 10, 600, 400);
    const covered = tile(0, 100, 600, 200);
    const aside = tile(700, 100, 600, 200);

    // when
    const moved = landscape.pushDown([fixed, covered, aside], [fixed]);

    // then
    expect(moved).toEqual([covered]);
  });

  it('#pushedDown should push rects below fixed ones and keep their indexes', () => {

    // given
    const rects = [{ x: 0, y: 100, width: 600, height: 200 }, { x: 0, y: 10, width: 600, height: 400 }, { x: 700, y: 100, width: 600, height: 200 }];

    // when
    const pushed = landscape.pushedDown(rects, [false, true, false]);

    // then
    expect(pushed).toEqual([{ x: 0, y: 420, width: 600, height: 200 }, rects[1], rects[2]]);
  });
});
