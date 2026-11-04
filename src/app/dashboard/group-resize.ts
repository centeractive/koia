import { Rect, Size } from './free-layout';

interface AxisKeys {
  start: 'x' | 'y';
  size: 'width' | 'height';
}

const AXES: AxisKeys[] = [{ start: 'x', size: 'width' }, { start: 'y', size: 'height' }];

/**
 * scales the rects of tiles proportionally with their bounds, each tile keeps its min size unless it was smaller before
 */
export class GroupResize {

  /**
   * @param rects the rects within the bounds, with the min sizes at the same indexes
   */
  constructor(private readonly bounds: Rect, private readonly rects: Rect[], private readonly minSizes: Size[]) { }

  /**
   * @returns the least size of the bounds that keeps every tile at its min size
   */
  minSize(): Size {
    const [width, height] = AXES.map(({ size }) =>
      Math.ceil(Math.max(...this.rects.map((r, i) => this.minOf(i, size) * this.bounds[size] / r[size]))));
    return { width, height };
  }

  resize(to: Rect): Rect[] {
    return this.rects.map((r, i) => {
      const scaled = { ...r };
      AXES.forEach(({ start, size }) => {
        const factor = to[size] / this.bounds[size];
        const scaledStart = Math.round(to[start] + (r[start] - this.bounds[start]) * factor);
        const scaledEnd = Math.round(to[start] + (r[start] + r[size] - this.bounds[start]) * factor);
        scaled[size] = Math.max(this.minOf(i, size), scaledEnd - scaledStart);
        scaled[start] = Math.min(scaledStart, to[start] + to[size] - scaled[size]);
      });
      return scaled;
    });
  }

  private minOf(index: number, size: 'width' | 'height'): number {
    return Math.min(this.minSizes[index][size], this.rects[index][size]);
  }
}
