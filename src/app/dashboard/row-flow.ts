import * as _ from 'lodash';
import { FreeLayout, intersects, Rect } from './free-layout';
import { GridLayout } from './grid-layout';

export interface RowArrangement {
  /** the rect the moved or resized tile lands on */
  target: Rect;
  /** the rects of the other tiles at their indexes */
  rects: Rect[];
}

export const GAP = GridLayout.GAP_PX;

export interface FlowLimit {
  /** the right edge the rect may reach without wrapping */
  right: number;
  /** the gap the rect keeps to its predecessor */
  gap: number;
}

export function rightOf(rect: Rect): number {
  return rect.x + rect.width;
}

export function centerXOf(rect: Rect): number {
  return rect.x + rect.width / 2;
}

/**
 * lets the tiles of a row flow like text: tiles side by side form a row, those pushed past the page width wrap to the start of
 * the next row, beside tall tiles of a row above reaching into it
 */
export class RowFlow {

  constructor(private readonly layout: FreeLayout) { }

  /**
   * a rect belongs to the row of the rects before it in y order when its top lies less than half the smaller height below the
   * row's first top
   *
   * @returns the rects of the row of the member, by x
   */
  rowOf(rects: Rect[], member: Rect): Rect[] {
    return _.sortBy(this.rowsOf(rects).find(row => row.includes(member)), r => r.x);
  }

  /**
   * @returns the rows in the order of their first top
   */
  private rowsOf(rects: Rect[]): Rect[][] {
    const rows: Rect[][] = [];
    _.sortBy(rects, r => r.y, r => r.x).forEach(r => {
      const row = rows.at(-1);
      if (row && r.y - row[0].y < Math.min(r.height, ...row.map(m => m.height)) / 2) {
        row.push(r);
      } else {
        rows.push([r]);
      }
    });
    return rows;
  }

  /**
   * a tile not pushed further right than before never wraps, nor does it move closer to its left neighbour than before
   *
   * @param moved the rect of the moved or resized tile before
   * @returns for each copy the page width or the right edge reached before, if further, and the gap it had
   */
  limitsOf(before: Rect[], copies: Rect[], moved: Rect): Map<Rect, FlowLimit> {
    const width = this.layout.pageFormat.width;
    const all = [...before, moved];
    return new Map(copies.map((copy, i) => [copy, { right: Math.max(width, rightOf(before[i])), gap: this.gapOf(all, before[i]) }]));
  }

  /**
   * @returns the gap of the rect to its left neighbour in its row, no wider than the gap of the canvas
   */
  gapOf(rects: Rect[], rect: Rect): number {
    const left = this.rowOf(rects, rect).filter(r => r.x < rect.x).at(-1);
    return left ? _.clamp(rect.x - rightOf(left), 0, GAP) : GAP;
  }

  /**
   * @returns the rects of rows above reaching into the row starting at the top
   */
  blockersOf(rects: Rect[], rowTop: number, exclude: Rect[] = []): Rect[] {
    return rects.filter(r => r.y < rowTop && r.y + r.height > rowTop && !exclude.includes(r));
  }

  /**
   * lines the rects of a row up from the given position on, beside the blockers
   *
   * @returns the rects wrapped as they and the rects before them exceed their limit
   */
  pass(sequence: Rect[], from: number, limits: Map<Rect, FlowLimit>, blockers: Rect[]): Rect[] {
    const width = this.layout.pageFormat.width;
    for (let i = from; i < sequence.length; i++) {
      const rect = sequence[i];
      const limit = limits.get(rect);
      rect.x = i === 0 ? _.clamp(rect.x, 0, width - rect.width) : Math.max(rect.x, rightOf(sequence[i - 1]) + limit.gap);
      for (let blocker = this.blockerOf(rect, blockers); blocker; blocker = this.blockerOf(rect, blockers)) {
        rect.x = rightOf(blocker) + GAP;
      }
      if (rightOf(rect) > limit.right) {
        return sequence.slice(i);
      }
    }
    return [];
  }

  /**
   * @returns the first blocker the rect intersects, [[undefined]] for none
   */
  blockerOf(rect: Rect, blockers: Rect[]): Rect {
    return blockers.find(b => intersects(rect, b));
  }

  /**
   * lines up the row from the given position on, the rects wrapped flow into the next rows
   *
   * @param rowTop the first top of the row
   * @param rects the rects of the other tiles, the target excluded
   * @param target the moved or resized rect
   */
  flow(sequence: Rect[], from: number, rowTop: number, rects: Rect[], target: Rect, limits: Map<Rect, FlowLimit>): void {
    let current = sequence;
    let wrapped = this.pass(current, from, limits, this.blockersOf([...rects, target], rowTop, current));
    let rowY = rowTop;
    while (wrapped.length) {
      const rest = rects.filter(r => !wrapped.includes(r));
      const height = Math.max(...wrapped.map(r => r.height));
      const next = this.rowsOf(rest).find(row => row[0].y > rowY && !row.some(r => current.includes(r)) && this.fitsPageAt(row[0].y, height));
      if (!next) {
        this.wrapBelow(wrapped, rects, target);
        return;
      }
      rowY = next[0].y;
      wrapped.forEach(r => Object.assign(r, { x: 0, y: rowY }));
      current = [...wrapped, ..._.sortBy(next, r => r.x)];
      wrapped = this.pass(current, 0, limits, this.blockersOf([...rects, target], rowY, current));
    }
  }

  /**
   * packs the wrapped rects into new rows below all tiles
   */
  private wrapBelow(wrapped: Rect[], rects: Rect[], target: Rect): void {
    const placed = [...rects, target].filter(r => !wrapped.includes(r));
    const top = Math.max(...placed.map(r => r.y + r.height)) + GAP;
    const rows = this.layout.fitToPages(this.layout.packRows(wrapped, top), top - GAP);
    wrapped.forEach((r, i) => Object.assign(r, { x: rows[i].x, y: rows[i].y }));
  }

  fitsPageAt(y: number, height: number): boolean {
    const format = this.layout.pageFormat;
    return !format.paged || y + height <= format.pageTopOf(y) + format.height;
  }
}
