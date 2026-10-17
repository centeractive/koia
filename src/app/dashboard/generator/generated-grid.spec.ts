import { SequenceRandomSource } from 'app/shared/test';
import { GridLayout } from '../grid-layout';
import { GENERATED_CELL_RATIO, GENERATED_GRID_COLUMNS, GridChooser, GridDef, rowsOf, TARGET_CELLS } from './generated-grid';
import { Randomizer } from './randomizer';

describe('generated-grid', () => {

  function chooserOf(value: number): GridChooser {
    return new GridChooser(new Randomizer(new SequenceRandomSource([value])));
  }

  it('GENERATED_GRID_COLUMNS and GENERATED_CELL_RATIO should be among grid layout choices', () => {
    expect(GENERATED_GRID_COLUMNS.every(c => GridLayout.COLUMN_CHOICES.includes(c))).toBe(true);
    expect(GridLayout.CELL_RATIO_CHOICES).toContain(GENERATED_CELL_RATIO);
  });

  it('#rowsOf should cover target cells', () => {

    // when
    const rows = GENERATED_GRID_COLUMNS.map(c => rowsOf(c));

    // then
    expect(rows).toEqual([4, 3, 3]);
    GENERATED_GRID_COLUMNS.forEach((c, i) => {
      expect(c * rows[i]).toBeGreaterThanOrEqual(TARGET_CELLS);
      expect(c * (rows[i] - 1)).toBeLessThan(TARGET_CELLS);
    });
  });

  it('#next should choose square cells and grid columns other than current', () => {
    for (const columns of GENERATED_GRID_COLUMNS) {
      for (const value of [0, 0.5, 0.99]) {

        // given
        const current: GridDef = { columns, cellRatio: '2:1' };

        // when
        const grid = chooserOf(value).next(current);

        // then
        expect(grid.columns).not.toBe(columns);
        expect(GENERATED_GRID_COLUMNS).toContain(grid.columns);
        expect(grid.cellRatio).toBe('1:1');
      }
    }
  });

  it('#next should offer every generated column count other than current', () => {

    // given
    const current: GridDef = { columns: 4, cellRatio: '1:1' };

    // when
    const columns = [0, 0.6].map(v => chooserOf(v).next(current).columns);

    // then
    expect(columns).toEqual([3, 5]);
  });

  it('#next should offer all generated column counts when current count is not generated', () => {
    for (const currentColumns of [1, 2]) {

      // given
      const current: GridDef = { columns: currentColumns, cellRatio: '3:2' };

      // when
      const columns = [0, 0.4, 0.8].map(v => chooserOf(v).next(current).columns);

      // then
      expect(columns).toEqual([3, 4, 5]);
    }
  });
});
