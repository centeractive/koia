import { isClickClaimed } from 'app/shared/ui/claimed-click';

const CONTROLS = 'a, button, input, select, textarea, .mat-sort-header';

/**
 * @returns whether the click hit an area of a tile that is neither a control nor a data item, resize handles included
 */
export function isSelectingClick(event: MouseEvent): boolean {
  return !isClickClaimed(event) && !(event.target as Element).closest(CONTROLS);
}
