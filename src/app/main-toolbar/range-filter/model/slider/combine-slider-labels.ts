/**
 * @returns a single label when both labels are equal, the labels joined as range otherwise
 */
export function combineSliderLabels(l1: string, l2: string): string {
    return l1 === l2 ? l1 : l1 + ' - ' + l2;
}
