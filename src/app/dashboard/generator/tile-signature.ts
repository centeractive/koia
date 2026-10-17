import { ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';

/**
 * identifies tiles by their kind and column set, and keys them additionally by chart type
 */
export class TileSignature {

  static of(kind: 'chart' | 'table' | 'graph', columnNames: string[]): string {
    return kind + ':' + [...new Set(columnNames)].sort().join('|');
  }

  static ofContext(context: ElementContext): string {
    const kind = context instanceof SummaryContext ? 'table' : context instanceof ChartContext ? 'chart' : 'graph';
    const columns = [...context.dataColumns, ...context.groupByColumns, ...context.splitColumns];
    return TileSignature.of(kind, columns.map(c => c.name));
  }

  static keyOf(signature: string, chartType?: string): string {
    return signature + '#' + (chartType ?? '');
  }

  static keyOfContext(context: ElementContext): string {
    return TileSignature.keyOf(TileSignature.ofContext(context), context instanceof ChartContext ? context.chartType : undefined);
  }
}
