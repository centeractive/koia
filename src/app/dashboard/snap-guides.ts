import { FreeLayout, Rect, Size } from './free-layout';
import { PageFormat } from './page-format';
import { GridLayout } from './grid-layout';

export interface Guide {
  axis: 'x' | 'y';
  position: number;
}

export interface Snap {
  rect: Rect;
  guides: Guide[];
}

interface Target {
  position: number;
  edges: number[];
}

interface Match {
  target: number;
  edge: number;
}

export interface MovedEdges {
  left: boolean;
  top: boolean;
  right: boolean;
  bottom: boolean;
}

/** the snapped start and size along an axis, with the match of the moved edge unless it was clamped */
interface AxisSnap {
  start: number;
  size: number;
  match: Match;
}

const ALL_EDGES = [0, 0.5, 1];
const OUTER_EDGES = [0, 1];
const START_EDGE = [0];
const END_EDGE = [1];
const END_EDGES: MovedEdges = { left: false, top: false, right: true, bottom: true };

/**
 * snaps the edges of a moved or resized tile to the edges of other tiles and pages, otherwise to the snap step;
 * an unpaged layer (the grid) has no page edges and no bottom
 */
export class SnapGuides {

  private readonly xTargets: Target[];
  private readonly yTargets: Target[];

  constructor(others: Rect[], private readonly page: PageFormat, private readonly pageCount: number, private readonly threshold: number,
    private readonly paged = true) {
    this.xTargets = [0, page.width / 2, page.width]
      .concat(others.flatMap(o => this.tileTargets(o.x, o.width)))
      .map(position => ({ position, edges: ALL_EDGES }));
    this.yTargets = others.flatMap(o => this.tileTargets(o.y, o.height))
      .map(position => ({ position, edges: ALL_EDGES }))
      .concat(Array.from({ length: paged ? pageCount + 1 : 0 }, (_, k) => ({ position: k * page.height, edges: OUTER_EDGES })));
  }

  private tileTargets(start: number, size: number): number[] {
    return [start, start + size / 2, start + size, start - GridLayout.GAP_PX, start + size + GridLayout.GAP_PX];
  }

  snapMove(rect: Rect): Snap {
    const xMatch = this.match(rect.x, rect.width, this.xTargets, ALL_EDGES);
    const yMatch = this.match(rect.y, rect.height, this.yTargets, ALL_EDGES);
    const snappedX = xMatch ? xMatch.target - xMatch.edge * rect.width : this.roundToStep(rect.x);
    const snappedY = yMatch ? yMatch.target - yMatch.edge * rect.height : this.roundToStep(rect.y);
    const x = this.clamp(snappedX, 0, this.page.width - rect.width);
    const y = this.paged
      ? this.fitIntoPage(this.clamp(snappedY, 0, this.pageCount * this.page.height - rect.height), rect.height)
      : Math.max(snappedY, 0);
    return {
      rect: { ...rect, x, y },
      guides: this.guidesOf(x === snappedX ? xMatch : undefined, y === snappedY ? yMatch : undefined)
    };
  }

  /**
   * a moved start edge keeps the end edge, the other edges stay unless moved
   */
  snapResize(rect: Rect, minSize: Size = { width: FreeLayout.MIN_SIZE, height: FreeLayout.MIN_SIZE }, moved = END_EDGES): Snap {
    const x = this.snapAxis(rect.x, rect.width, this.xTargets, moved.left, moved.right, 0, minSize.width, this.page.width - rect.x);
    const bottom = rect.y + rect.height;
    const minY = this.paged ? this.page.pageTopOfBottom(bottom) : Math.max(0, bottom - this.page.height);
    const maxHeight = this.paged ? this.page.pageTopOf(rect.y) + this.page.height - rect.y : this.page.height;
    const y = this.snapAxis(rect.y, rect.height, this.yTargets, moved.top, moved.bottom, minY, minSize.height, maxHeight);
    return {
      rect: { x: x.start, y: y.start, width: x.size, height: y.size },
      guides: this.guidesOf(x.match, y.match)
    };
  }

  /**
   * @param minStart the least start a moved start edge may get
   * @param maxSize the largest size a moved end edge may give
   */
  private snapAxis(start: number, size: number, targets: Target[], startMoved: boolean, endMoved: boolean, minStart: number,
    minSize: number, maxSize: number): AxisSnap {
    if (startMoved) {
      return this.snapStart(start, size, targets, minStart, minSize);
    }
    return endMoved ? this.snapEnd(start, size, targets, minSize, maxSize) : { start, size, match: undefined };
  }

  private snapStart(start: number, size: number, targets: Target[], minStart: number, minSize: number): AxisSnap {
    const end = start + size;
    const match = this.match(start, size, targets, START_EDGE);
    const snapped = match ? match.target : this.roundToStep(start);
    const clamped = this.clamp(snapped, minStart, end - minSize);
    return { start: clamped, size: end - clamped, match: clamped === snapped ? match : undefined };
  }

  private snapEnd(start: number, size: number, targets: Target[], minSize: number, maxSize: number): AxisSnap {
    const match = this.match(start, size, targets, END_EDGE);
    const snapped = match ? match.target - start : this.roundToStep(start + size) - start;
    const clamped = this.clamp(snapped, minSize, maxSize);
    return { start, size: clamped, match: clamped === snapped ? match : undefined };
  }

  private match(start: number, size: number, targets: Target[], edges: number[]): Match {
    let best: Match;
    let bestDistance: number;
    targets.forEach(target => target.edges
      .filter(edge => edges.includes(edge))
      .forEach(edge => {
        const distance = Math.abs(start + edge * size - target.position);
        if (distance <= this.threshold && (!best || distance < bestDistance)) {
          best = { target: target.position, edge };
          bestDistance = distance;
        }
      }));
    return best;
  }

  private roundToStep(value: number): number {
    return Math.round(value / FreeLayout.STEP) * FreeLayout.STEP;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private fitIntoPage(y: number, height: number): number {
    const pageBottom = this.page.pageTopOf(y) + this.page.height;
    if (y + height <= pageBottom) {
      return y;
    }
    return y + height / 2 < pageBottom ? pageBottom - height : pageBottom;
  }

  private guidesOf(xMatch: Match, yMatch: Match): Guide[] {
    const guides: Guide[] = [];
    if (xMatch) {
      guides.push({ axis: 'x', position: xMatch.target });
    }
    if (yMatch) {
      guides.push({ axis: 'y', position: yMatch.target });
    }
    return guides;
  }
}
