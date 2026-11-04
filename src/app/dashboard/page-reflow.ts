import { ElementContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { FreeLayout, Rect, TileRect } from './free-layout';
import { GridLayout } from './grid-layout';
import { WidthScale } from './width-scale';

interface Item {
  element: ViewElement;
  context: ElementContext;
  rect: Rect;
}

/**
 * moves positioned elements onto the pages of another layout: tiles are scaled horizontally to the page width keeping their
 * heights, the tiles of each former page keep their arrangement and flow on below the tiles placed before, rows crossing a
 * page boundary move to the next page and empty pages are removed; overlays keep their offset to the tile below their top
 * left corner
 */
export class PageReflow {

  private readonly widthScale: WidthScale;

  constructor(private readonly source: FreeLayout, private readonly target: FreeLayout) {
    this.widthScale = new WidthScale(source.pageFormat.width, target.pageFormat.width);
  }

  /**
   * @param contexts the contexts of the elements, at the same indexes
   */
  reflow(elements: ViewElement[], contexts: ElementContext[]): void {
    const positioned = elements
      .map((element, i) => ({ element, context: contexts[i] }))
      .filter(e => e.element.x != null);
    if (this.target.pageFormat.paged) {
      this.reflowOntoPages(positioned);
    } else if (this.source.pageFormat.width !== this.target.pageFormat.width) {
      positioned.forEach(e => {
        const { x, width } = this.scaled(this.source.rectOf(e.element), e.context);
        Object.assign(e.element, { x, width });
      });
    }
  }

  private reflowOntoPages(positioned: { element: ViewElement, context: ElementContext }[]): void {
    const sourceFormat = this.source.pageFormat;
    const pages = [...new Set(positioned.map(e => sourceFormat.pageIndexOf(e.element.y)))].sort((a, b) => a - b);
    let flowBottom: number;
    pages.forEach(page => {
      const onPage = positioned.filter(e => sourceFormat.pageIndexOf(e.element.y) === page);
      const tiles = onPage
        .filter(e => !e.context.isOverlay())
        .map(e => ({ ...e, rect: this.source.grownRect(this.source.rectOf(e.element), e.context) }))
        .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);
      const overlays = onPage
        .filter(e => e.context.isOverlay())
        .map(e => ({ ...e, rect: this.source.rectOf(e.element) }));
      const blockTop = Math.min(...tiles.concat(overlays).map(i => i.rect.y));
      const shift = flowBottom === undefined ? -page * sourceFormat.height : flowBottom + GridLayout.GAP_PX - blockTop;
      const fittedTiles = this.reflowTiles(tiles, shift, flowBottom ?? 0);
      const fittedOverlays = overlays.map(o => this.reflowOverlay(o, tiles, fittedTiles, shift));
      flowBottom = Math.max(flowBottom ?? 0, ...fittedTiles.concat(fittedOverlays).map(r => r.y + r.height));
    });
    this.removeEmptyPages(positioned.map(e => e.element));
  }

  private reflowTiles(tiles: Item[], shift: number, fittedBottom: number): Rect[] {
    const rects = tiles.map(t => ({ ...this.scaled(t.rect, t.context), y: t.rect.y + shift }));
    const fitted = this.target.fitToPages(rects, fittedBottom);
    tiles.forEach((t, i) => Object.assign(t.element, {
      x: fitted[i].x,
      y: fitted[i].y,
      width: fitted[i].width,
      height: Math.min(this.source.rectOf(t.element).height, fitted[i].height)
    }));
    return fitted;
  }

  private reflowOverlay(overlay: Item, tiles: Item[], fittedTiles: Rect[], shift: number): Rect {
    const tileRects: TileRect<ViewElement>[] = tiles.map(t => ({ tile: t.element, rect: t.rect }));
    const anchoring = this.source.anchorAt(overlay.rect, tileRects);
    const scaled = this.scaled(overlay.rect, overlay.context);
    let rect: Rect;
    let pageTop: number;
    if (anchoring) {
      const anchorRect = fittedTiles[tiles.findIndex(t => t.element === anchoring.tile)];
      rect = this.target.anchoredRect(scaled, anchorRect, anchoring.offset);
      pageTop = this.target.pageFormat.pageTopOf(anchorRect.y);
    } else {
      rect = { ...scaled, y: scaled.y + shift };
      pageTop = this.target.pageFormat.pageTopOf(rect.y);
    }
    const clamped = this.target.clampIntoPage(rect, pageTop);
    Object.assign(overlay.element, clamped);
    return clamped;
  }

  private scaled(rect: Rect, context: ElementContext): Rect {
    return this.widthScale.scale(rect, this.target.minSizeOf(context).width);
  }

  private removeEmptyPages(elements: ViewElement[]): void {
    const format = this.target.pageFormat;
    const usedPages = [...new Set(elements.map(e => format.pageIndexOf(e.y)))].sort((a, b) => a - b);
    elements.forEach(e => {
      const page = format.pageIndexOf(e.y);
      e.y -= (page - usedPages.indexOf(page)) * format.height;
    });
  }
}
