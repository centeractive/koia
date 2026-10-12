const OFFSET_X = 15;
const OFFSET_Y = 10;

export interface Size { width: number; height: number; }
export interface Position { left: number; top: number; }

export function tooltipPosition(nodeX: number, nodeY: number, nodeRadius: number, tooltip: Size, container: Size): Position {
    let left = nodeX + nodeRadius + OFFSET_X;
    if (left + tooltip.width > container.width) {
        left = nodeX - nodeRadius - OFFSET_X - tooltip.width;
    }
    return {
        left: clamp(left, container.width - tooltip.width),
        top: clamp(nodeY - OFFSET_Y, container.height - tooltip.height)
    };
}

function clamp(value: number, max: number): number {
    return Math.max(0, Math.min(value, max));
}
