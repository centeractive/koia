import { Aggregation, SummaryContext } from 'app/shared/model';
import { TableFitter } from 'app/shared/ui/table-fit/table-fitter';
import { SummaryTableSizeEstimator, TableEstimate } from 'app/summary-table/summary-table-size-estimator';
import { SUMMARY_TABLE_STYLE } from 'app/summary-table/summary-table-style';
import { GridLayout } from '../grid-layout';
import type { GenerationRequest } from './dashboard-generator';
import { GENERATED_CELL_RATIO } from './generated-grid';
import { TileContextFactory } from './tile-context-factory';
import { SizedTile, TileSize, TileSpec } from './tile-spec';

export interface PickedTable extends SizedTile {
  spec: TileSpec;
  score: number;
}

/**
 * picks the summary table and aggregation set whose estimated size best fills its tile
 */
export class SummaryTablePicker {

  static readonly MAX_CANDIDATES = 4;

  constructor(private readonly factory: TileContextFactory, private readonly estimator: SummaryTableSizeEstimator) { }

  static fillOf(content: number, available: number): number {
    return content <= available ? content / available : available / content;
  }

  /**
   * @returns the best filling of the first candidates, else the first candidate with its fewest aggregations spanning two cells
   */
  pick(candidates: TileSpec[], request: GenerationRequest, gridColumns: number): PickedTable | undefined {
    if (!candidates.length) {
      return undefined;
    }
    if (request.containerWidth <= 0) {
      return this.fallbackOf(candidates[0], request);
    }
    const layout = new GridLayout();
    layout.gridColumns = gridColumns;
    layout.gridCellRatio = GENERATED_CELL_RATIO;
    const tileOf = (columnSpan: number) => layout.tileSizeOf({ columnSpan, rowSpan: 1 }, request.containerWidth);
    const tiles = new Map([[TileSize.SMALL, tileOf(1)], [TileSize.WIDE, tileOf(2)]]);
    let best: PickedTable | undefined;
    for (const spec of candidates.slice(0, SummaryTablePicker.MAX_CANDIDATES)) {
      const context = this.factory.createSummary(spec, request.columns(), request.entries);
      const estimate = this.estimator.estimate(context);
      let bestOption: Aggregation[] | undefined;
      for (const option of this.optionsOf(spec)) {
        const width = this.widthOf(option, context, estimate);
        const size = TableFitter.hasHorizontalOverflow(width, tiles.get(TileSize.SMALL).width) ? TileSize.WIDE : TileSize.SMALL;
        const tile = tiles.get(size);
        if (TableFitter.hasHorizontalOverflow(width, tile.width)) {
          continue;
        }
        const score = SummaryTablePicker.fillOf(width, tile.width)
          * SummaryTablePicker.fillOf(estimate.height, tile.height - SUMMARY_TABLE_STYLE.scrollerInset);
        if (!best || score > best.score) {
          best = { spec, context, size, score };
          bestOption = option;
        }
      }
      if (bestOption) {
        context.aggregations = [...bestOption];
      }
    }
    return best ?? this.fallbackOf(candidates[0], request);
  }

  private optionsOf(spec: TileSpec): Aggregation[][] {
    return spec.aggregationChoices.length ? spec.aggregationChoices : [spec.aggregations];
  }

  /**
   * @returns the estimated width of the table showing the option's aggregations instead of those of the context
   */
  private widthOf(option: Aggregation[], context: SummaryContext, estimate: TableEstimate): number {
    const aggregations = context.aggregations;
    const sumOf = (selected: Aggregation[]) => selected.reduce((sum, a) => sum + estimate.aggregationWidths[aggregations.indexOf(a)], 0);
    return estimate.width - sumOf(aggregations) + sumOf(option);
  }

  private fallbackOf(spec: TileSpec, request: GenerationRequest): PickedTable {
    const context = this.factory.createSummary(spec, request.columns(), request.entries);
    context.aggregations = [...this.optionsOf(spec).reduce((fewest, o) => o.length < fewest.length ? o : fewest)];
    return { spec, context, size: TileSize.WIDE, score: 0 };
  }
}
