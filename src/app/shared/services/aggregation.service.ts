import { Injectable } from '@angular/core';
import { DataFrame, IDataFrame, ISeries, Series } from 'data-forge';
import { Aggregation, Column, DataType, ElementContext } from '../model';
import { DataFrameUtils, DateTimeUtils, ObjectUtils } from '../utils';
import { AggregationKeys } from './aggregation-keys';

interface Group {
  values: unknown[];
  rows: object[];
}

/**
 * computes aggregated data
 */
@Injectable({
  providedIn: 'root'
})
export class AggregationService {

  /**
   * @returns a row per distinct values of the group-by columns (and of the data column when counting) ordered by these values, a single
   * row when there are no such columns; the rows are keyed by [[AggregationKeys]]
   */
  compute(data: IDataFrame<number, object>, context: ElementContext): IDataFrame<number, object> {
    const keys = new AggregationKeys(context);
    const dataColumnName = context.dataColumns[0].name;
    const aggregations = context.aggregations;
    const toRow = (group: Group): object => {
      const series = new Series(group.rows.map(r => ObjectUtils.ownValue(r, dataColumnName)));
      const row = {};
      keys.leading.forEach((key, i) => row[key] = group.values[i]);
      keys.aggregations.forEach((key, i) => row[key] = this.aggregateValue(series, aggregations[i]));
      return row;
    };
    const rows = data.toArray();
    if (keys.leading.length === 0) {
      return new DataFrame([toRow({ values: [], rows })]);
    }
    const groupByColumns = context.groupByColumns;
    const groups = this.groupsOf(rows, row => {
      const values = groupByColumns.map(c => this.groupValueOf(row, c));
      return keys.data === undefined ? values : [...values, ObjectUtils.ownValue(row, dataColumnName)];
    });
    return DataFrameUtils.orderBy(new DataFrame(groups.map(toRow)), keys.leading.map(key => (row: object) => row[key]), 'asc');
  }

  private groupValueOf(row: object, column: Column): unknown {
    const value = ObjectUtils.ownValue(row, column.name);
    return column.dataType === DataType.TIME && column.groupingTimeUnit ? DateTimeUtils.toBaseTime(value as number, column.groupingTimeUnit) : value;
  }

  /**
   * groups by type and value, unlike grouping by object property, values of different type (e.g. 1 and '1') are not merged;
   * null and undefined form the same empty group
   */
  private groupsOf(rows: object[], valuesOf: (row: object) => unknown[]): Group[] {
    const groups = new Map<string, Group>();
    for (const row of rows) {
      const values = valuesOf(row).map(v => v ?? undefined);
      const groupKey = JSON.stringify(values.map(v => typeof v + ':' + v));
      const group = groups.get(groupKey);
      if (group) {
        group.rows.push(row);
      } else {
        groups.set(groupKey, { values, rows: [row] });
      }
    }
    return Array.from(groups.values());
  }

  /**
   * @returns the number of values for COUNT, else the aggregation of the numbers among the values or undefined when there are none
   */
  aggregateValue(values: ISeries<number, unknown>, aggregation: Aggregation): number {
    switch (aggregation) {
      case Aggregation.COUNT:
        return values.count();
      case Aggregation.AVG:
        return this.aggregateNumbers(values, n => n.average());
      case Aggregation.MEDIAN:
        return this.aggregateNumbers(values, n => n.median());
      case Aggregation.MAX:
        return this.aggregateNumbers(values, n => n.max());
      case Aggregation.MIN:
        return this.aggregateNumbers(values, n => n.min());
      case Aggregation.SUM:
        return this.aggregateNumbers(values, n => n.sum());
      default:
        throw new Error('aggregation of type ' + aggregation + ' is not yet implemented');
    }
  }

  private aggregateNumbers(values: ISeries<number, unknown>, aggregate: (numbers: ISeries<number, number>) => number): number {
    const numbers = values.filter(v => typeof v === 'number').select(v => v as number);
    return numbers.any() ? aggregate(numbers) : undefined;
  }
}
