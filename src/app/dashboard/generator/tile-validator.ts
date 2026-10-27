import { DataType } from 'app/shared/model';
import { ChartContext, ChartType, DataPoint } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ChartDataset } from 'chart.js';

/**
 * accepts charts that render data without error, sampled down only when they are lines or areas over time or scatters, and
 * unstacks time series that cannot be stacked, except areas, which are rejected
 */
export class TileValidator {

  private static readonly SAMPLEABLE_TIME_CHART_TYPES = [ChartType.LINE.type, ChartType.AREA.type];

  constructor(private readonly chartDataService: ChartDataService) { }

  isValid(context: ChartContext): boolean {
    const result = this.chartDataService.createData(context);
    if (result.error || !result.data.datasets.some(ds => ds.data.length > 0)
      || (context.dataSampledDown && !this.isSampleable(context))) {
      return false;
    }
    if (this.isStackable(context, result.data.datasets)) {
      return true;
    }
    if (context.chartType === ChartType.AREA.type) {
      return false;
    }
    context.stacked = false;
    return true;
  }

  private isSampleable(context: ChartContext): boolean {
    return context.chartType === ChartType.SCATTER.type
      || (TileValidator.SAMPLEABLE_TIME_CHART_TYPES.includes(context.chartType) && this.isGroupedByTime(context));
  }

  /**
   * stacked time series are drawn wrongly unless all of them have the same time buckets
   */
  private isStackable(context: ChartContext, datasets: ChartDataset[]): boolean {
    if (!context.stacked || !this.isGroupedByTime(context)) {
      return true;
    }
    const xValues = datasets.map(ds => new Set((ds.data as DataPoint[]).map(p => p.x)));
    return xValues.every(xs => xs.size === xValues[0].size && [...xs].every(x => xValues[0].has(x)));
  }

  private isGroupedByTime(context: ChartContext): boolean {
    return context.groupByColumns[0]?.dataType === DataType.TIME;
  }
}
