import { ValueRangeGroupingService } from 'app/shared/value-range';
import { IDataFrame } from 'data-forge';
import { Aggregation, SummaryContext } from '../shared/model';
import { AggregationService } from '../shared/services';

/**
 * computes the aggregated data and the overall values of the summary table
 */
export class SummaryDataComputer {

  constructor(private aggregationService: AggregationService, private valueRangeGroupingService: ValueRangeGroupingService) {
  }

  aggregate(baseDataFrame: IDataFrame<number, object>, context: SummaryContext): IDataFrame<number, object> {
    const data = this.valueRangeGroupingService.compute(baseDataFrame, context.valueGroupings);
    data.bake();
    return this.aggregationService.compute(data, context);
  }

  overallsOf(dataFrame: IDataFrame<number, object>, context: SummaryContext): number[] {
    return context.aggregations.map(a => {
      const series = dataFrame.getSeries(a);
      const aggregation = a === Aggregation.COUNT ? Aggregation.SUM : a;
      return this.aggregationService.aggregateValue(series, aggregation);
    });
  }
}
