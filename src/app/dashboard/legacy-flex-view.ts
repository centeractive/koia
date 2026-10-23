import { Route } from 'app/shared/model';
import { View } from 'app/shared/model/view-config';

/**
 * @returns true for a flex view of Koia before pages existed, its tiles have no position
 */
export function isLegacyFlexView(view: View): boolean {
  return view.route === Route.FLEX && view.canvasPaging == null && view.elements.length > 0 && view.elements.every(e => e.x == null);
}
