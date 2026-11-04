import { ResizeEvent } from 'angular-resizable-element';
import { ElementContext } from 'app/shared/model';
import { Rect, TileRect } from './free-layout';
import { GridLayout } from './grid-layout';

/** the rendered rects are rounded to whole page units, an edge and a width each by half a unit at most */
const ROUNDING_UNITS = 2;

export interface GridResizeState {
  /** the neighbour the resized tile is moved before */
  before: ElementContext;
  /** the contexts with the resized tile moved before the neighbour */
  order: ElementContext[];
  /** the column span keeping the right edge of the resized tile */
  columnSpan: number;
  /** the left of the resized tile in pixels relative to the grid cells */
  previewLeftPx: number;
}

/**
 * the resize of a grid tile by its left edge over the neighbours to its left in its row: the tile is moved before the
 * neighbours whose centre the edge passes and grows to keep its right edge, the neighbours flow after it
 */
export class GridResizeSession {

  private readonly column: number;
  private readonly columnSpan: number;
  private applied: GridResizeState;

  /**
   * @param order the contexts in their order at the start of the resize
   * @param tiles the rendered rects of the grid tiles in page units, overlays excluded
   * @param scale pixels per page unit
   * @param contentWidth the width the grid layout measures its pitches by
   */
  constructor(readonly context: ElementContext, readonly order: ElementContext[], private readonly tiles: TileRect<ElementContext>[],
    private readonly scale: number, private readonly gridLayout: GridLayout, private readonly contentWidth: number) {
    this.column = this.columnOf(this.rectOf(context).x);
    this.columnSpan = context.gridColumnSpan;
  }

  /**
   * @returns the state for the resized rect, [[undefined]] unless the left edge alone passes the centre of a neighbour
   */
  update(event: ResizeEvent): GridResizeState {
    const { left, top, bottom } = event.edges;
    if (left === undefined || top !== undefined || bottom !== undefined) {
      return undefined;
    }
    const edge = event.rectangle.left / this.scale;
    const before = this.neighbours().find(n => this.rectOf(n).x + this.rectOf(n).width / 2 > edge);
    if (!before) {
      return undefined;
    }
    const column = this.columnOf(this.rectOf(before).x);
    const order = this.order.filter(c => c !== this.context);
    order.splice(order.indexOf(before), 0, this.context);
    return {
      before,
      order,
      columnSpan: Math.min(Math.max(this.column + this.columnSpan - column, 1), this.gridLayout.gridColumns - column),
      previewLeftPx: this.rectOf(before).x * this.scale
    };
  }

  /**
   * @returns whether the state differs from the state applied before
   */
  apply(state: GridResizeState): boolean {
    const changed = state?.before !== this.applied?.before || state?.columnSpan !== this.applied?.columnSpan;
    this.applied = state;
    return changed;
  }

  /**
   * @returns the tiles directly before the resized one in its row, adjoining each other, from left to right
   */
  private neighbours(): ElementContext[] {
    const index = this.tiles.findIndex(t => t.tile === this.context);
    const gap = GridLayout.GAP_PX / this.scale;
    const neighbours: ElementContext[] = [];
    let next = this.tiles[index].rect;
    for (let i = index - 1; i >= 0; i--) {
      const rect = this.tiles[i].rect;
      if (rect.y !== next.y || Math.abs(rect.x + rect.width + gap - next.x) > ROUNDING_UNITS) {
        break;
      }
      neighbours.unshift(this.tiles[i].tile);
      next = rect;
    }
    return neighbours;
  }

  private rectOf(context: ElementContext): Rect {
    return this.tiles.find(t => t.tile === context).rect;
  }

  private columnOf(x: number): number {
    return this.gridLayout.columnOf(x * this.scale, this.contentWidth);
  }
}
