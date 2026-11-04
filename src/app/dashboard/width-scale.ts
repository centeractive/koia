import { Rect } from './free-layout';
import { GridLayout } from './grid-layout';

/**
 * scales tiles horizontally from one page width to another, like grid columns the gaps between neighbours are kept
 */
export class WidthScale {

  private readonly factor: number;

  constructor(private readonly sourceWidth: number, private readonly targetWidth: number) {
    this.factor = (targetWidth + GridLayout.GAP_PX) / (sourceWidth + GridLayout.GAP_PX);
  }

  /**
   * @param minWidth the width the scaled rect keeps at least
   */
  scale(rect: Rect, minWidth: number): Rect {
    if (this.sourceWidth === this.targetWidth) {
      return rect;
    }
    const gap = GridLayout.GAP_PX;
    const left = Math.round(rect.x * this.factor);
    const right = Math.round((rect.x + rect.width + gap) * this.factor) - gap;
    const width = Math.min(this.targetWidth, Math.max(minWidth, right - left));
    return { ...rect, x: Math.min(left, this.targetWidth - width), width };
  }
}
