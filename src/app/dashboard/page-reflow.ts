import { ElementContext } from 'app/shared/model';
import { ViewElement } from 'app/shared/model/view-config';
import { FreeLayout, Rect, TileRect } from './free-layout';

interface Item {
  element: ViewElement;
  rect: Rect;
}

/**
 * moves positioned elements onto the pages of another layout, keeping tile sizes as far as they fit: the tiles of each
 * former page keep their arrangement where it fits the page width, otherwise they are packed in rows in reading order;
 * overlays keep their offset to the tile below their top left corner, each former page starts on a new page
 */
export class PageReflow {

  constructor(private readonly source: FreeLayout, private readonly target: FreeLayout) { }

  /**
   * @param contexts the contexts of the elements, at the same indexes
   */
  reflow(elements: ViewElement[], contexts: ElementContext[]): void {
    const positioned = elements
      .map((element, i) => ({ element, context: contexts[i] }))
      .filter(e => e.element.x != null);
    const sourceFormat = this.source.pageFormat;
    const pages = [...new Set(positioned.map(e => sourceFormat.pageIndexOf(e.element.y)))].sort((a, b) => a - b);
    let groupTop = 0;
    pages.forEach(page => {
      const onPage = positioned.filter(e => sourceFormat.pageIndexOf(e.element.y) === page);
      const tiles = onPage
        .filter(e => !e.context.isOverlay())
        .map(e => ({ element: e.element, rect: this.source.grownRect(this.source.rectOf(e.element), e.context) }))
        .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x);
      const overlays = onPage
        .filter(e => e.context.isOverlay())
        .map(e => ({ element: e.element, rect: this.source.rectOf(e.element) }));
      const shift = groupTop - page * sourceFormat.height;
      const fittedTiles = this.reflowTiles(tiles, shift, groupTop);
      const fittedOverlays = overlays.map(o => this.reflowOverlay(o, tiles, fittedTiles, shift, groupTop));
      const groupBottom = Math.max(groupTop + 1, ...fittedTiles.concat(fittedOverlays).map(r => r.y + r.height));
      groupTop = Math.ceil(groupBottom / this.target.pageFormat.height) * this.target.pageFormat.height;
    });
  }

  private reflowTiles(tiles: Item[], shift: number, groupTop: number): Rect[] {
    const fitsWidth = tiles.every(t => t.rect.x + t.rect.width <= this.target.pageFormat.width);
    const rects = fitsWidth
      ? tiles.map(t => ({ ...t.rect, y: t.rect.y + shift }))
      : this.target.packRows(tiles.map(t => t.rect), groupTop);
    const fitted = this.target.fitToPages(rects, groupTop);
    tiles.forEach((t, i) => Object.assign(t.element, {
      x: fitted[i].x,
      y: fitted[i].y,
      width: fitted[i].width,
      height: Math.min(this.source.rectOf(t.element).height, fitted[i].height)
    }));
    return fitted;
  }

  private reflowOverlay(overlay: Item, tiles: Item[], fittedTiles: Rect[], shift: number, groupTop: number): Rect {
    const tileRects: TileRect<ViewElement>[] = tiles.map(t => ({ tile: t.element, rect: t.rect }));
    const anchoring = this.source.anchorAt(overlay.rect, tileRects);
    const targetFormat = this.target.pageFormat;
    let rect: Rect;
    let pageTop: number;
    if (anchoring) {
      const anchorRect = fittedTiles[tiles.findIndex(t => t.element === anchoring.tile)];
      rect = this.target.anchoredRect(overlay.rect, anchorRect, anchoring.offset);
      pageTop = targetFormat.pageTopOf(anchorRect.y);
    } else {
      rect = { ...overlay.rect, y: overlay.rect.y + shift };
      pageTop = Math.max(groupTop, targetFormat.pageTopOf(rect.y));
    }
    const clamped = this.target.clampIntoPage(rect, pageTop);
    Object.assign(overlay.element, clamped);
    return clamped;
  }
}
