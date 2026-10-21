import { ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';

/**
 * identifies tiles by their kind and column set, and keys them additionally by chart type
 */
export class TileSignature {

  static of(kind: 'chart' | 'table' | 'count' | 'graph', columnNames: string[]): string {
    return kind + ':' + [...new Set(columnNames)].sort().join('|');
  }

  static ofContext(context: ElementContext): string {
    const columns = [...context.dataColumns, ...context.groupByColumns, ...context.splitColumns];
    return TileSignature.of(TileSignature.kindOf(context), columns.map(c => c.name));
  }

  static summaryKind(countSelected: boolean): 'table' | 'count' {
    return countSelected ? 'count' : 'table';
  }

  static keyOf(signature: string, chartType?: string): string {
    return signature + '#' + (chartType ?? '');
  }

  static keyOfContext(context: ElementContext): string {
    return TileSignature.keyOf(TileSignature.ofContext(context), context instanceof ChartContext ? context.chartType : undefined);
  }

  private static kindOf(context: ElementContext): 'chart' | 'table' | 'count' | 'graph' {
    if (context instanceof SummaryContext) {
      return TileSignature.summaryKind(context.isAggregationCountSelected());
    }
    return context instanceof ChartContext ? 'chart' : 'graph';
  }
}
