import { ChartType } from 'app/shared/model/chart';
import { TileSpec } from './tile-spec';

/**
 * picks the next chart spec to validate, preferring chart types not used yet
 */
export class ChartSpecPicker {

  /**
   * @returns the first ranked chart spec of an unused chart type that is neither accepted nor rejected, else the first such
   * spec of any chart type
   */
  next(ranked: TileSpec[], accepted: Set<string>, rejected: Set<TileSpec>, usedChartTypes: Set<ChartType>): TileSpec | undefined {
    const candidates = ranked.filter(s => s.chartType && !accepted.has(s.signature) && !rejected.has(s));
    return candidates.find(s => !usedChartTypes.has(s.chartType)) ?? candidates[0];
  }
}
