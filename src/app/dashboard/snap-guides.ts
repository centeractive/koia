import { FreeLayout, Rect } from './free-layout';
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

const ALL_EDGES = [0, 0.5, 1];
const OUTER_EDGES = [0, 1];
const END_EDGE = [1];

/**
 * snaps the edges of a moved or resized tile to the edges of other tiles and pages, otherwise to the snap step
 */
export class SnapGuides {

  private readonly xTargets: Target[];
  private readonly yTargets: Target[];

  constructor(others: Rect[], private readonly pageCount: number, private readonly threshold: number) {
    this.xTargets = [0, FreeLayout.PAGE_WIDTH / 2, FreeLayout.PAGE_WIDTH]
      .concat(others.flatMap(o => this.tileTargets(o.x, o.width)))
      .map(position => ({ position, edges: ALL_EDGES }));
    this.yTargets = others.flatMap(o => this.tileTargets(o.y, o.height))
      .map(position => ({ position, edges: ALL_EDGES }))
      .concat(Array.from({ length: pageCount + 1 }, (_, k) => ({ position: k * FreeLayout.PAGE_HEIGHT, edges: OUTER_EDGES })));
  }

  private tileTargets(start: number, size: number): number[] {
    return [start, start + size / 2, start + size, start - GridLayout.GAP_PX, start + size + GridLayout.GAP_PX];
  }

  snapMove(rect: Rect): Snap {
    const xMatch = this.match(rect.x, rect.width, this.xTargets, ALL_EDGES);
    const yMatch = this.match(rect.y, rect.height, this.yTargets, ALL_EDGES);
    const snappedX = xMatch ? xMatch.target - xMatch.edge * rect.width : this.roundToStep(rect.x);
    const snappedY = yMatch ? yMatch.target - yMatch.edge * rect.height : this.roundToStep(rect.y);
    const x = this.clamp(snappedX, 0, FreeLayout.PAGE_WIDTH - rect.width);
    const y = this.fitIntoPage(this.clamp(snappedY, 0, this.pageCount * FreeLayout.PAGE_HEIGHT - rect.height), rect.height);
    return {
      rect: { ...rect, x, y },
      guides: this.guidesOf(x === snappedX ? xMatch : undefined, y === snappedY ? yMatch : undefined)
    };
  }

  snapResize(rect: Rect): Snap {
    const xMatch = this.match(rect.x, rect.width, this.xTargets, END_EDGE);
    const yMatch = this.match(rect.y, rect.height, this.yTargets, END_EDGE);
    const snappedWidth = xMatch ? xMatch.target - rect.x : this.roundToStep(rect.x + rect.width) - rect.x;
    const snappedHeight = yMatch ? yMatch.target - rect.y : this.roundToStep(rect.y + rect.height) - rect.y;
    const pageBottom = FreeLayout.pageTopOf(rect.y) + FreeLayout.PAGE_HEIGHT;
    const width = this.clamp(snappedWidth, FreeLayout.MIN_SIZE, FreeLayout.PAGE_WIDTH - rect.x);
    const height = this.clamp(snappedHeight, FreeLayout.MIN_SIZE, pageBottom - rect.y);
    return {
      rect: { ...rect, width, height },
      guides: this.guidesOf(width === snappedWidth ? xMatch : undefined, height === snappedHeight ? yMatch : undefined)
    };
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
    const pageBottom = FreeLayout.pageTopOf(y) + FreeLayout.PAGE_HEIGHT;
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
