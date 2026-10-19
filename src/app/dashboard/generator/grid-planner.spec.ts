import { occupiedCells, SequenceRandomSource } from 'app/shared/test';
import { rowsOf } from './generated-grid';
import { GridPlanner } from './grid-planner';
import { Randomizer } from './randomizer';
import { TileSize } from './tile-spec';

describe('GridPlanner', () => {

  const SEQUENCES = [[0], [0.99], [0.1, 0.7, 0.4], [0.5, 0.2, 0.9, 0.3]];

  function plannerOf(values: number[]): GridPlanner {
    return new GridPlanner(new Randomizer(new SequenceRandomSource(values)));
  }

  function cellsOf(gridColumns: number, sizes: TileSize[]): boolean[][] {
    return occupiedCells(gridColumns, GridPlanner.columnSpansOf(sizes, gridColumns).map(columns => ({ columns, rows: 1 })));
  }

  function unwidenedWidthOf(sizes: TileSize[]): number {
    return sizes.reduce((sum, s) => sum + (s === TileSize.WIDE ? 2 : 1), 0);
  }

  function wideCountsPerRow(gridColumns: number, sizes: TileSize[]): number[] {
    const counts: number[] = [];
    let width = 0;
    for (const size of sizes) {
      if (width % gridColumns === 0) {
        counts.push(0);
      }
      if (size === TileSize.WIDE) {
        counts[counts.length - 1]++;
      }
      width += unwidenedWidthOf([size]);
    }
    return counts;
  }

  function count(sizes: TileSize[], size: TileSize): number {
    return sizes.filter(s => s === size).length;
  }

  it('#plan should fill all rows without holes', () => {
    for (const gridColumns of [3, 4, 5]) {
      for (const hasFeature of [false, true]) {
        for (const values of SEQUENCES) {

          // given
          const rows = rowsOf(gridColumns);

          // when
          const sizes = plannerOf(values).plan(gridColumns, rows, hasFeature, 10, 20);

          // then
          const cells = cellsOf(gridColumns, sizes);
          expect(cells.length).toBe(rows);
          expect(cells.flat().every(c => c)).toBe(true);
        }
      }
    }
  });

  it('#plan should place feature first', () => {

    // when
    const sizes = plannerOf([0.3]).plan(4, 3, true, 3, 10);

    // then
    expect(sizes[0]).toBe(TileSize.FEATURE);
    expect(count(sizes, TileSize.FEATURE)).toBe(1);
  });

  it('#plan should place at least one wide tile when available', () => {
    for (const values of SEQUENCES) {

      // when
      const sizes = plannerOf(values).plan(3, 3, false, 1, 20);

      // then
      expect(count(sizes, TileSize.WIDE)).toBe(1);
    }
  });

  it('#plan should reduce rows when stock does not suffice', () => {

    // when
    const sizes = plannerOf([0.5]).plan(4, 3, false, 0, 9);

    // then
    expect(sizes).toEqual(new Array(8).fill(TileSize.SMALL));
    const cells = cellsOf(4, sizes);
    expect(cells.length).toBe(2);
    expect(cells.flat().every(c => c)).toBe(true);
  });

  it('#plan should plan feature and a row of all tiles when no row can be filled', () => {

    // when
    const sizes = plannerOf([0.5]).plan(5, 3, true, 1, 2);

    // then
    expect(sizes).toEqual([TileSize.FEATURE, TileSize.WIDE, TileSize.SMALL, TileSize.SMALL]);
    const cells = cellsOf(5, sizes);
    expect(cells.length).toBe(2);
    expect(cells.flat().every(c => c)).toBe(true);
  });

  it('#plan should plan feature only without stock', () => {

    // when
    const sizes = plannerOf([0.5]).plan(5, 3, true, 0, 0);

    // then
    expect(sizes).toEqual([TileSize.FEATURE]);
  });

  it('#plan should plan feature only when feature fills all rows', () => {

    // when
    const sizes = plannerOf([0.5]).plan(3, 1, true, 2, 3);

    // then
    expect(sizes).toEqual([TileSize.FEATURE]);
  });

  it('#plan should plan nothing without stock', () => {

    // when
    const sizes = plannerOf([0.5]).plan(4, 3, false, 0, 0);

    // then
    expect(sizes).toEqual([]);
  });

  it('#plan should fill rows without holes for any stock', () => {
    for (const gridColumns of [3, 4, 5]) {
      for (let rows = 1; rows <= 4; rows++) {
        for (let wideStock = 0; wideStock <= 5; wideStock++) {
          for (let smallStock = 0; smallStock <= 8; smallStock++) {
            for (const hasFeature of [false, true]) {
              for (const values of SEQUENCES) {

                // when
                const sizes = plannerOf(values).plan(gridColumns, rows, hasFeature, wideStock, smallStock);

                // then
                expect(cellsOf(gridColumns, sizes).flat().every(c => c)).toBe(true);
                expect(sizes.length > 0).toBe(hasFeature || wideStock + smallStock > 0);
              }
            }
          }
        }
      }
    }
  });

  it('#plan should count unused wide tiles toward small slots', () => {

    // when
    const sizes = plannerOf([0.5]).plan(3, 2, false, 4, 0);

    // then
    expect(count(sizes, TileSize.WIDE)).toBe(2);
    expect(count(sizes, TileSize.SMALL)).toBe(2);
    expect(cellsOf(3, sizes).flat().every(c => c)).toBe(true);
  });

  it('#plan should pick wide tile count and its distribution over rows by random source', () => {

    // when
    const counts = [[0.3, 0.9, 0.9], [0.3, 0, 0.9], [0.8]]
      .map(values => wideCountsPerRow(4, plannerOf(values).plan(4, 2, false, 4, 8)));

    // then
    expect(counts).toEqual([[0, 2], [1, 1], [2, 2]]);
  });

  it('#plan should not use more tiles than in stock', () => {
    for (const gridColumns of [3, 4, 5]) {
      for (let rows = 1; rows <= 4; rows++) {
        for (let wideStock = 0; wideStock <= 5; wideStock++) {
          for (let smallStock = 0; smallStock <= 8; smallStock++) {
            for (const values of SEQUENCES) {

              // when
              const sizes = plannerOf(values).plan(gridColumns, rows, false, wideStock, smallStock);

              // then
              const wideCount = count(sizes, TileSize.WIDE);
              expect(wideCount).toBeLessThanOrEqual(wideStock);
              expect(count(sizes, TileSize.SMALL)).toBeLessThanOrEqual(smallStock + wideStock - wideCount);
            }
          }
        }
      }
    }
  });

  it('#plan should keep a small slot for small table', () => {

    // when
    const sizes = plannerOf([0.99]).plan(4, 2, false, 4, 1, true);

    // then
    expect(count(sizes, TileSize.WIDE)).toBe(3);
    expect(count(sizes, TileSize.SMALL)).toBe(2);
    expect(cellsOf(4, sizes).flat().every(c => c)).toBe(true);
  });

  it('#plan should fill rows with kept small slot', () => {
    for (const gridColumns of [3, 4, 5]) {
      for (let rows = 1; rows <= 4; rows++) {
        for (let wideStock = 0; wideStock <= 6; wideStock++) {
          for (let smallStock = 1; smallStock <= 8; smallStock++) {
            for (const values of SEQUENCES) {

              // when
              const sizes = plannerOf(values).plan(gridColumns, rows, false, wideStock, smallStock, true);

              // then
              const cells = cellsOf(gridColumns, sizes);
              const unkeptCells = cellsOf(gridColumns, plannerOf(values).plan(gridColumns, rows, false, wideStock, smallStock));
              expect(cells.length).toBe(unkeptCells.length);
              expect(cells.flat().every(c => c)).toBe(true);
              if (cells.length) {
                expect(sizes).toContain(TileSize.SMALL);
              }
              const wideCount = count(sizes, TileSize.WIDE);
              expect(wideCount).toBeLessThanOrEqual(wideStock);
              expect(count(sizes, TileSize.SMALL)).toBeLessThanOrEqual(smallStock + wideStock - wideCount);
            }
          }
        }
      }
    }
  });

  it('#canFill should match feasibility of plan', () => {
    const planner = plannerOf([0.4, 0.8]);
    for (const gridColumns of [3, 4, 5]) {
      for (let rows = 1; rows <= 4; rows++) {
        for (let wideStock = 0; wideStock <= 6; wideStock++) {
          for (let smallStock = 0; smallStock <= 12; smallStock++) {

            // when
            const canFill = planner.canFill(gridColumns, rows, wideStock, smallStock);

            // then
            const sizes = planner.plan(gridColumns, rows, false, wideStock, smallStock);
            expect(canFill).toBe(unwidenedWidthOf(sizes) === gridColumns * rows);
          }
        }
      }
    }
    expect(planner.canFill(3, 1, 1, 0)).toBe(false);
    expect(planner.canFill(3, 1, 2, 0)).toBe(true);
    expect(planner.canFill(5, 1, 2, 0)).toBe(false);
    expect(planner.canFill(5, 1, 3, 0)).toBe(true);
    expect(planner.canFill(4, 1, 2, 0)).toBe(true);
    expect(planner.canFill(4, 1, 0, 3)).toBe(false);
  });

  it('#columnSpansOf should map feature, wide and small to full row, two columns and one column', () => {

    // when
    const spans = GridPlanner.columnSpansOf([TileSize.FEATURE, TileSize.WIDE, TileSize.SMALL, TileSize.SMALL], 4);

    // then
    expect(spans).toEqual([4, 2, 1, 1]);
  });

  it('#columnSpansOf should widen narrowest tiles of underfilled last row from left', () => {

    // when
    const spans = [
      GridPlanner.columnSpansOf([TileSize.FEATURE, TileSize.SMALL, TileSize.SMALL, TileSize.SMALL], 5),
      GridPlanner.columnSpansOf([TileSize.SMALL, TileSize.WIDE], 4),
      GridPlanner.columnSpansOf([TileSize.SMALL], 3)
    ];

    // then
    expect(spans).toEqual([[5, 2, 2, 1], [2, 2], [3]]);
  });

  it('#columnSpansOf should return no spans without sizes', () => {

    // when
    const spans = GridPlanner.columnSpansOf([], 4);

    // then
    expect(spans).toEqual([]);
  });
});
