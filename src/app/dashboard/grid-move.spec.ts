import { GridMove } from './grid-move';
import { GridSpan } from './grid-placement';

describe('GridMove', () => {

  const SMALL = { columns: 1, rows: 1 };
  const WIDE = { columns: 2, rows: 1 };
  const LARGE = { columns: 2, rows: 2 };

  function moveOf(dragged: string, tiles: string[], spans: GridSpan[], gridColumns = 3): GridMove<string> {
    return new GridMove(dragged, tiles, spans, gridColumns);
  }

  it('should keep the original index when aimed at the own cell', () => {

    // given
    const move = moveOf('B', ['A', 'B', 'C', 'D'], [SMALL, SMALL, SMALL, SMALL]);

    // when
    const changed = move.moveTo({ column: 1.2, row: -0.3 });

    // then
    expect(changed).toBe(false);
    expect(move.targetIndex()).toBe(1);
  });

  it('should place the tile before the neighbour whose cell it is aimed at', () => {

    // given
    const move = moveOf('B', ['A', 'B', 'C', 'D'], [SMALL, SMALL, SMALL, SMALL]);

    // when
    const changed = move.moveTo({ column: 0.1, row: 0 });

    // then
    expect(changed).toBe(true);
    expect(move.targetIndex()).toBe(0);
    expect(move.successor()).toBe('A');
  });

  it('should place the tile last when aimed at an empty cell behind the last tile on the next row', () => {

    // given
    const move = moveOf('A', ['A', 'B', 'C', 'D'], [SMALL, SMALL, SMALL, SMALL]);

    // when
    move.moveTo({ column: 1, row: 1 });

    // then
    expect(move.targetIndex()).toBe(3);
    expect(move.successor()).toBeUndefined();
  });

  it('should move a tile left along a row beside a large tile without alternating', () => {

    // given
    const tiles = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const move = moveOf('E', tiles, [SMALL, LARGE, SMALL, SMALL, SMALL, SMALL, SMALL, SMALL], 4);
    const targets: number[] = [];

    // when
    for (let column = 3; column >= 0; column -= 0.05) {
      move.moveTo({ column, row: 1 });
      targets.push(move.targetIndex());
    }

    // then
    expect(targets.filter((t, i) => i === 0 || t !== targets[i - 1])).toEqual([4, 3]);
  });

  it('should prefer the order leaving no hole when a wide tile reaches the same cell in two orders', () => {

    // given
    const move = moveOf('D', ['X', 'D', 'Y'], [WIDE, WIDE, SMALL]);

    // when
    move.moveTo({ column: 0, row: 1 });

    // then
    expect(move.targetIndex()).toBe(2);
  });

  it.each([
    { tiles: ['X', 'D', 'Y', 'Z'], spans: [WIDE, WIDE, SMALL, WIDE], index: 1 },
    { tiles: ['X', 'Y', 'D', 'Z'], spans: [WIDE, SMALL, WIDE, WIDE], index: 2 }
  ])('should keep the original index $index among orders equally near and leaving as many holes', ({ tiles, spans, index }) => {

    // given
    const move = moveOf('D', tiles, spans);

    // when
    const changed = move.moveTo({ column: 0, row: 1 });

    // then
    expect(changed).toBe(false);
    expect(move.targetIndex()).toBe(index);
  });

  it('should place the tile in the row aimed at before looking at the column', () => {

    // given
    const move = moveOf('D', ['A', 'B', 'C', 'D'], [LARGE, SMALL, SMALL, SMALL]);

    // when
    move.moveTo({ column: 0, row: 1 });

    // then
    expect(move.targetIndex()).toBe(2);
    expect(move.successor()).toBe('C');
  });

  it.each([
    { dragged: 'C', last: 'B' },
    { dragged: 'A', last: 'C' }
  ])('#lastOther should return $last when $dragged is dragged', ({ dragged, last }) => {

    // when
    const move = moveOf(dragged, ['A', 'B', 'C'], [SMALL, SMALL, SMALL]);

    // then
    expect(move.lastOther()).toBe(last);
  });

  it('should keep a single tile in place', () => {

    // given
    const move = moveOf('A', ['A'], [SMALL]);

    // when
    const changed = move.moveTo({ column: 2, row: 3 });

    // then
    expect(changed).toBe(false);
    expect(move.targetIndex()).toBe(0);
    expect(move.successor()).toBeUndefined();
  });
});
