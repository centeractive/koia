import { Column, DataType, ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { ValueGroupingGenerator } from 'app/shared/value-range/value-grouping-generator';
import { DataFrame } from 'data-forge';
import { ColumnProfile } from './column-profile';
import { TileSpec } from './tile-spec';

/**
 * creates the element contexts of tile specs and relationship graphs on fresh column clones
 */
export class TileContextFactory {

  constructor(private readonly chartMarginService: ChartMarginService,
    private readonly valueGroupingGenerator = new ValueGroupingGenerator()) { }

  createChart(spec: TileSpec, columns: Column[], entries: object[]): ChartContext {
    const context = new ChartContext(columns, spec.chartType.type, this.chartMarginService.marginOf(spec.chartType));
    context.dataColumns = this.columnsOf(spec.dataColumns, columns);
    context.aggregations = spec.aggregations;
    context.groupByColumns = this.groupByColumnsOf(spec, columns);
    context.splitColumns = this.columnsOf(spec.splitColumns, columns);
    context.multiValueAxes = spec.multiValueAxes;
    context.stacked = spec.stacked;
    context.showLegend = spec.showLegend;
    context.legendPosition = spec.legendPosition;
    context.entries = entries;
    return context;
  }

  createSummary(spec: TileSpec, columns: Column[], entries: object[]): SummaryContext {
    const context = new SummaryContext(columns);
    context.dataColumns = this.columnsOf(spec.dataColumns, columns);
    context.groupByColumns = this.groupByColumnsOf(spec, columns);
    context.aggregations = spec.aggregations;
    if (spec.valueGroupingColumn) {
      context.valueGroupings = [this.valueGroupingGenerator.createGrouping(new DataFrame(entries), spec.valueGroupingColumn.name)];
    }
    context.entries = entries;
    return context;
  }

  createGraph(groupByColumns: ColumnProfile[], columns: Column[], entries: object[]): GraphContext {
    const context = new GraphContext(columns);
    context.groupByColumns = this.columnsOf(groupByColumns, columns);
    context.entries = entries;
    return context;
  }

  applyColumnSpan(context: ElementContext, columnSpan: number): void {
    context.gridColumnSpan = columnSpan;
    context.gridRowSpan = 1;
  }

  private groupByColumnsOf(spec: TileSpec, columns: Column[]): Column[] {
    return spec.groupByColumns.map(p => {
      const column = this.columnOf(p, columns);
      if (column.dataType === DataType.TIME) {
        column.groupingTimeUnit = p.groupingTimeUnit;
      }
      return column;
    });
  }

  private columnsOf(profiles: ColumnProfile[], columns: Column[]): Column[] {
    return profiles.map(p => this.columnOf(p, columns));
  }

  private columnOf(profile: ColumnProfile, columns: Column[]): Column {
    return columns.find(c => c.name === profile.name);
  }
}
