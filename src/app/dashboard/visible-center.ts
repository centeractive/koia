import { Point } from '@angular/cdk/drag-drop';
import { FreeLayout } from './free-layout';

/**
 * @returns the centre of the scroller's client area in page units of the layer, [[undefined]] while the layer has no width
 */
export function visibleCenterOf(scroller: HTMLElement, layer: HTMLElement): Point {
  const layerRect = layer.getBoundingClientRect();
  if (!(layerRect.width > 0)) {
    return undefined;
  }
  const scale = layerRect.width / FreeLayout.PAGE_WIDTH;
  const scrollerRect = scroller.getBoundingClientRect();
  return {
    x: (scrollerRect.left + scroller.clientLeft + scroller.clientWidth / 2 - layerRect.left) / scale,
    y: (scrollerRect.top + scroller.clientTop + scroller.clientHeight / 2 - layerRect.top) / scale
  };
}
