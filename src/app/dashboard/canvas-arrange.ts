import * as _ from 'lodash';
import { boundsOf, FreeLayout, Rect } from './free-layout';

export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

export type Axis = 'x' | 'y';

interface AxisKeys {
  start: 'x' | 'y';
  size: 'width' | 'height';
}

const AXES: Record<Axis, AxisKeys> = { x: { start: 'x', size: 'width' }, y: { start: 'y', size: 'height' } };

/**
 * arranges the rects of tiles on the canvas, each rect stays within the page width and, on pages, within a page
 */
export class CanvasArrange {

  constructor(private readonly layout: FreeLayout) { }

  /**
   * aligns the rects to the edge or centre of their bounds
   */
  align(rects: Rect[], alignment: Alignment): Rect[] {
    const bounds = boundsOf(rects);
    const { start, size } = AXES[['left', 'center', 'right'].includes(alignment) ? 'x' : 'y'];
    const aligned = rects.map(r => {
      let position: number;
      if (alignment === 'left' || alignment === 'top') {
        position = bounds[start];
      } else if (alignment === 'right' || alignment === 'bottom') {
        position = bounds[start] + bounds[size] - r[size];
      } else {
        position = Math.round(bounds[start] + (bounds[size] - r[size]) / 2);
      }
      return { ...r, [start]: position };
    });
    return this.clampedIntoPages(aligned);
  }

  /**
   * spaces the centres of the rects equally between the outermost centres, which stay
   */
  distribute(rects: Rect[], axis: Axis): Rect[] {
    if (rects.length < 3) {
      return rects;
    }
    const { start, size } = AXES[axis];
    const centerOf = (r: Rect) => r[start] + r[size] / 2;
    const order = _.sortBy(rects.map((_r, i) => i), i => centerOf(rects[i]));
    const first = centerOf(rects[order[0]]);
    const spacing = (centerOf(rects[order.at(-1)]) - first) / (rects.length - 1);
    const distributed = [...rects];
    order.forEach((index, rank) => {
      const r = rects[index];
      distributed[index] = { ...r, [start]: Math.round(first + rank * spacing - r[size] / 2) };
    });
    return this.clampedIntoPages(distributed);
  }

  /**
   * moves all rects by the same delta, reduced so that every rect stays within the page width and, on pages, within its page
   */
  nudge(rects: Rect[], dx: number, dy: number): Rect[] {
    const format = this.layout.pageFormat;
    const clampedDx = _.clamp(dx, Math.max(...rects.map(r => -r.x)), Math.min(...rects.map(r => format.width - r.width - r.x)));
    const minDy = Math.max(...rects.map(r => format.pageTopOf(r.y) - r.y));
    const maxDy = format.paged ? Math.min(...rects.map(r => format.pageTopOf(r.y) + format.height - r.height - r.y)) : Infinity;
    const clampedDy = _.clamp(dy, minDy, maxDy);
    return rects.map(r => ({ ...r, x: r.x + clampedDx, y: r.y + clampedDy }));
  }

  /**
   * moves the rects by the delta keeping their arrangement within the page width and below the top, each rect is then kept
   * within its page
   */
  moveBy(rects: Rect[], dx: number, dy: number): Rect[] {
    const bounds = boundsOf(rects);
    const clampedDx = _.clamp(dx, -bounds.x, this.layout.pageFormat.width - bounds.x - bounds.width);
    const clampedDy = Math.max(dy, -bounds.y);
    return this.clampedIntoPages(rects.map(r => ({ ...r, x: r.x + clampedDx, y: r.y + clampedDy })));
  }

  private clampedIntoPages(rects: Rect[]): Rect[] {
    return rects.map(r => this.layout.clampIntoPage(r, this.layout.pageFormat.pageTopOf(r.y)));
  }
}
