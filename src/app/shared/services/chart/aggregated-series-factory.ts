import { Aggregation, EnumLabels } from 'app/shared/model';
import { ChartContext, DataSet } from 'app/shared/model/chart';
import { DataTypeUtils } from 'app/shared/utils';
import { Series } from 'data-forge';
import { AggregationService } from '../aggregation.service';
import { ChartDataHelper } from './chart-data-helper';
import { SeriesNameConverter } from './series-name-converter';

/**
 * creates the data series of a chart that aggregates values or counts rows per group-by value
 */
export class AggregatedSeriesFactory {

  private seriesNameConverter = new SeriesNameConverter();
  private aggregationService = new AggregationService();

  create(context: ChartContext): DataSet[] {
    const groupByColumn = context.groupByColumns[0];
    const namedGroups = new Map<string, Map<number, number[]>>();
    for (const entry of context.entries) {
      const x = ChartDataHelper.extractGroupingValue(entry, groupByColumn);
      if (x !== null && x !== undefined) {
        if (context.isRowCountSelected()) {
          this.collect(namedGroups, this.rowCountSeriesName(entry, context), x, 1);
        } else {
          context.dataColumns.forEach(c =>
            this.collect(namedGroups, this.seriesNameConverter.toSeriesName(entry, c, context.splitColumns), x, entry[c.name]));
        }
      }
    }
    const aggregation = context.getValueAggregation();
    const datasets: DataSet[] = Array.from(namedGroups, ([key, groups]) => ({
      key,
      values: Array.from(groups, ([x, values]) => ({ x, y: this.aggregate(values, aggregation) }))
    }));
    if (DataTypeUtils.isNumeric(groupByColumn.dataType)) {
      datasets.forEach(ds => ChartDataHelper.sortAscending(ds.values));
    }
    return datasets;
  }

  private rowCountSeriesName(entry: object, context: ChartContext): string | undefined {
    return context.splitColumns.length ?
      this.seriesNameConverter.toSplitName(entry, context.splitColumns) : EnumLabels.aggregation(Aggregation.ROW_COUNT);
  }

  private collect(namedGroups: Map<string, Map<number, number[]>>, seriesName: string | undefined, x: number, value: unknown): void {
    if (!seriesName) {
      return;
    }
    let groups = namedGroups.get(seriesName);
    if (!groups) {
      groups = new Map<number, number[]>();
      namedGroups.set(seriesName, groups);
    }
    if (typeof value === 'number') {
      let values = groups.get(x);
      if (!values) {
        values = [];
        groups.set(x, values);
      }
      values.push(value);
    }
  }

  private aggregate(values: number[], aggregation: Aggregation | undefined): number {
    return aggregation ? this.aggregationService.aggregateValue(new Series(values), aggregation) : values.length;
  }
}
