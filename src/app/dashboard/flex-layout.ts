import { Edges, ResizeEvent } from 'angular-resizable-element';

/**
 * lays out elements of individual size that wrap according to the available space
 */
export class FlexLayout {

  static readonly MIN_DIM_PX = 200;

  static resizableEdges(showResizableMargin: boolean): Edges {
    const resizable = !showResizableMargin;
    return { bottom: resizable, right: resizable, top: false, left: false };
  }

  static validateResize(event: ResizeEvent): boolean {
    if (event.rectangle.width && event.rectangle.height &&
      (event.rectangle.width < FlexLayout.MIN_DIM_PX || event.rectangle.height < FlexLayout.MIN_DIM_PX)) {
      return false;
    }
    return true;
  }
}
