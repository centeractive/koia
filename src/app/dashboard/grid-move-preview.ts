import { Point } from '@angular/cdk/drag-drop';
import { ElementContext } from 'app/shared/model';
import * as _ from 'lodash';
import { GridLayout } from './grid-layout';
import { GridMove } from './grid-move';
import { GridSpan } from './grid-placement';

/**
 * shows where a dragged grid tile lands by moving the placeholder among the tiles, the dragged tile is kept within the grid width
 */
export class GridMovePreview {

  /**
   * @param elementOf the rendered element of a grid tile
   */
  constructor(readonly move: GridMove<ElementContext>, private readonly placeholder: HTMLElement, private readonly cells: HTMLElement,
    private readonly elementOf: (context: ElementContext) => HTMLElement, private readonly gridLayout: GridLayout) { }

  /**
   * @param contexts the contexts of the grid, overlays included
   */
  static of(context: ElementContext, contexts: ElementContext[], spanOf: (context: ElementContext) => GridSpan, placeholder: HTMLElement,
    cells: HTMLElement, elementOf: (context: ElementContext) => HTMLElement, gridLayout: GridLayout): GridMovePreview {
    const tiles = contexts.filter(c => !c.isOverlay());
    const move = new GridMove(context, tiles, tiles.map(spanOf), gridLayout.gridColumns);
    return new GridMovePreview(move, placeholder, cells, elementOf, gridLayout);
  }

  /**
   * the grid cells span the content width but its padding, which is half the gap on each side
   *
   * @param point the pointer position
   * @param pickup the position of the pointer within the dragged tile
   * @returns the top left of the dragged tile
   */
  constrain(point: Point, size: { width: number }, pickup: Point): Point {
    const rect = this.cells.getBoundingClientRect();
    const x = _.clamp(point.x - pickup.x, rect.left, rect.right - size.width);
    const y = point.y - pickup.y;
    if (this.move.moveTo(this.gridLayout.cellAt(x - rect.left, y - rect.top, rect.width + GridLayout.GAP_PX))) {
      const successor = this.move.successor();
      if (successor) {
        this.elementOf(successor).before(this.placeholder);
      } else {
        this.elementOf(this.move.lastOther()).after(this.placeholder);
      }
    }
    return { x, y };
  }
}
