import { occupiedCells } from './grid-placement-simulator';

describe('grid placement simulator', () => {

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
});
