import { Aggregation, ElementContext } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ColumnProfile } from './column-profile';

export enum TileSize {
  SMALL = 'small',
  WIDE = 'wide',
  FEATURE = 'feature'
}

/**
 * describes a candidate tile, a summary table when chartType is undefined
 */
export interface TileSpec {
  readonly signature: string;
  readonly key: string;
  readonly chartType?: ChartType;
  readonly dataColumns: ColumnProfile[];
  readonly groupByColumns: ColumnProfile[];
  readonly splitColumns: ColumnProfile[];
  readonly aggregations: Aggregation[];
  /** aggregation sets the summary table may show instead of aggregations, each a subset of aggregations, empty when fixed */
  readonly aggregationChoices: Aggregation[][];
  readonly valueGroupingColumn?: ColumnProfile;
  readonly stacked: boolean;
  readonly multiValueAxes: boolean;
  readonly showLegend: boolean;
  readonly legendPosition: string;
  readonly size: TileSize.SMALL | TileSize.WIDE;
  readonly timeChart: boolean;
}

/**
 * a summary table or a relationship graph, never widened
 */
export interface SizedTile {
  context: ElementContext;
  size: TileSize;
}
