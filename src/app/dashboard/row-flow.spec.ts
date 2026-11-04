import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { FreeLayout, Rect } from './free-layout';
import { FlowLimit, RowFlow } from './row-flow';

describe('RowFlow', () => {

  const rowFlow = new RowFlow(new FreeLayout(PageFormat.LANDSCAPE));

  function rect(x: number, y: number, width = 300, height = 200): Rect {
    return { x, y, width, height };
  }

  function limitsOf(rects: Rect[]): Map<Rect, FlowLimit> {
    return new Map(rects.map(r => [r, { right: 1400, gap: 10 }]));
  }

  it('#rowOf should return the tiles of equal tops by x', () => {

    // given
    const [a, b, c] = [rect(310, 10), rect(0, 10), rect(0, 220)];

    // when
    const row = rowFlow.rowOf([a, b, c], a);

    // then
    expect(row).toEqual([b, a]);
  });

  it('#rowOf should take tiles whose top lies less than half the smaller height below the first top', () => {

    // given
    const [a, b, c] = [rect(0, 0), rect(310, 90), rect(620, 180)];

    // when
    const first = rowFlow.rowOf([a, b, c], b);
    const second = rowFlow.rowOf([a, b, c], c);

    // then
    expect(first).toEqual([a, b]);
    expect(second).toEqual([c]);
  });

  it('#rowOf should measure the distance of tops by the smallest height of the row', () => {

    // given
    const [tall, short, near, far] = [rect(0, 0, 400, 600), rect(410, 0, 200, 100), rect(620, 40, 200, 100), rect(830, 60, 200, 100)];

    // when
    const row = rowFlow.rowOf([tall, short, near, far], tall);

    // then
    expect(row).toEqual([tall, short, near]);
  });

  it('#blockersOf should return the tiles of rows above reaching into the row', () => {

    // given
    const [tall, short, below] = [rect(0, 10, 400, 410), rect(410, 10), rect(410, 220)];

    // when
    const blockers = rowFlow.blockersOf([tall, short, below], 220);

    // then
    expect(blockers).toEqual([tall]);
  });

  it('#blockersOf should leave out the excluded tiles', () => {

    // given
    const tall = rect(0, 10, 400, 410);

    // when
    const blockers = rowFlow.blockersOf([tall], 220, [tall]);

    // then
    expect(blockers).toEqual([]);
  });

  it('#limitsOf should keep the right edge a tile reached past the page edge', () => {

    // given
    const before = [rect(0, 0, 466), rect(942, 0, 459)];
    const copies = before.map(r => ({ ...r }));

    // when
    const limits = rowFlow.limitsOf(before, copies, rect(0, 500));

    // then
    expect(copies.map(c => limits.get(c).right)).toEqual([1400, 1401]);
  });

  it('#limitsOf should keep the gap to the left neighbour, the moved tile among them, no wider than the gap of the canvas', () => {

    // given
    const before = [rect(0, 0, 466), rect(941, 0, 459), rect(1100, 300, 200)];
    const copies = before.map(r => ({ ...r }));

    // when
    const limits = rowFlow.limitsOf(before, copies, rect(475, 0, 457));

    // then
    expect(copies.map(c => limits.get(c).gap)).toEqual([10, 9, 10]);
  });

  it('#gapOf should take no gap for a tile abutting or covering its left neighbour', () => {

    // given
    const [left, abutting, covering] = [rect(0, 0), rect(300, 0), rect(550, 0)];

    // when
    const gaps = [abutting, covering].map(r => rowFlow.gapOf([left, abutting, covering], r));

    // then
    expect(gaps).toEqual([0, 0]);
  });

  it('#pass should keep a tile reaching past the page edge it is not pushed beyond', () => {

    // given
    const sequence = [rect(0, 0, 466), rect(942, 0, 459)];

    // when
    const wrapped = rowFlow.pass(sequence, 1, rowFlow.limitsOf(sequence, sequence, rect(0, 500)), []);

    // then
    expect(wrapped).toEqual([]);
    expect(sequence[1].x).toBe(942);
  });

  it('#pass should keep the gap a tile had to its predecessor', () => {

    // given
    const sequence = [rect(0, 0), rect(300, 0)];
    const limits = new Map(sequence.map(r => [r, { right: 1400, gap: 0 }]));

    // when
    rowFlow.pass(sequence, 1, limits, []);

    // then
    expect(sequence[1].x).toBe(300);
  });

  it('#pass should move tiles beside the blockers', () => {

    // given
    const sequence = [rect(0, 220), rect(310, 220)];
    const limits = limitsOf(sequence);

    // when
    const wrapped = rowFlow.pass(sequence, 0, limits, [rect(0, 10, 400, 410), rect(720, 10, 100, 410)]);

    // then
    expect(wrapped).toEqual([]);
    expect(sequence.map(r => r.x)).toEqual([410, 830]);
  });

  it('#pass should wrap the first tile when a blocker spans the page width', () => {

    // given
    const sequence = [rect(0, 220)];

    // when
    const wrapped = rowFlow.pass(sequence, 0, limitsOf(sequence), [rect(0, 10, 1400, 410)]);

    // then
    expect(wrapped).toEqual(sequence);
  });
});
