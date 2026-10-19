import { Point } from '@angular/cdk/drag-drop';
import { AnchorOffset, ElementContext, TextBoxContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import type { TextExtent } from 'app/text-box/text-fit';
import * as _ from 'lodash';
import { GridLayout } from './grid-layout';
import { PageFormat } from './page-format';
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

  static readonly STEP = 10;
  static readonly MIN_SIZE = 100;
  static readonly SNAP_THRESHOLD_PX = 6;
  static readonly OVERLAY_Z_OFFSET = 10000;
  static readonly OVERLAY_CASCADE = 20;
  static readonly SHEET_HEADER = 56;
  static readonly SHEET_FOOTER = 28;
  static readonly SHEET_GAP = 20;

  constructor(public pageFormat = PageFormat.LANDSCAPE) { }

  canvasStyle(): object {
    return { '--koia-pu': 'calc(100cqw / ' + this.pageFormat.width + ')' };
  }

  pagesStyle(): object {
    return {
      ...this.canvasStyle(),
      width: 'calc(100% * ' + this.pageFormat.width + ' / ' + PageFormat.LANDSCAPE.width + ')',
      '--koia-print-width': this.pageFormat.printWidthPx + 'px'
    };
  }

  pageStyle(): object {
    return this.pageFormat.paged ? { 'margin-bottom': this.pageUnits(FreeLayout.SHEET_GAP) } : {};
  }

  pageContentStyle(page: number, contexts: ElementContext[]): object {
    const height = this.pageFormat.paged || page > 0 ? this.pageFormat.height : this.bottomOf(contexts);
    return { height: this.pageUnits(height) };
  }

  sheetHeaderStyle(): object {
    return { height: this.pageUnits(FreeLayout.SHEET_HEADER) };
  }

  sheetFooterStyle(): object {
    return { height: this.pageUnits(FreeLayout.SHEET_FOOTER) };
  }

  tileStyle(context: ElementContext): object {
    const rect = this.drawnRectOf(context);
    return {
      left: this.pageUnits(rect.x),
      top: this.pageUnits(rect.y - this.pageFormat.pageTopOf(rect.y)),
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

  /**
   * @returns the y on the rendered pages, including the header, footer and gap of the sheets above
   */
  layerYOf(y: number): number {
    if (!this.pageFormat.paged) {
      return y;
    }
    const sheetFrame = FreeLayout.SHEET_HEADER + FreeLayout.SHEET_FOOTER + FreeLayout.SHEET_GAP;
    return y + this.pageFormat.pageIndexOf(y) * sheetFrame + FreeLayout.SHEET_HEADER;
  }

  /**
   * @returns the y of the layout at the given y on the rendered pages, a sheet's header, footer and gap map to the
   * nearest page edge
   */
  layoutYOf(layerY: number): number {
    if (!this.pageFormat.paged) {
      return layerY;
    }
    const height = this.pageFormat.height;
    const pitch = FreeLayout.SHEET_HEADER + height + FreeLayout.SHEET_FOOTER + FreeLayout.SHEET_GAP;
    const page = Math.max(0, Math.floor(layerY / pitch));
    return page * height + _.clamp(layerY - page * pitch - FreeLayout.SHEET_HEADER, 0, height);
  }

  rectOf(tile: Pick<ViewElement, 'x' | 'y' | 'width' | 'height'>): Rect {
    return {
      x: tile.x,
      y: tile.y,
      width: Math.min(tile.width ?? ElementContext.DEFAULT_WIDTH, this.pageFormat.width - tile.x),
      height: Math.min(tile.height ?? ElementContext.DEFAULT_HEIGHT, this.pageFormat.height)
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
    const usedPages = this.pageFormat.paged ? Math.max(1, Math.ceil(this.bottomOf(contexts) / this.pageFormat.height)) : 1;
    return Array.from({ length: usedPages + 1 }, (_, i) => i);
  }

  pageOf(context: ElementContext): number {
    return this.pageFormat.pageIndexOf(context.y);
  }

  contextsOnPage(contexts: ElementContext[], page: number): ElementContext[] {
    return contexts.filter(c => this.pageOf(c) === page);
  }

  placeUnpositioned(contexts: ElementContext[]): void {
    const positioned = contexts.filter(c => c.x != null);
    const unpositioned = contexts.filter(c => c.x == null);
    const positionedBottom = this.bottomOf(positioned);
    const sizes = unpositioned.map(c => ({ width: c.width ?? ElementContext.DEFAULT_WIDTH, height: c.height ?? ElementContext.DEFAULT_HEIGHT }));
    const rects = this.packRows(sizes, positioned.length ? positionedBottom + GridLayout.GAP_PX : 0);
    let z = this.maxZOf(contexts);
    this.fitToPages(rects, positionedBottom).forEach((rect, i) => {
      unpositioned[i].setPosition(rect.x, rect.y);
      unpositioned[i].setSize(rect.width, rect.height);
      unpositioned[i].z = ++z;
    });
  }

  /**
   * places tiles of the given sizes in rows from the given top on, a row ends where the next tile exceeds the page width
   */
  packRows(sizes: Size[], top: number): Rect[] {
    let x = 0;
    let y = top;
    let rowBottom = top;
    return sizes.map(size => {
      const width = Math.min(size.width, this.pageFormat.width);
      const height = Math.min(size.height, this.pageFormat.height);
      if (x > 0 && x + width > this.pageFormat.width) {
        x = 0;
        y = rowBottom + GridLayout.GAP_PX;
      }
      const rect = { x, y, width, height };
      rowBottom = Math.max(rowBottom, y + height);
      x += width + GridLayout.GAP_PX;
      return rect;
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

  /**
   * centres the overlay at the given centre, cascading it past overlays at the same spot
   *
   * @param withinPage [[true]] to keep the overlay within the page of the centre
   */
  placeCentered(context: ElementContext, center: Point, contexts: ElementContext[], withinPage: boolean): void {
    const pageTop = withinPage ? this.pageFormat.pageTopOf(center.y) : undefined;
    const size = this.rectOf({ x: 0, y: 0, width: context.width, height: context.height });
    let rect = this.clampCentered({ ...size, x: Math.round(center.x - size.width / 2), y: Math.round(center.y - size.height / 2) }, pageTop);
    while (contexts.some(c => c !== context && c.isOverlay() && c.x === rect.x && c.y === rect.y)) {
      const cascaded = this.clampCentered({ ...rect, x: rect.x + FreeLayout.OVERLAY_CASCADE, y: rect.y + FreeLayout.OVERLAY_CASCADE }, pageTop);
      if (cascaded.x === rect.x && cascaded.y === rect.y) {
        break;
      }
      rect = cascaded;
    }
    context.setPosition(rect.x, rect.y);
    context.z = this.maxZOf(contexts) + 1;
  }

  private clampCentered(rect: Rect, pageTop: number): Rect {
    const clamped = { ...rect, x: _.clamp(rect.x, 0, this.pageFormat.width - rect.width), y: Math.max(0, rect.y) };
    return pageTop === undefined ? clamped : this.clampIntoPage(clamped, pageTop);
  }

  /**
   * @param extent size in pixels the text box needs for its text
   * @param scale pixels per page unit
   * @returns the size in page units, not wider than the current one
   */
  fitSizeOf(context: ElementContext, extent: TextExtent, scale: number): Size {
    return {
      width: Math.min(Math.max(Math.ceil(extent.width / scale), TextBoxContext.MIN_FIT_WIDTH), this.rectOf(context).width),
      height: _.clamp(Math.ceil(extent.height / scale), TextBoxContext.MIN_HEIGHT, this.pageFormat.height)
    };
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
   * moves rows that would cross a page boundary to a page top, rows below are moved along by the same distance;
   * without pages, only the heights are capped
   *
   * @param fittedBottom bottom of the tiles already placed on the canvas
   */
  fitToPages(rects: Rect[], fittedBottom = 0): Rect[] {
    const height = this.pageFormat.height;
    const fitted = rects.map(r => ({ ...r, height: Math.min(r.height, height) }));
    if (!this.pageFormat.paged) {
      return fitted;
    }
    const rowTops = [...new Set(rects.map(r => r.y))].sort((a, b) => a - b);
    let offset = 0;
    rowTops.forEach(rowTop => {
      const row = fitted.filter((_, i) => rects[i].y === rowTop);
      const top = rowTop + offset;
      const pageTop = this.pageFormat.pageTopOf(top);
      if (row.some(r => top + r.height > pageTop + height)) {
        offset += (pageTop >= fittedBottom ? pageTop : pageTop + height) - top;
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
    const { width: pageWidth, height: pageHeight, paged } = this.pageFormat;
    const width = Math.min(rect.width, pageWidth);
    const height = Math.min(rect.height, pageHeight);
    return {
      x: _.clamp(rect.x, 0, pageWidth - width),
      y: paged ? _.clamp(rect.y, pageTop, pageTop + pageHeight - height) : Math.max(rect.y, 0),
      width,
      height
    };
  }

  /**
   * @returns the rect moved to its offset relative to the anchor rect
   */
  anchoredRect(rect: Rect, anchorRect: Rect, offset: AnchorOffset): Rect {
    return {
      ...rect,
      x: Math.round(anchorRect.x + offset.x * anchorRect.width),
      y: Math.round(anchorRect.y + offset.y * anchorRect.height)
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
