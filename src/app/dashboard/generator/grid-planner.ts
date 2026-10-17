import { range } from 'd3';
import { Randomizer } from './randomizer';
import { TileSize } from './tile-spec';

/**
 * plans the tile sizes of completely filled grid rows in DOM order
 */
export class GridPlanner {

  constructor(private readonly randomizer: Randomizer) { }

  /**
   * @param keepSmallSlot whether at least one small slot must remain, requires a small stock of at least one
   */
  plan(gridColumns: number, rows: number, hasFeature: boolean, wideStock: number, smallStock: number, keepSmallSlot = false):
    TileSize[] {
    const sizes = hasFeature ? [TileSize.FEATURE] : [];
    for (let r = hasFeature ? rows - 1 : rows; r >= 1; r--) {
      const lo = this.minWideCount(gridColumns, r, wideStock, smallStock);
      const hi = this.maxWideCount(gridColumns, r, wideStock);
      if (lo <= hi) {
        const hiK = keepSmallSlot ? Math.min(hi, Math.floor((r * gridColumns - 1) / 2)) : hi;
        const k = hiK >= Math.max(lo, 1) ? this.randomizer.pick(range(Math.max(lo, 1), hiK + 1)) : lo;
        return sizes.concat(this.planRows(gridColumns, r, k));
      }
    }
    return sizes;
  }

  canFill(gridColumns: number, rows: number, wideStock: number, smallStock: number): boolean {
    return this.minWideCount(gridColumns, rows, wideStock, smallStock) <= this.maxWideCount(gridColumns, rows, wideStock);
  }

  private minWideCount(gridColumns: number, rows: number, wideStock: number, smallStock: number): number {
    return Math.max(0, rows * gridColumns - smallStock - wideStock);
  }

  private maxWideCount(gridColumns: number, rows: number, wideStock: number): number {
    return Math.min(wideStock, rows * Math.floor(gridColumns / 2));
  }

  private planRows(gridColumns: number, rows: number, wideCount: number): TileSize[] {
    const widePerRow = Math.floor(gridColumns / 2);
    const wideCounts = new Array<number>(rows).fill(0);
    for (let i = 0; i < wideCount; i++) {
      const rowsWithRoom = range(rows).filter(r => wideCounts[r] < widePerRow);
      wideCounts[this.randomizer.pick(rowsWithRoom)]++;
    }
    return wideCounts.flatMap(w => this.randomizer.shuffled([
      ...new Array<TileSize>(w).fill(TileSize.WIDE),
      ...new Array<TileSize>(gridColumns - 2 * w).fill(TileSize.SMALL)
    ]));
  }
}
