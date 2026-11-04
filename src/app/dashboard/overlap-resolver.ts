import { ElementContext } from 'app/shared/model';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { FreeLayout, intersects, Rect } from './free-layout';
import { GridLayout } from './grid-layout';

/**
 * pushes tiles covering others straight down, cascading, freed space stays; overlays may overlap and are never pushed
 */
export class OverlapResolver {

  constructor(private readonly layout: FreeLayout) { }

  /**
   * @param fixed the tiles keeping their position, all others are pushed below the tiles they cover
   * @returns the contexts moved
   */
  pushDown(contexts: ElementContext[], fixed: ElementContext[]): ElementContext[] {
    const tiles = contexts.filter(c => !c.isOverlay());
    const rects = tiles.map(c => this.layout.drawnRectOf(c));
    const pushed = this.pushedDown(rects, tiles.map(c => fixed.includes(c)));
    const moved = tiles.filter((_c, i) => pushed[i].y !== rects[i].y);
    moved.forEach(c => c.setPosition(pushed[tiles.indexOf(c)].x, pushed[tiles.indexOf(c)].y));
    return moved;
  }

  /**
   * @param fixed whether the rect at the same index keeps its position
   * @returns the rects at their indexes, those covering others pushed below them
   */
  pushedDown(rects: Rect[], fixed: boolean[]): Rect[] {
    const placed = rects.filter((_r, i) => fixed[i]);
    const result = [...rects];
    rects
      .map((rect, index) => ({ rect, index }))
      .filter(r => !fixed[r.index])
      .sort((a, b) => a.rect.y - b.rect.y || a.rect.x - b.rect.x)
      .forEach(({ rect, index }) => {
        result[index] = { ...rect, y: this.freeYOf(rect, placed) };
        placed.push(result[index]);
      });
    return result;
  }

  /**
   * @param rects the rects the contexts are placed on, at their indexes
   * @returns the rects, those of tiles covering each other as drawn pushed below them, the topmost and leftmost staying
   */
  separated(contexts: ElementContext[], rects: Rect[]): Rect[] {
    const tiles = contexts.map((_c, i) => i).filter(i => !contexts[i].isOverlay());
    const drawn = tiles.map(i => ({ ...rects[i], height: this.layout.drawnRectOf(contexts[i]).height }));
    const separated = [...rects];
    this.pushedDown(drawn, drawn.map(() => false)).forEach((r, j) => separated[tiles[j]] = { ...rects[tiles[j]], x: r.x, y: r.y });
    return separated;
  }

  private freeYOf(rect: Rect, placed: Rect[]): number {
    let y = rect.y;
    let covered = placed.filter(p => intersects({ ...rect, y }, p));
    while (covered.length) {
      y = this.fitIntoPage(Math.max(...covered.map(p => p.y + p.height)) + GridLayout.GAP_PX, rect.height);
      covered = placed.filter(p => intersects({ ...rect, y }, p));
    }
    return y;
  }

  /**
   * moves a tile crossing its page bottom to the next page, a tile taller than a page starts at its top
   */
  private fitIntoPage(y: number, height: number): number {
    const { paged, height: pageHeight } = this.layout.pageFormat;
    const pageTop = this.layout.pageFormat.pageTopOf(y);
    if (!paged || y + height <= pageTop + pageHeight) {
      return y;
    }
    return pageTop + pageHeight + Math.min(PageFormat.TOP_PADDING, Math.max(0, pageHeight - height));
  }
}
