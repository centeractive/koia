import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { boundsOf, Rect } from './free-layout';

export interface LayerMapping {
  layerXOf(x: number): number;
  layerYOf(y: number, scale: number): number;
}

/**
 * @param scale pixels per page unit
 * @returns the CSS translation moving a tile drawn at the one rect to the other
 */
export function translateBetween(from: Rect, to: Rect, mapping: LayerMapping, scale: number): string {
  const dx = (mapping.layerXOf(to.x) - mapping.layerXOf(from.x)) * scale;
  const dy = (mapping.layerYOf(to.y, scale) - mapping.layerYOf(from.y, scale)) * scale;
  return dx + 'px ' + dy + 'px';
}

/**
 * the tiles moved together with the dragged one, the followers are drawn shifted while the dragged tile follows the pointer
 */
export class GroupDrag<T> {

  private rects: Rect[];

  /**
   * @param originals the rects of the members before the move, at the same indexes
   */
  constructor(readonly dragged: T, readonly members: T[], private readonly originals: Rect[], private readonly pageFormat: PageFormat) {
    this.rects = originals;
  }

  isGroup(): boolean {
    return this.members.length > 1;
  }

  isFollower(tile: T): boolean {
    return this.isGroup() && tile !== this.dragged && this.members.includes(tile);
  }

  bounds(): Rect {
    return boundsOf(this.originals);
  }

  originalRects(): Rect[] {
    return [...this.originals];
  }

  originalRectOf(member: T): Rect {
    return this.originals[this.members.indexOf(member)];
  }

  /**
   * @param rects the moved rects of the members, at their indexes
   */
  apply(rects: Rect[]): void {
    this.rects = rects;
  }

  rectOf(member: T): Rect {
    return this.rects[this.members.indexOf(member)];
  }

  /**
   * @param scale pixels per page unit
   * @returns the CSS translation of a follower, [[undefined]] for other tiles
   */
  translateOf(tile: T, mapping: LayerMapping, scale: number): string {
    if (!this.isFollower(tile)) {
      return undefined;
    }
    return translateBetween(this.originalRectOf(tile), this.rectOf(tile), mapping, scale);
  }

  membersWithChangedPage(): T[] {
    return this.members.filter((_, i) => this.pageFormat.pageIndexOf(this.originals[i].y) !== this.pageFormat.pageIndexOf(this.rects[i].y));
  }
}
