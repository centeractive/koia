import { AnchorOffset, ElementContext, TextBoxContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import * as _ from 'lodash';
import { GridLayout } from './grid-layout';
import type { Guide } from './snap-guides';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Size = Pick<Rect, 'width' | 'height'>;

export interface TileRect<T> {
  tile: T;
  rect: Rect;
}

export interface Anchoring<T> {
  tile: T;
  offset: AnchorOffset;
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
  static readonly OVERLAY_Z_OFFSET = 10000;
  static readonly OVERLAY_CASCADE = 20;

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
    const rect = this.drawnRectOf(context);
    return {
      left: this.pageUnits(rect.x),
      top: this.pageUnits(rect.y - FreeLayout.pageTopOf(rect.y)),
      width: this.pageUnits(rect.width),
      height: this.pageUnits(rect.height),
      'z-index': this.zIndexOf(context)
    };
  }

  /**
   * positions an overlay of the grid by custom properties only, so that the anchor positioning rule takes precedence
   * where supported, `--koia-left` and `--koia-top` serving as fallback
   */
  overlayStyle(context: TextBoxContext, anchorName: string): object {
    const rect = this.drawnRectOf(context);
    const style = {
      '--koia-left': this.pageUnits(rect.x),
      '--koia-top': this.pageUnits(rect.y),
      width: this.pageUnits(rect.width),
      height: this.pageUnits(rect.height),
      'z-index': this.zIndexOf(context)
    };
    if (context.anchor) {
      Object.assign(style, {
        '--koia-anchor': anchorName,
        '--koia-anchor-fx': context.anchorOffset.x * 100 + '%',
        '--koia-anchor-fy': context.anchorOffset.y * 100 + '%'
      });
    }
    return style;
  }

  private zIndexOf(context: ElementContext): number {
    return context.isOverlay() ? (context.z ?? 0) + FreeLayout.OVERLAY_Z_OFFSET : context.z;
  }

  minSizeOf(context: ElementContext): Size {
    return context instanceof TextBoxContext
      ? { width: TextBoxContext.MIN_WIDTH, height: TextBoxContext.MIN_HEIGHT }
      : { width: FreeLayout.MIN_SIZE, height: FreeLayout.MIN_SIZE };
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

  /**
   * @returns the rect grown to the height a text box needs to show its whole content
   */
  grownRect(rect: Rect, context: ElementContext): Rect {
    return context instanceof TextBoxContext && context.fitHeight > rect.height ? { ...rect, height: context.fitHeight } : rect;
  }

  drawnRectOf(context: ElementContext): Rect {
    return this.grownRect(this.rectOf(context), context);
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
    let z = this.maxZOf(contexts);
    this.fitToPages(rects, positionedBottom).forEach((rect, i) => {
      unpositioned[i].setPosition(rect.x, rect.y);
      unpositioned[i].setSize(rect.width, rect.height);
      unpositioned[i].z = ++z;
    });
  }

  /**
   * cascades overlays without position from the given top on, ignoring the tiles of the grid below
   */
  placeUnpositionedOverlays(contexts: ElementContext[], top: number): void {
    const overlays = contexts.filter(c => c.isOverlay());
    const slotTop = Math.round(top / FreeLayout.STEP) * FreeLayout.STEP;
    const cascade = FreeLayout.OVERLAY_CASCADE;
    let slot = overlays.filter(c => c.x != null && c.x % cascade === 0 && c.y - slotTop === c.x).length;
    let z = this.maxZOf(contexts);
    overlays
      .filter(c => c.x == null)
      .forEach(c => {
        c.setPosition(slot * cascade, slotTop + slot * cascade);
        c.z = ++z;
        slot++;
      });
  }

  private maxZOf(contexts: ElementContext[]): number {
    return Math.max(0, ...contexts.map(c => c.z ?? 0));
  }

  private bottomOf(contexts: ElementContext[]): number {
    return Math.max(0, ...contexts.map(c => {
      const rect = this.drawnRectOf(c);
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

  clampIntoPage(rect: Rect, pageTop: number): Rect {
    const width = Math.min(rect.width, FreeLayout.PAGE_WIDTH);
    const height = Math.min(rect.height, FreeLayout.PAGE_HEIGHT);
    return {
      x: _.clamp(rect.x, 0, FreeLayout.PAGE_WIDTH - width),
      y: _.clamp(rect.y, pageTop, pageTop + FreeLayout.PAGE_HEIGHT - height),
      width,
      height
    };
  }

  /**
   * @returns the topmost tile containing the top left corner of the overlay together with the overlay's offset
   * relative to that tile, [[undefined]] if there is none
   */
  anchorAt<T extends { z?: number }>(overlay: Rect, tiles: TileRect<T>[]): Anchoring<T> {
    const anchor = tiles
      .filter(t => this.contains(t.rect, overlay.x, overlay.y))
      .sort((a, b) => (a.tile.z ?? 0) - (b.tile.z ?? 0))
      .at(-1);
    return anchor && {
      tile: anchor.tile,
      offset: { x: (overlay.x - anchor.rect.x) / anchor.rect.width, y: (overlay.y - anchor.rect.y) / anchor.rect.height }
    };
  }

  private contains(rect: Rect, x: number, y: number): boolean {
    return x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
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
