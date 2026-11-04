import { FreeLayout, Rect } from './free-layout';
import { OverlapResolver } from './overlap-resolver';
import { GAP, rightOf, RowArrangement, RowFlow } from './row-flow';

export type RoomKind = 'move' | 'resize';

function overlapsVertically(a: Rect, b: Rect): boolean {
  return a.y < b.y + b.height && b.y < a.y + a.height;
}

function overlapsHorizontally(a: Rect, b: Rect): boolean {
  return a.x < rightOf(b) && b.x < rightOf(a);
}

/**
 * makes room for a tile moved or resized in place: the tiles right of it in its row shift right and wrap like text, the tiles
 * below are pushed down; tiles to the left, above and tall tiles of the row above stay, the tile stops beside them
 */
export class RowRoom {

  private readonly overlapResolver: OverlapResolver;
  private readonly rowFlow: RowFlow;

  constructor(layout: FreeLayout) {
    this.overlapResolver = new OverlapResolver(layout);
    this.rowFlow = new RowFlow(layout);
  }

  /**
   * @param changed the rect the tile is moved or resized to
   * @param before the rect of the tile before
   * @param others the rects of the other tiles, overlays excluded
   * @param kind whether the tile keeps its size or the edges not moved
   */
  makeRoom(changed: Rect, before: Rect, others: Rect[], kind: RoomKind): RowArrangement {
    const row = this.rowFlow.rowOf([...others, before], before);
    const rowTop = Math.min(...row.map(r => r.y));
    const target = this.stoppedAtRowAbove(this.stoppedAbove(this.stoppedLeft(changed, before, others, kind), before, others, kind),
      before, this.rowFlow.blockersOf(others, rowTop), kind);
    const rects = others.map(r => ({ ...r }));
    const behind = row.filter(r => r !== before && r.x > before.x).map(r => rects[others.indexOf(r)]);
    this.rowFlow.flow([target, ...behind], 1, rowTop, rects, target, this.rowFlow.limitsOf(others, rects, before));
    const pushed = this.overlapResolver.pushedDown([...rects, target], [...rects.map(() => false), true]);
    return { target: pushed.at(-1), rects: pushed.slice(0, -1) };
  }

  private stoppedLeft(rect: Rect, before: Rect, others: Rect[], kind: RoomKind): Rect {
    const left = others.filter(o => rightOf(o) <= before.x && overlapsVertically(o, rect));
    if (!left.length) {
      return rect;
    }
    const x = Math.max(rect.x, Math.min(Math.max(...left.map(rightOf)) + GAP, before.x));
    return { ...rect, x, width: kind === 'resize' ? rightOf(rect) - x : rect.width };
  }

  private stoppedAbove(rect: Rect, before: Rect, others: Rect[], kind: RoomKind): Rect {
    const above = others.filter(o => o.y + o.height <= before.y && overlapsHorizontally(o, rect));
    if (!above.length) {
      return rect;
    }
    const y = Math.max(rect.y, Math.min(Math.max(...above.map(o => o.y + o.height)) + GAP, before.y));
    return { ...rect, y, height: kind === 'resize' ? rect.y + rect.height - y : rect.height };
  }

  /**
   * @param blockers the tiles of rows above reaching into the row of the tile
   */
  private stoppedAtRowAbove(rect: Rect, before: Rect, blockers: Rect[], kind: RoomKind): Rect {
    const right = blockers.filter(b => b.x >= rightOf(before) && overlapsVertically(b, rect));
    if (!right.length) {
      return rect;
    }
    const minX = Math.min(...right.map(b => b.x)) - GAP;
    return kind === 'resize'
      ? { ...rect, width: Math.max(rightOf(before), Math.min(rightOf(rect), minX)) - rect.x }
      : { ...rect, x: Math.min(rect.x, Math.max(before.x, minX - rect.width)) };
  }
}
