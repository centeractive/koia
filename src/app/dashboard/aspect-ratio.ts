/**
 * @param gridCellRatio aspect ratio of format 'width:height' (for example '3:1')
 * @returns the ratio of width to height
 */
export function cellRatioToNumber(gridCellRatio: string): number {
    const tokens = gridCellRatio.split(':');
    return parseInt(tokens[0]) / parseInt(tokens[1]);
}
