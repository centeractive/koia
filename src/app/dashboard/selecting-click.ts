import { isClickClaimed } from 'app/shared/ui/claimed-click';

const FORM_CONTROLS = 'a, button, input, select';

export const CONTROLS = FORM_CONTROLS + ', textarea, .mat-sort-header';

/** the controls of a tile header that do not move the tile, an unfocused title does */
export const HEADER_CONTROLS = FORM_CONTROLS + ', textarea:focus';

/**
 * @returns whether the click hit an area of a tile that is neither a control nor a data item, resize handles included
 */
export function isSelectingClick(event: MouseEvent): boolean {
  return !isClickClaimed(event) && !(event.target as Element).closest(CONTROLS);
}

/**
 * @returns whether the click adds a tile to the selection or removes it from there
 */
export function isAdditiveClick(event: MouseEvent): boolean {
  return event.shiftKey || event.ctrlKey || event.metaKey;
}

/**
 * @returns whether the event happened in an overlay such as a menu
 */
export function isOverlayTarget(event: Event): boolean {
  return event.target instanceof Element && !!event.target.closest('.cdk-overlay-container');
}

/**
 * moves the focus away from the focused element, as a press whose default is prevented does not
 */
export function blurActiveElement(): void {
  const focused = document.activeElement;
  if (focused instanceof HTMLElement && focused !== document.body) {
    focused.blur();
  }
}

/** the content of a tile handling the pointer itself, keep in sync with the cursor rule of dashboard.component.css */
const CONTENT_CONTROLS = CONTROLS + ', canvas, svg, table, [contenteditable], .div_margins';

/**
 * @returns whether the press on the content of a tile is meant for the content, otherwise it moves the tile
 */
export function isContentPress(event: MouseEvent): boolean {
  const target = event.target as HTMLElement;
  return !!target.closest(CONTENT_CONTROLS) || isScrollbarPress(event, target);
}

/**
 * the press on the scrollbar of an element targets the element beside its client area
 */
function isScrollbarPress(event: MouseEvent, target: HTMLElement): boolean {
  return (target.scrollHeight > target.clientHeight && event.offsetX >= target.clientWidth)
    || (target.scrollWidth > target.clientWidth && event.offsetY >= target.clientHeight);
}
