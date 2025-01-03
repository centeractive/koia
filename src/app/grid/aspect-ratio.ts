import { ElementContext } from 'app/shared/model';

/** 
 * @param gridCellRatio aspect ratio of format 'width:height' (for example '3:1')
 * @param context element context
 * @returns a number that can be used for the CSS attribute 'aspect-ratio'
 */
export function computeAspectRatio(gridCellRatio: string, context: ElementContext): number {
    return toNumber(gridCellRatio) * (context.gridColumnSpan / context.gridRowSpan);
}

function toNumber(gridCellRatio: string): number {
    const tokens = gridCellRatio.split(':');
    return parseInt(tokens[0]) / parseInt(tokens[1]);
}