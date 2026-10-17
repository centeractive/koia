import { Edges } from 'angular-resizable-element';

export function resizableEdges(showResizableMargin: boolean): Edges {
  const resizable = !showResizableMargin;
  return { bottom: resizable, right: resizable, top: false, left: false };
}
