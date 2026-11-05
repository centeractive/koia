import { GridCell, GridSpan, occupiedCells, placedCells } from './grid-placement';

interface Candidate {
  /** the top left cell the moved tile is placed at */
  cell: GridCell;
  /** the empty cells before the last occupied cell in reading order */
  holes: number;
}

interface Rank {
  rowDistance: number;
  columnDistance: number;
  holes: number;
  indexDistance: number;
}

function compare(a: Rank, b: Rank): number {
  return a.rowDistance - b.rowDistance || a.columnDistance - b.columnDistance || a.holes - b.holes || a.indexDistance - b.indexDistance;
}

function holesOf(cells: boolean[][]): number {
  const flat = cells.flat();
  return flat.slice(0, flat.lastIndexOf(true)).filter(occupied => !occupied).length;
}

/**
 * the move of a grid tile: it lands at the index where CSS sparse auto-placement puts it nearest to the aimed cell, by row first,
 * then by column; among equally near ones, the order leaving fewer holes, then the one closest to the original order
 */
export class GridMove<T> {

  private readonly originalIndex: number;
  private readonly others: T[];
  private readonly candidates: Candidate[];
  private target: number;

  /**
   * @param tiles the grid tiles in their order, the dragged one included
   * @param spans the spans of the tiles at their indexes
   */
  constructor(readonly dragged: T, tiles: T[], spans: GridSpan[], gridColumns: number) {
    this.originalIndex = tiles.indexOf(dragged);
    this.target = this.originalIndex;
    this.others = tiles.filter(t => t !== dragged);
    const span = spans[this.originalIndex];
    const otherSpans = spans.filter((_s, i) => i !== this.originalIndex);
    this.candidates = tiles.map((_t, k) => {
      const order = [...otherSpans.slice(0, k), span, ...otherSpans.slice(k)];
      return { cell: placedCells(gridColumns, order)[k], holes: holesOf(occupiedCells(gridColumns, order)) };
    });
  }

  /**
   * @param cell the fractional cell of the top left corner of the dragged tile as drawn
   * @returns whether the index the tile lands at changed
   */
  moveTo(cell: GridCell): boolean {
    const aimed = { column: Math.round(cell.column), row: Math.round(cell.row) };
    const rankOf = (k: number): Rank => ({
      rowDistance: Math.abs(this.candidates[k].cell.row - aimed.row),
      columnDistance: Math.abs(this.candidates[k].cell.column - aimed.column),
      holes: this.candidates[k].holes,
      indexDistance: Math.abs(k - this.originalIndex)
    });
    let best = 0;
    for (let k = 1; k < this.candidates.length; k++) {
      if (compare(rankOf(k), rankOf(best)) < 0) {
        best = k;
      }
    }
    const changed = best !== this.target;
    this.target = best;
    return changed;
  }

  /**
   * @returns the index among the tiles the dragged tile lands at
   */
  targetIndex(): number {
    return this.target;
  }

  /**
   * @returns the tile the dragged tile is placed before, [[undefined]] when it is placed last
   */
  successor(): T {
    return this.others[this.target];
  }

  /**
   * @returns the last tile but the dragged one
   */
  lastOther(): T {
    return this.others.at(-1);
  }
}
