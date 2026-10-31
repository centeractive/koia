import { ElementContext } from '../model';
import { ColumnNameConverter, StringUtils } from '../utils';

/**
 * unique keys of the columns of the data aggregated by [[AggregationService#compute]]. Group-by columns and, when counting, the data
 * column are keyed by their name, time-grouped columns by their label "<column name> (per <time unit>)" and aggregations by their
 * name, latter two with a number suffix (e.g. "Count (2)") when the key is already taken by another column
 */
export class AggregationKeys {

  /** keys of the group-by columns in their order */
  readonly groupBy: string[];

  /** key of the data column when counting, undefined otherwise */
  readonly data: string;

  /** keys of the aggregations in their order */
  readonly aggregations: string[];

  /** keys of the group-by columns followed by the key of the data column when counting */
  readonly leading: string[];

  /** header labels of the leading columns, which unlike their keys are not necessarily unique */
  readonly leadingLabels: string[];

  /** keys of the leading columns followed by the keys of the aggregations */
  readonly all: string[];

  private readonly columnNames: Set<string>;

  constructor(context: ElementContext) {
    const groupByColumns = context.groupByColumns;
    const groupByLabels = groupByColumns.map(c => ColumnNameConverter.toLabel(c, c.groupingTimeUnit));
    this.data = context.isAggregationCountSelected() ? context.dataColumns[0]?.name : undefined;
    const dataKeys = this.data === undefined ? [] : [this.data];
    const groupByNames = groupByColumns.filter((c, i) => groupByLabels[i] === c.name).map(c => c.name);
    this.columnNames = new Set([...groupByNames, ...dataKeys]);
    const taken = new Set(this.columnNames);
    this.groupBy = groupByLabels.map((label, i) => label === groupByColumns[i].name ? label : AggregationKeys.uniqueKey(label, taken));
    this.aggregations = context.aggregations.map(a => AggregationKeys.uniqueKey(a, taken));
    this.leading = [...this.groupBy, ...dataKeys];
    this.leadingLabels = [...groupByLabels, ...dataKeys];
    this.all = [...this.leading, ...this.aggregations];
  }

  /**
   * @returns true when the key is the name of a group-by or data column, false when it is the key of a time-grouped column or an aggregation
   */
  isColumnName(key: string): boolean {
    return this.columnNames.has(key);
  }

  private static uniqueKey(name: string, taken: Set<string>): string {
    const key = StringUtils.uniqueName(name, taken);
    taken.add(key);
    return key;
  }
}
