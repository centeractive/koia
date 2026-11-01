import { ChartDataset } from 'chart.js';

/**
 * @returns whether the datasets show at least two different values, or less than two values at all
 */
export function hasVaryingValues(datasets: ChartDataset[]): boolean {
  const values = datasets.flatMap(ds => (ds.data as unknown[]).map(d => typeof d === 'number' ? d : (d as { y?: unknown })?.y))
    .filter(v => typeof v === 'number');
  return values.length < 2 || new Set(values).size > 1;
}
