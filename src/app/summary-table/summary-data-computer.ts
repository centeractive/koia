import { ValueRangeGroupingService } from 'app/shared/value-range';
import { IDataFrame } from 'data-forge';
import { Aggregation, SummaryContext } from '../shared/model';
import { AggregationService } from '../shared/services';

export interface SummaryData {
  /** aggregated data keyed by [[AggregationKeys]] */
  dataFrame: IDataFrame<number, object>;
  /** value of each aggregation over all rows */
  overalls: number[];
}

/**
 * computes the aggregated data and the overall values of the summary table
 */
export class SummaryDataComputer {

  constructor(private aggregationService: AggregationService, private valueRangeGroupingService: ValueRangeGroupingService) {
  }

  compute(baseDataFrame: IDataFrame<number, object>, context: SummaryContext): SummaryData {
    const data = this.valueRangeGroupingService.compute(baseDataFrame, context.valueGroupings).bake();
    const dataColumnName = context.dataColumns[0].name;
    const overalls = context.aggregations.map(a => a === Aggregation.COUNT ? data.count()
      : this.aggregationService.aggregateValue(data.getSeries(dataColumnName), a));
    return { dataFrame: this.aggregationService.compute(data, context), overalls };
  }
}
