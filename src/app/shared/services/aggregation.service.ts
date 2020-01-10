import { Injectable } from '@angular/core';
import { Aggregation, ElementContext, DataType } from '../model';
import { IDataFrame, DataFrame, ISeries } from 'data-forge';
import { TimeGroupingService } from './time-grouping.service';
import { ColumnNameConverter } from '../utils';

/**
 * computes aggregated data
 */
@Injectable({
  providedIn: 'root'
})
export class AggregationService {

  private timeGroupingService = new TimeGroupingService();

  compute(data: IDataFrame<number, any>, context: ElementContext): IDataFrame<number, any> {
    let dataFrame: IDataFrame<number, any> = new DataFrame(data);
    const columns = context.groupByColumns;
    columns.push(context.dataColumns[0]);
    context.groupByColumns.filter(c => c.dataType === DataType.TIME).forEach(c =>
      dataFrame = this.timeGroupingService.groupByTimeUnit(dataFrame, c));
    const columnNames = columns.map(c => c.dataType === DataType.TIME ? ColumnNameConverter.toLabel(c, c.groupingTimeUnit) : c.name);
    if (context.aggregations[0] === Aggregation.COUNT) {
      return this.countDistinctValues(dataFrame, columnNames, context.aggregations[0]);
    } else if (columns.length === 1) {
      return this.aggregate(dataFrame, columnNames[0], context.aggregations);
    } else {
      return this.groupAndAggregate(dataFrame, columnNames.slice(0, -1), columnNames.slice(-1)[0], context.aggregations);
    }
  }

  private countDistinctValues(data: IDataFrame<number, any>, pivotColumns: string[], aggregation: Aggregation):
    IDataFrame<number, any> {
    return data.pivot(pivotColumns, aggregation, v => this.aggregateValue(v, aggregation));
  }

  private aggregate(data: IDataFrame<number, any>, numberColumn: string, aggregations: Aggregation[]): IDataFrame<number, any> {
    const namedAggregatedValues = {};
    aggregations.map(a => namedAggregatedValues[a] = this.aggregateValue(data.getSeries(numberColumn), a));
    return new DataFrame([namedAggregatedValues]);
  }

  private groupAndAggregate(data: IDataFrame<number, any>, pivotColumns: string[], numberColumn: string, aggregations: Aggregation[])
    : IDataFrame<number, any> {
    const aggregationMappings = {};
    aggregations.map(a => aggregationMappings[a] = v => this.aggregateValue(v, a));
    const aggregationSpec = { [numberColumn]: aggregationMappings };
    return data.pivot(pivotColumns, aggregationSpec);
  }

  aggregateValue(values: ISeries<number, any>, aggregation: Aggregation): number {
    switch (aggregation) {
      case Aggregation.COUNT:
        return values.count();
      case Aggregation.AVG:
        return values.average();
      case Aggregation.MEDIAN:
        return values.median();
      case Aggregation.MAX:
        return values.max();
      case Aggregation.MIN:
        return values.min();
      case Aggregation.SUM:
        return values.sum();
      default:
        throw new Error('aggregation of type ' + aggregation + ' is not yet implemented');
    }
  }
}
