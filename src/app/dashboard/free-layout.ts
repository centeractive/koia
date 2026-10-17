import { ElementContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { GridLayout } from './grid-layout';
import type { Guide } from './snap-guides';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * lays out elements at free positions on pages of fixed size, measured in page units that scale with the canvas width
 */
export class FreeLayout {

  static readonly PAGE_WIDTH = 1400;
  static readonly PAGE_HEIGHT = 950;
  static readonly STEP = 10;
  static readonly MIN_SIZE = 100;
  static readonly SNAP_THRESHOLD_PX = 6;

  static pageTopOf(y: number): number {
    return Math.floor(y / FreeLayout.PAGE_HEIGHT) * FreeLayout.PAGE_HEIGHT;
  }

  canvasStyle(): object {
    return { '--koia-pu': 'calc(100cqw / ' + FreeLayout.PAGE_WIDTH + ')' };
  }

  pageStyle(): object {
    return { height: this.pageUnits(FreeLayout.PAGE_HEIGHT) };
  }

  tileStyle(context: ElementContext): object {
    const rect = this.rectOf(context);
    return {
      left: this.pageUnits(rect.x),
      top: this.pageUnits(rect.y - FreeLayout.pageTopOf(rect.y)),
      width: this.pageUnits(rect.width),
      height: this.pageUnits(rect.height),
      'z-index': context.z
    };
  }

  guideStyle(guide: Guide): object {
    return guide.axis === 'x' ? { left: this.pageUnits(guide.position) } : { top: this.pageUnits(guide.position) };
  }

  private pageUnits(value: number): string {
    return 'calc(' + value + ' * var(--koia-pu))';
  }

  rectOf(tile: Pick<ViewElement, 'x' | 'y' | 'width' | 'height'>): Rect {
    return {
      x: tile.x,
      y: tile.y,
      width: Math.min(tile.width ?? ElementContext.DEFAULT_WIDTH, FreeLayout.PAGE_WIDTH - tile.x),
      height: Math.min(tile.height ?? ElementContext.DEFAULT_HEIGHT, FreeLayout.PAGE_HEIGHT)
    };
  }

  pageIndexes(contexts: ElementContext[]): number[] {
    const usedPages = Math.max(1, Math.ceil(this.bottomOf(contexts) / FreeLayout.PAGE_HEIGHT));
    return Array.from({ length: usedPages + 1 }, (_, i) => i);
  }

  pageOf(context: ElementContext): number {
    return Math.floor(context.y / FreeLayout.PAGE_HEIGHT);
  }

  contextsOnPage(contexts: ElementContext[], page: number): ElementContext[] {
    return contexts.filter(c => this.pageOf(c) === page);
  }

  placeUnpositioned(contexts: ElementContext[]): void {
    const positioned = contexts.filter(c => c.x != null);
    const unpositioned = contexts.filter(c => c.x == null);
    const positionedBottom = this.bottomOf(positioned);
    let x = 0;
    let y = positioned.length ? positionedBottom + GridLayout.GAP_PX : 0;
    let rowBottom = y;
    const rects = unpositioned.map(c => {
      const width = Math.min(c.width ?? ElementContext.DEFAULT_WIDTH, FreeLayout.PAGE_WIDTH);
      const height = Math.min(c.height ?? ElementContext.DEFAULT_HEIGHT, FreeLayout.PAGE_HEIGHT);
      if (x > 0 && x + width > FreeLayout.PAGE_WIDTH) {
        x = 0;
        y = rowBottom + GridLayout.GAP_PX;
      }
      const rect = { x, y, width, height };
      rowBottom = Math.max(rowBottom, y + height);
      x += width + GridLayout.GAP_PX;
      return rect;
    });
    let z = Math.max(0, ...contexts.map(c => c.z ?? 0));
    this.fitToPages(rects, positionedBottom).forEach((rect, i) => {
      unpositioned[i].setPosition(rect.x, rect.y);
      unpositioned[i].setSize(rect.width, rect.height);
      unpositioned[i].z = ++z;
    });
  }

  private bottomOf(contexts: ElementContext[]): number {
    return Math.max(0, ...contexts.map(c => {
      const rect = this.rectOf(c);
      return rect.y + rect.height;
    }));
  }

  /**
   * moves rows that would cross a page boundary to a page top, rows below are moved along by the same distance
   *
   * @param fittedBottom bottom of the tiles already placed on the canvas
   */
  fitToPages(rects: Rect[], fittedBottom = 0): Rect[] {
    const fitted = rects.map(r => ({ ...r, height: Math.min(r.height, FreeLayout.PAGE_HEIGHT) }));
    const rowTops = [...new Set(rects.map(r => r.y))].sort((a, b) => a - b);
    let offset = 0;
    rowTops.forEach(rowTop => {
      const row = fitted.filter((_, i) => rects[i].y === rowTop);
      const top = rowTop + offset;
      const pageTop = FreeLayout.pageTopOf(top);
      if (row.some(r => top + r.height > pageTop + FreeLayout.PAGE_HEIGHT)) {
        offset += (pageTop >= fittedBottom ? pageTop : pageTop + FreeLayout.PAGE_HEIGHT) - top;
      }
      row.forEach(r => r.y = rowTop + offset);
      fittedBottom = Math.max(fittedBottom, ...row.map(r => r.y + r.height));
    });
    return fitted;
  }

  rectFromRendered(left: number, top: number, width: number, height: number, scale: number): Rect {
    return {
      x: Math.round(left / scale),
      y: Math.round(top / scale),
      width: Math.round(width / scale),
      height: Math.round(height / scale)
    };
  }

  bringToFront(context: ElementContext, contexts: ElementContext[]): void {
    this.rank([...this.othersByZ(context, contexts), context]);
  }

  sendToBack(context: ElementContext, contexts: ElementContext[]): void {
    this.rank([context, ...this.othersByZ(context, contexts)]);
  }

  private othersByZ(context: ElementContext, contexts: ElementContext[]): ElementContext[] {
    return contexts
      .filter(c => c !== context)
      .sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  }

  private rank(contexts: ElementContext[]): void {
    contexts.forEach((c, i) => c.z = i + 1);
  }
}
