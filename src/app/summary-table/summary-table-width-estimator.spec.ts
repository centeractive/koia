import { DatePipe } from '@angular/common';
import { Aggregation, Column, DataType, SummaryContext, TimeUnit } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { TextMeasurer } from 'app/shared/ui/table-fit/text-measurer';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { DataFrame } from 'data-forge';
import { AggregationService } from '../shared/services';
import { SummaryDataComputer } from './summary-data-computer';
import { fontOf, SUMMARY_TABLE_STYLE } from './summary-table-style';
import { SummaryTableWidthEstimator } from './summary-table-width-estimator';

describe('SummaryTableWidthEstimator', () => {

  const scrollbarWidth = 15;
  const columns: Column[] = [
    { name: 't1', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 't2', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'n1', dataType: DataType.NUMBER, width: 80, indexed: true },
    { name: 'Very Long Column Name', dataType: DataType.TEXT, width: 60, indexed: true },
    { name: 'T', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.SECOND, indexed: true }
  ];
  const headerMeasurer = new TextMeasurer(fontOf(SUMMARY_TABLE_STYLE.header));
  const cellMeasurer = new TextMeasurer(fontOf(SUMMARY_TABLE_STYLE.cell));
  const footerMeasurer = new TextMeasurer(fontOf(SUMMARY_TABLE_STYLE.footer), SUMMARY_TABLE_STYLE.footer.letterSpacing + 'px');
  const estimator = new SummaryTableWidthEstimator();
  let context: SummaryContext;

  beforeEach(() => {
    vi.spyOn(DomMetrics, 'scrollbarWidth').mockReturnValue(scrollbarWidth);
    context = new SummaryContext(columns);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('#estimate should sum rounded up widest text of each column plus paddings, sort arrow, margin and scrollbar', () => {

    // given
    context.entries = [
      { t1: 'short', t2: 'a considerably longer text' },
      { t1: 'a much longer text value', t2: 'x' }
    ];
    context.groupByColumns = [findColumn('t1')];
    context.dataColumns = [findColumn('t2')];

    // when
    const width = estimator.estimate(context);

    // then
    const expected = cellWidth('a much longer text value') + cellWidth('a considerably longer text') + headerWidth('Count')
      + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth;
    expect(width).toBe(expected);
  });

  it('#estimate should take header width when header is wider than values', () => {

    // given
    context.entries = [{ 'Very Long Column Name': 'x' }];
    context.dataColumns = [findColumn('Very Long Column Name')];

    // when
    const width = estimator.estimate(context);

    // then
    const expected = headerWidth('Very Long Column Name') + headerWidth('Count') + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth;
    expect(width).toBe(expected);
  });

  it('#estimate should include overall label in footer of last leading column', () => {

    // given
    context.entries = [{ t1: 'a' }, { t1: null }];
    context.dataColumns = [findColumn('t1')];

    // when
    const width = estimator.estimate(context);

    // then
    const expected = footerWidth('Overall') + headerWidth('Count') + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth;
    expect(width).toBe(expected);
  });

  it('#estimate should format time group values like summary table', () => {

    // given
    const time = new Date(2026, 9, 17, 10, 15, 30).getTime();
    context.entries = [{ T: time, t1: 'a' }];
    context.groupByColumns = [findColumn('T')];
    context.dataColumns = [findColumn('t1')];

    // when
    const width = estimator.estimate(context);

    // then
    const formattedTime = new DatePipe('en-US').transform(time, 'd MMM yyyy HH:mm:ss');
    const expected = cellWidth(formattedTime) + footerWidth('Overall') + headerWidth('Count') + SUMMARY_TABLE_STYLE.marginRight
      + scrollbarWidth;
    expect(width).toBe(expected);
  });

  it('#estimate should measure translated aggregation headers', () => {

    // given
    const instant = LanguageService.instant;
    vi.spyOn(LanguageService, 'instant').mockImplementation(key => key === 'summary.aggregation.Count' ? 'Translated Count Header' : instant(key));
    context.entries = [{ t1: 'a' }];
    context.dataColumns = [findColumn('t1')];

    // when
    const width = estimator.estimate(context);

    // then
    const expected = footerWidth('Overall') + headerWidth('Translated Count Header') + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth;
    expect(width).toBe(expected);
  });

  it('#estimate should measure footer in footer font', () => {

    // given
    context.entries = [{ t1: 'a', n1: 111_111_111 }, { t1: 'b', n1: 111_111_111 }];
    context.groupByColumns = [findColumn('t1')];
    context.dataColumns = [findColumn('n1')];
    context.aggregations = [Aggregation.SUM];

    // when
    const width = estimator.estimate(context);

    // then
    const expected = footerWidth('Overall') + footerWidth('222,222,222') + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth;
    expect(width).toBe(expected);
  });

  it('#estimate should not change context', () => {

    // given
    context.entries = [{ t1: 'a', t2: 'x' }];
    context.groupByColumns = [findColumn('t1')];
    context.dataColumns = [findColumn('t2')];

    // when
    estimator.estimate(context);

    // then
    expect(context.groupByColumns).toEqual([findColumn('t1')]);
    expect(context.dataColumns).toEqual([findColumn('t2')]);
    expect(context.aggregations).toEqual([Aggregation.COUNT]);
  });

  it('#estimate should measure missing aggregated values as empty', () => {

    // given
    const dataComputer = new SummaryDataComputer(new AggregationService(), new ValueRangeGroupingService());
    vi.spyOn(dataComputer, 'aggregate').mockReturnValue(new DataFrame([{ t1: 'a', Average: null }]));
    vi.spyOn(dataComputer, 'overallsOf').mockReturnValue([null]);
    context.entries = [{ t1: 'a', n1: null }];
    context.groupByColumns = [findColumn('t1')];
    context.dataColumns = [findColumn('n1')];
    context.aggregations = [Aggregation.AVG];

    // when
    const width = new SummaryTableWidthEstimator(dataComputer).estimate(context);

    // then
    const expected = footerWidth('Overall') + headerWidth('Average') + SUMMARY_TABLE_STYLE.marginRight + scrollbarWidth;
    expect(width).toBe(expected);
  });

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }

  function headerWidth(text: string): number {
    return Math.ceil(headerMeasurer.width(text) + SUMMARY_TABLE_STYLE.header.horizontalPadding + SUMMARY_TABLE_STYLE.sortArrowWidth);
  }

  function cellWidth(text: string): number {
    return Math.ceil(cellMeasurer.width(text) + SUMMARY_TABLE_STYLE.cell.horizontalPadding);
  }

  function footerWidth(text: string): number {
    return Math.ceil(footerMeasurer.width(text) + SUMMARY_TABLE_STYLE.footer.horizontalPadding);
  }
});
