import { ChartType } from 'app/shared/model/chart';
import { TileSpec } from './tile-spec';

/**
 * picks the next chart spec to validate, preferring chart types not used yet
 */
export class ChartSpecPicker {

  /**
   * @returns the first ranked chart spec of an unused chart type that is neither accepted nor rejected, else the first such
   * spec of any chart type but the excluded ones
   */
  next(ranked: TileSpec[], accepted: Set<string>, rejected: Set<TileSpec>, usedChartTypes: Set<ChartType>,
    excludedChartTypes = new Set<ChartType>()): TileSpec | undefined {
    return this.pick(ranked.filter(s => s.chartType && !accepted.has(s.signature) && !rejected.has(s)
      && !excludedChartTypes.has(s.chartType)), usedChartTypes);
  }

  /**
   * @returns the first ranked chart spec of an unused chart type that has an accepted signature but neither an accepted key nor
   * was rejected, else the first such spec of any chart type
   */
  nextVariant(ranked: TileSpec[], chartSignatures: Set<string>, acceptedKeys: Set<string>, rejected: Set<TileSpec>,
    usedChartTypes: Set<ChartType>): TileSpec | undefined {
    return this.pick(ranked.filter(s => s.chartType && chartSignatures.has(s.signature) && !acceptedKeys.has(s.key) && !rejected.has(s)),
      usedChartTypes);
  }

  private pick(candidates: TileSpec[], usedChartTypes: Set<ChartType>): TileSpec | undefined {
    return candidates.find(s => !usedChartTypes.has(s.chartType)) ?? candidates[0];
  }
}
