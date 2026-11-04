import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { FreeLayout, Rect } from './free-layout';
import type { Guide } from './snap-guides';

export interface ClientRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/**
 * maps between layout coordinates and the rendered layer, the grid cells or the canvas sheets, both in page units
 */
export class CanvasLayerMapping {

  /**
   * @param layer the rendered layer, [[undefined]] while not rendered
   */
  constructor(private readonly isGridLayout: () => boolean, private readonly layout: FreeLayout,
    private readonly layer: () => HTMLElement) { }

  /**
   * @returns the x on the rendered layer in page units
   */
  layerXOf(x: number): number {
    return this.isGridLayout() ? x : this.layout.layerXOf(x);
  }

  layoutXOf(layerX: number): number {
    return this.isGridLayout() ? layerX : this.layout.layoutXOf(layerX);
  }

  /**
   * @param scale pixels per page unit, the sheets are separated by a gap of fixed pixels
   * @returns the y on the rendered layer in page units
   */
  layerYOf(y: number, scale: number): number {
    return this.isGridLayout() ? y : this.layout.layerYOf(y, PageFormat.DESK_GUTTER_PX / scale);
  }

  layoutYOf(layerY: number, scale: number): number {
    return this.isGridLayout() ? layerY : this.layout.layoutYOf(layerY, PageFormat.DESK_GUTTER_PX / scale);
  }

  /**
   * @returns the pixels per page unit of the rendered layer, 0 while it is not rendered
   */
  scale(): number {
    return (this.layer()?.clientWidth ?? 0) / this.widthUnits();
  }

  /**
   * @returns the width of the rendered layer in page units, the canvas shows whole sheets
   */
  widthUnits(): number {
    return this.isGridLayout() ? this.layout.pageFormat.width : this.layout.pageFormat.sheetWidth;
  }

  /**
   * @param scale pixels per page unit
   * @returns the y on the rendered layer in page units of a bottom edge, a bottom on a page boundary is drawn at the end of the
   * page above
   */
  layerYOfBottom(bottom: number, scale: number): number {
    return this.isGridLayout() ? bottom : this.layout.layerYOfBottom(bottom, PageFormat.DESK_GUTTER_PX / scale);
  }

  /**
   * @param layerRect the client rect of the rendered layer
   */
  clientRectOf(rect: Rect, layerRect: DOMRect, scale: number): ClientRect {
    const left = layerRect.left + this.layerXOf(rect.x) * scale;
    const top = layerRect.top + this.layerYOf(rect.y, scale) * scale;
    return { left, top, right: left + rect.width * scale, bottom: top + rect.height * scale };
  }

  /**
   * @param snappedRect the snapped rect the guide was found for, a guide at its bottom on a page boundary is drawn at the end
   * of the page above
   */
  layerGuideOf(guide: Guide, scale: number, snappedRect: Rect): Guide {
    if (guide.axis === 'x') {
      return { ...guide, position: this.layerXOf(guide.position) };
    }
    const position = guide.position === snappedRect.y + snappedRect.height
      ? this.layerYOfBottom(guide.position, scale)
      : this.layerYOf(guide.position, scale);
    return { ...guide, position };
  }
}

/**
 * @returns the client rect as a rect in pixels
 */
export function rectOfClient(rect: ClientRect): Rect {
  return { x: rect.left, y: rect.top, width: rect.right - rect.left, height: rect.bottom - rect.top };
}
