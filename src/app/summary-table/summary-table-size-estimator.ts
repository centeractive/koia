import { LocalizedNumberPipe } from 'app/shared/pipes';
import { LanguageService } from 'app/shared/services/language';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { TableFitter } from 'app/shared/ui/table-fit/table-fitter';
import { TextMeasurer } from 'app/shared/ui/table-fit/text-measurer';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame } from 'data-forge';
import { SummaryContext } from '../shared/model';
import { AggregationService } from '../shared/services';
import { SummaryDataComputer } from './summary-data-computer';
import { CellStyle, fontOf, SUMMARY_TABLE_STYLE } from './summary-table-style';
import { SummaryValueFormatter } from './summary-value-formatter';

export interface TableEstimate {
  width: number;
  height: number;
  /** width of the column of each aggregation of the context */
  aggregationWidths: number[];
}

/**
 * estimates the natural content size of a summary table before it is rendered
 */
export class SummaryTableSizeEstimator {

  private readonly headerMeasurer = measurerOf(SUMMARY_TABLE_STYLE.header);
  private readonly cellMeasurer = measurerOf(SUMMARY_TABLE_STYLE.cell);
  private readonly footerMeasurer = measurerOf(SUMMARY_TABLE_STYLE.footer);

  constructor(private dataComputer = new SummaryDataComputer(new AggregationService(), new ValueRangeGroupingService()),
    private valueFormatter = new SummaryValueFormatter()) {
  }

  estimate(context: SummaryContext): TableEstimate {
    const frame = this.dataComputer.aggregate(new DataFrame(context.entries), context).bake();
    const overalls = this.dataComputer.overallsOf(frame, context);
    const rows = frame.toArray();
    const names = frame.getColumnNames();
    const aggregations = context.aggregations;
    const leading = names.length - aggregations.length;
    const groupByColumns = context.groupByColumns;
    const localeId = LanguageService.localeId();
    const leadingWidths = names.slice(0, leading).map((name, i) => this.columnWidth(name,
      rows.map(r => String(this.valueFormatter.format(groupByColumns, i, r[name]) ?? '')),
      i === leading - 1 ? LanguageService.instant('summary.overall') : ''));
    const aggregationWidths = aggregations.map((a, j) => this.columnWidth(LanguageService.instant('summary.aggregation.' + a),
      rows.map(r => LocalizedNumberPipe.format(r[a], localeId) ?? ''),
      LocalizedNumberPipe.format(overalls[j], localeId) ?? ''));
    const { headerHeight, firstRowHeight, rowHeight, footerHeight, marginRight } = SUMMARY_TABLE_STYLE;
    return {
      width: TableFitter.contentWidth(DomMetrics.scrollbarWidth(), leadingWidths.concat(aggregationWidths)) + marginRight,
      height: headerHeight + firstRowHeight + (rows.length - 1) * rowHeight + footerHeight,
      aggregationWidths
    };
  }

  private columnWidth(header: string, cells: string[], footer: string): number {
    const { header: headerStyle, cell: cellStyle, footer: footerStyle, sortArrowWidth } = SUMMARY_TABLE_STYLE;
    const headerWidth = this.headerMeasurer.width(header) + headerStyle.horizontalPadding + sortArrowWidth;
    const cellsWidth = cells.reduce((max, c) => Math.max(max, this.cellMeasurer.width(c) + cellStyle.horizontalPadding), 0);
    const footerWidth = this.footerMeasurer.width(footer) + footerStyle.horizontalPadding;
    return Math.ceil(Math.max(headerWidth, cellsWidth, footerWidth));
  }
}

function measurerOf(style: CellStyle): TextMeasurer {
  return new TextMeasurer(fontOf(style), style.letterSpacing + 'px');
}
