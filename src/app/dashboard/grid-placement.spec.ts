import { occupiedCells, placedCells } from './grid-placement';

describe('grid placement', () => {

  const SMALL = { columns: 1, rows: 1 };
  const WIDE = { columns: 2, rows: 1 };

  it('#occupiedCells should place tiles row by row in order', () => {

    // when
    const cells = occupiedCells(3, [WIDE, SMALL, SMALL, SMALL, SMALL]);

    // then
    expect(cells).toEqual([[true, true, true], [true, true, true]]);
  });

  it('#occupiedCells should leave hole when wide tile does not fit remaining columns', () => {

    // when
    const cells = occupiedCells(3, [SMALL, SMALL, WIDE]);

    // then
    expect(cells).toEqual([[true, true, false], [true, true, false]]);
  });

  it('#occupiedCells should place full row tile on new row', () => {

    // when
    const cells = occupiedCells(3, [SMALL, { columns: 3, rows: 1 }]);

    // then
    expect(cells).toEqual([[true, false, false], [true, true, true]]);
  });

  it('#placedCells should place tiles row by row in order', () => {

    // when
    const cells = placedCells(3, [SMALL, SMALL, SMALL, SMALL]);

    // then
    expect(cells).toEqual([{ column: 0, row: 0 }, { column: 1, row: 0 }, { column: 2, row: 0 }, { column: 0, row: 1 }]);
  });

  it('#placedCells should place small tile after wide tile wrapped to next row, leaving the hole', () => {

    // when
    const cells = placedCells(3, [SMALL, SMALL, WIDE, SMALL]);

    // then
    expect(cells).toEqual([{ column: 0, row: 0 }, { column: 1, row: 0 }, { column: 0, row: 1 }, { column: 2, row: 1 }]);
  });

  it('#placedCells should keep cells of tile spanning two rows for the tiles below', () => {

    // when
    const cells = placedCells(3, [{ columns: 2, rows: 2 }, SMALL, SMALL, SMALL]);

    // then
    expect(cells).toEqual([{ column: 0, row: 0 }, { column: 2, row: 0 }, { column: 2, row: 1 }, { column: 0, row: 2 }]);
  });

  it('#placedCells should narrow tile wider than the grid to the grid columns', () => {

    // when
    const cells = placedCells(2, [SMALL, { columns: 3, rows: 1 }]);

    // then
    expect(cells).toEqual([{ column: 0, row: 0 }, { column: 0, row: 1 }]);
  });

  it('#occupiedCells should narrow tile wider than the grid to the grid columns', () => {

    // when
    const cells = occupiedCells(2, [{ columns: 3, rows: 1 }]);

    // then
    expect(cells).toEqual([[true, true]]);
  });
});
