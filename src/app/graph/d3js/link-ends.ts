import { SimulationNodeDatum } from 'd3';

export interface LinkEnds { x1: number; y1: number; x2: number; y2: number; }

export function linkEnds(source: SimulationNodeDatum, target: SimulationNodeDatum, sourceRadius: number, targetRadius: number): LinkEnds {
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy);
    if (distance <= sourceRadius + targetRadius) {
        return { x1: source.x, y1: source.y, x2: source.x, y2: source.y };
    }
    return {
        x1: source.x + dx / distance * sourceRadius,
        y1: source.y + dy / distance * sourceRadius,
        x2: target.x - dx / distance * targetRadius,
        y2: target.y - dy / distance * targetRadius
    };
}
