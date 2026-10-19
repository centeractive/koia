import { DataType } from 'app/shared/model';
import { ChartContext, DataPoint } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ChartDataset } from 'chart.js';

/**
 * accepts charts that render data without error, warning or sampling, and unstacks time series that cannot be stacked
 */
export class TileValidator {

  constructor(private readonly chartDataService: ChartDataService) { }

  isValid(context: ChartContext): boolean {
    const result = this.chartDataService.createData(context);
    if (result.error || !result.data.datasets.some(ds => ds.data.length > 0) || context.dataSampledDown) {
      return false;
    }
    if (!this.isStackable(context, result.data.datasets)) {
      context.stacked = false;
    }
    return true;
  }

  /**
   * stacked time series are drawn wrongly unless all of them have the same time buckets
   */
  private isStackable(context: ChartContext, datasets: ChartDataset[]): boolean {
    if (!context.stacked || context.groupByColumns[0]?.dataType !== DataType.TIME) {
      return true;
    }
    const xValues = datasets.map(ds => new Set((ds.data as DataPoint[]).map(p => p.x)));
    return xValues.every(xs => xs.size === xValues[0].size && [...xs].every(x => xValues[0].has(x)));
  }
}
