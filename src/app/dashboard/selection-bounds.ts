import { ElementContext } from 'app/shared/model';
import { CanvasLayerMapping } from './canvas-layer-mapping';
import { boundsOf, FreeLayout, Rect } from './free-layout';

export interface SelectionBounds {
  /** style of the box drawn around the tiles as drawn */
  style: object;
  /** whether the tiles may be resized together, the bounds lie within a page */
  resizable: boolean;
  /** bounds of the tiles' own sizes */
  rectBounds: Rect;
  /** height the drawn bounds exceed the bounds of the own sizes by, as text boxes grow to their content */
  growth: number;
}

/**
 * @param scale pixels per page unit
 */
export function selectionBoundsOf(contexts: ElementContext[], layout: FreeLayout, mapping: CanvasLayerMapping,
  scale: number): SelectionBounds {
  const drawn = boundsOf(contexts.map(c => layout.drawnRectOf(c)));
  const rectBounds = boundsOf(contexts.map(c => layout.rectOf(c)));
  const bottom = drawn.y + drawn.height;
  const top = mapping.layerYOf(drawn.y, scale);
  const format = layout.pageFormat;
  return {
    style: layout.layerRectStyle({ x: mapping.layerXOf(drawn.x), y: top, width: drawn.width, height: mapping.layerYOfBottom(bottom, scale) - top }),
    resizable: drawn.height <= format.height && format.pageTopOf(drawn.y) === format.pageTopOfBottom(bottom),
    rectBounds,
    growth: bottom - rectBounds.y - rectBounds.height
  };
}
