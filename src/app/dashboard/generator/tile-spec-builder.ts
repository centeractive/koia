import { Aggregation } from 'app/shared/model';
import { TileSignature } from './tile-signature';
import { TileSpec } from './tile-spec';

export type TileSpecFields = Pick<TileSpec, 'dataColumns' | 'aggregations' | 'size'> & Partial<Omit<TileSpec, 'signature' | 'key'>>;

export function tileSpecOf(fields: TileSpecFields): TileSpec {
  const groupByColumns = fields.groupByColumns ?? [];
  const splitColumns = fields.splitColumns ?? [];
  const columnNames = [...fields.dataColumns, ...groupByColumns, ...splitColumns].map(c => c.name);
  const countOnly = fields.aggregations.length === 1 && fields.aggregations[0] === Aggregation.COUNT;
  const signature = TileSignature.of(fields.chartType ? 'chart' : TileSignature.summaryKind(countOnly), columnNames);
  return {
    signature,
    key: TileSignature.keyOf(signature, fields.chartType?.type),
    chartType: fields.chartType,
    dataColumns: fields.dataColumns,
    groupByColumns,
    splitColumns,
    aggregations: fields.aggregations,
    valueGroupingColumn: fields.valueGroupingColumn,
    stacked: fields.stacked ?? false,
    multiValueAxes: fields.multiValueAxes ?? false,
    showLegend: fields.showLegend ?? false,
    legendPosition: fields.legendPosition ?? 'top',
    size: fields.size,
    timeChart: fields.timeChart ?? false
  };
}

export function pairsOf<T>(items: T[]): T[][] {
  return items.flatMap((p1, i) => items.slice(i + 1).map(p2 => [p1, p2]));
}
