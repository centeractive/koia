import { FreeLayout, Rect } from './free-layout';
import { OverlapResolver } from './overlap-resolver';
import { centerXOf, FlowLimit, GAP, rightOf, RowArrangement, RowFlow } from './row-flow';

function overlapOf(a: Rect, b: Rect): number {
  const width = Math.min(rightOf(a), rightOf(b)) - Math.max(a.x, b.x);
  const height = Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y);
  return width > 0 && height > 0 ? width * height : 0;
}

/**
 * inserts a moved tile into the row of tiles it is dropped on: the tiles behind it shift right and those no longer fitting
 * the page width wrap to the start of the next row like text, the gap it leaves in its former row closes, tiles covered then
 * are pushed down
 */
export class RowInsertion {

  private readonly overlapResolver: OverlapResolver;
  private readonly rowFlow: RowFlow;

  constructor(private readonly layout: FreeLayout) {
    this.overlapResolver = new OverlapResolver(layout);
    this.rowFlow = new RowFlow(layout);
  }

  /**
   * a tile moved within its row keeps the row's width: the gap closing behind it is handed to the tile it is inserted before, the
   * tiles in between keep the gaps they stand at, as rows taken from the grid are spaced by less than the gap of the canvas
   *
   * @param moved the rect the tile is moved to
   * @param original the rect of the tile before the move
   * @param others the rects of the other tiles, overlays excluded
   * a tile of the former row is passed once the pointer rect covers half of it, a tile of another row once the pointer rect's
   * centre passes its centre
   *
   * @param pointerX the x the pointer moves the tile to, before it is snapped and kept within the page
   * @returns [[undefined]] when the tile covers no other tile or does not fit the page of the row
   */
  arrange(moved: Rect, original: Rect, others: Rect[], pointerX = moved.x): RowArrangement {
    const anchor = this.anchorOf(moved, others);
    if (anchor === undefined || !this.rowFlow.fitsPageAt(others[anchor].y, moved.height)) {
      return undefined;
    }
    const row = this.rowFlow.rowOf(others, others[anchor]);
    const formerRow = this.rowFlow.rowOf([...others, original], original).filter(r => r !== original);
    const inFormerRow = formerRow.includes(others[anchor]);
    const edgeOf = (r: Rect) => {
      if (!inFormerRow) {
        return pointerX + moved.width / 2;
      }
      return centerXOf(r) < centerXOf(original) ? pointerX : pointerX + moved.width;
    };
    const index = row.filter(r => centerXOf(r) < edgeOf(r)).length;
    const rects = others.map(r => ({ ...r }));
    const limits = this.rowFlow.limitsOf(others, rects, original);
    this.closeGap(formerRow.map(r => rects[others.indexOf(r)]), original, rects, limits);
    const rowRects = row.map(r => rects[others.indexOf(r)]);
    const freedGap = inFormerRow ? this.freedGapOf(formerRow, original, others, rects, limits) : GAP;
    const displaced = rowRects[index];
    const slotGap = index > 0 && displaced ? this.rowFlow.gapBetween(rowRects[index - 1], displaced) : freedGap;
    if (inFormerRow) {
      rowRects.forEach((r, i) => limits.set(r, {
        ...limits.get(r),
        gap: r === displaced ? freedGap : i === 0 ? limits.get(r).gap : this.rowFlow.gapBetween(rowRects[i - 1], r)
      }));
    }
    const target = { ...moved, y: others[anchor].y, x: displaced ? displaced.x : rightOf(rowRects[index - 1]) + freedGap };
    const width = this.layout.pageFormat.width;
    limits.set(target, inFormerRow ? { right: Math.max(width, original.x + moved.width), gap: slotGap } : { right: width, gap: GAP });
    const rowTop = Math.min(...rowRects.map(r => r.y));
    this.rowFlow.flow([...rowRects.slice(0, index), target, ...rowRects.slice(index)], index, rowTop, rects, target, limits);
    const pushed = this.overlapResolver.pushedDown([...rects, target], [...rects.map(() => false), true]);
    return { target: pushed.at(-1), rects: pushed.slice(0, -1) };
  }

  /**
   * @returns the gap of the tile taking the place of the moved one in its former row, the moved tile's own when it was last
   */
  private freedGapOf(formerRow: Rect[], original: Rect, others: Rect[], rects: Rect[], limits: Map<Rect, FlowLimit>): number {
    const successor = formerRow.find(r => r.x >= rightOf(original));
    return successor ? limits.get(rects[others.indexOf(successor)]).gap : this.rowFlow.gapOf([...others, original], original);
  }

  /**
   * @returns the index of the other rect the moved rect overlaps most, the topmost and leftmost among equal ones
   */
  private anchorOf(moved: Rect, others: Rect[]): number {
    let anchor: number;
    others.forEach((r, i) => {
      const overlap = overlapOf(moved, r);
      const best = anchor === undefined ? 0 : overlapOf(moved, others[anchor]);
      if (overlap > best || (overlap > 0 && overlap === best && (r.y < others[anchor].y || (r.y === others[anchor].y && r.x < others[anchor].x)))) {
        anchor = i;
      }
    });
    return anchor;
  }

  /**
   * the tiles right of the moved tile in its former row move left by its width and the gap behind it, the first taking its
   * place, the others no closer to their predecessor than before,
   * and stop beside tall tiles of a row above
   *
   * @param formerRow the copies of the tiles of the former row, by x
   */
  private closeGap(formerRow: Rect[], original: Rect, rects: Rect[], limits: Map<Rect, FlowLimit>): void {
    const rowTop = Math.min(original.y, ...formerRow.map(r => r.y));
    const blockers = this.rowFlow.blockersOf(rects, rowTop);
    const behind = formerRow.filter(r => r.x >= rightOf(original));
    let predecessor: Rect;
    formerRow.forEach(r => {
      if (behind.includes(r)) {
        const originalX = r.x;
        const lowest = r === behind[0] ? 0 : rightOf(predecessor) + limits.get(r).gap;
        r.x = Math.max(lowest, r.x - (original.width + limits.get(behind[0]).gap));
        for (let blocker = this.rowFlow.blockerOf(r, blockers); blocker && r.x < originalX; blocker = this.rowFlow.blockerOf(r, blockers)) {
          r.x = Math.min(originalX, rightOf(blocker) + GAP);
        }
      }
      predecessor = r;
    });
  }
}
