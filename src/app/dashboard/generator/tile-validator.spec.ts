import { Column, DataType, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { TileValidator } from './tile-validator';

describe('TileValidator', () => {

  const DAY = 86_400_000;
  const T0 = new Date(2024, 0, 1).getTime();
  const LEVEL: Column = { name: 'Level', dataType: DataType.TEXT, width: 10 };
  const AMOUNT: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
  const TIME: Column = { name: 'Time', dataType: DataType.TIME, width: 10, groupingTimeUnit: TimeUnit.DAY };
  const COLUMNS = [LEVEL, AMOUNT, TIME];

  let chartDataService: ChartDataService;
  let validator: TileValidator;

  beforeEach(() => {
    chartDataService = new ChartDataService();
    validator = new TileValidator(chartDataService);
  });

  function chartOf(chartType: ChartType, dataColumns: Column[], groupByColumns: Column[], entries: object[]): ChartContext {
    const context = new ChartContext(COLUMNS, chartType.type, { top: 0, right: 0, bottom: 0, left: 0 });
    context.dataColumns = dataColumns;
    context.groupByColumns = groupByColumns;
    context.entries = entries;
    return context;
  }

  function stackedCountOverTime(entries: object[]): ChartContext {
    const context = chartOf(ChartType.LINE, [LEVEL], [TIME], entries);
    context.stacked = true;
    return context;
  }

  it('#isValid should accept chart with data', () => {

    // given
    const context = chartOf(ChartType.PIE, [LEVEL], [], [{ Level: 'INFO' }, { Level: 'WARN' }, { Level: 'INFO' }]);

    // when
    const valid = validator.isValid(context);

    // then
    expect(valid).toBe(true);
  });

  it('#isValid should reject chart with data error', () => {

    // given
    const context = chartOf(ChartType.PIE, [LEVEL], [], [{ Level: 'INFO' }]);
    vi.spyOn(chartDataService, 'createData').mockReturnValue({ error: 'failure' });

    // when
    const valid = validator.isValid(context);

    // then
    expect(valid).toBe(false);
  });

  it('#isValid should reject chart with empty datasets', () => {

    // given
    const context = chartOf(ChartType.PIE, [LEVEL], [], [{ Level: 'INFO' }]);
    vi.spyOn(chartDataService, 'createData').mockReturnValue({ data: { labels: [], datasets: [{ data: [] }] } });

    // when
    const valid = validator.isValid(context);

    // then
    expect(valid).toBe(false);
  });

  it('#isValid should reject sampled down chart', () => {

    // given
    const entries = Array.from({ length: ChartDataService.MAX_DATA_POINTS + 1 }, (_, i) => ({ Amount: i % 7, Time: T0 + i * DAY }));
    const context = chartOf(ChartType.SCATTER, [AMOUNT], [TIME], entries);
    context.aggregations = [];

    // when
    const valid = validator.isValid(context);

    // then
    expect(context.dataSampledDown).toBe(true);
    expect(valid).toBe(false);
  });

  it('#isValid should accept and unstack stacked time chart whose series have different time buckets', () => {

    // given
    const context = stackedCountOverTime([
      { Level: 'INFO', Time: T0 }, { Level: 'INFO', Time: T0 + DAY }, { Level: 'WARN', Time: T0 }
    ]);

    // when
    const valid = validator.isValid(context);

    // then
    expect(valid).toBe(true);
    expect(context.stacked).toBe(false);
  });

  it('#isValid should accept stacked time chart whose series have same time buckets', () => {

    // given
    const context = stackedCountOverTime([
      { Level: 'INFO', Time: T0 }, { Level: 'INFO', Time: T0 + DAY }, { Level: 'WARN', Time: T0 + DAY }, { Level: 'WARN', Time: T0 }
    ]);

    // when
    const valid = validator.isValid(context);

    // then
    expect(valid).toBe(true);
    expect(context.stacked).toBe(true);
  });
});
