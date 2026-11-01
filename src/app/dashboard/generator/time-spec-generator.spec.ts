import { Aggregation, TimeUnit } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { categoryProfile as category, describeTileSpec, measureProfile as measure, SequenceRandomSource, timeProfile as time } from 'app/shared/test';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSize, TileSpec } from './tile-spec';
import { TimeSeriesInspector } from './time-series-inspector';
import { TimeSpecGenerator } from './time-spec-generator';

describe('TimeSpecGenerator', () => {

  let generator: TimeSpecGenerator;
  let inspector: TimeSeriesInspector;

  beforeEach(() => {
    generator = new TimeSpecGenerator();
    inspector = new TimeSeriesInspector([], []);
  });

  function generate(profiles: ColumnProfile[], randomValues = [0]): TileSpec[] {
    const byRole = (role: ColumnRole) => profiles.filter(p => p.role === role);
    return generator.generate(byRole(ColumnRole.CATEGORY), byRole(ColumnRole.MEASURE), byRole(ColumnRole.TIME),
      new Randomizer(new SequenceRandomSource(randomValues)), inspector);
  }

  /**
   * a day of 40 rows each, its native days aggregating values, grouped by month
   */
  function dailyTime(nativeBucketCount = 364): ColumnProfile {
    return {
      ...time('T', 40, 13, 364), presentCount: 14_560, groupingTimeUnit: TimeUnit.MONTH, nativeTimeUnit: TimeUnit.DAY, nativeBucketCount
    };
  }

  function runningTotals(...names: string[]): void {
    vi.spyOn(inspector, 'isRunningTotal').mockImplementation(n => names.includes(n.name));
  }

  function describeAggregated(spec: TileSpec): string {
    return describeTileSpec(spec) + ' ' + spec.aggregations.join() + ' ' + spec.groupByColumns[0].groupingTimeUnit;
  }

  it('#generate should create count over time charts as time charts', () => {

    // given
    const profiles = [category('A', 3), category('B', 7), time('T', 2)];

    // when
    const specs = generate(profiles, [0.9]).filter(s => s.aggregations.includes(Aggregation.COUNT));

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['line A by T split ', 'area A by T split ']);
    expect(specs.map(s => s.stacked)).toEqual([false, true]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.COUNT]);
      expect(s.showLegend).toBe(true);
      expect(s.legendPosition).toBe('top');
      expect(s.size).toBe(TileSize.WIDE);
      expect(s.timeChart).toBe(true);
    });
  });

  it('#generate should stack area charts of category counts over time', () => {

    // given
    const profiles = [category('A', 3), time('T', 2)];

    // when
    const specs = generate(profiles, [0.9]).filter(s => s.chartType === ChartType.AREA && s.dataColumns[0]?.name === 'A');

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['area A by T split ']);
    expect(specs[0].stacked).toBe(true);
  });

  it('#generate should not create count over time charts of category uniformly distributed over time', () => {

    // given
    const profiles = [category('A', 3), category('B', 3), time('T', 2)];
    vi.spyOn(inspector, 'isUniform').mockImplementation((_t, c) => c?.name === 'A');

    // when
    const specs = generate(profiles).filter(s => s.aggregations.includes(Aggregation.COUNT));

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['line B by T split ', 'area B by T split ']);
  });

  it('#generate should create values over time charts with multiple value axes for measure pairs', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), time('T', 1)];

    // when
    const specs = generate(profiles).filter(s => s.aggregations.length === 0);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual([
      'line N1 by T split ', 'area N1 by T split ',
      'line N2 by T split ', 'area N2 by T split ',
      'line N1,N2 by T split '
    ]);
    expect(specs.map(s => s.multiValueAxes)).toEqual([false, false, false, false, true]);
    expect(specs.map(s => s.showLegend)).toEqual([false, false, false, false, true]);
    specs.forEach(s => {
      expect(s.stacked).toBe(false);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create values over time charts regardless of their data points', () => {

    // given
    const profiles = [measure('N1', 5000), measure('N2', 5000), time('T', 1)];

    // when
    const specs = generate(profiles).filter(s => s.aggregations.length === 0);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual([
      'line N1 by T split ', 'area N1 by T split ',
      'line N2 by T split ', 'area N2 by T split ',
      'line N1,N2 by T split '
    ]);
  });

  it('#generate should not create values over time charts when time values repeat', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), category('S', 3), time('T', 2)];

    // when
    const specs = generate(profiles).filter(s => s.aggregations.length === 0);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should not create split area of individual values over time', () => {

    // given
    const profiles = [measure('N'), time('T', 1), category('S', 3)];

    // when
    const specs = generate(profiles).filter(s => s.chartType === ChartType.AREA && s.aggregations.length === 0);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['area N by T split ']);
  });

  it('#generate should create linear bar charts over time only when their bars fit the bar limit', () => {

    // given
    const fitting = [measure('N', 60), { ...time('T', 1, 60), presentCount: 60 }];
    const exceeding = [measure('N', 61), { ...time('T', 1, 61), presentCount: 61 }];
    const aggregating = [measure('N'), time('T', 2, TimeSpecGenerator.MAX_TIME_BARS)];
    const aggregatingExceeding = [measure('N'), time('T', 2, TimeSpecGenerator.MAX_TIME_BARS + 1)];

    // when
    const specsPerProfiles = [fitting, exceeding, aggregating, aggregatingExceeding]
      .map(profiles => generate(profiles).filter(s => s.chartType === ChartType.LINEAR_BAR));

    // then
    expect(specsPerProfiles.map(specs => specs.map(s => [describeTileSpec(s), s.aggregations]))).toEqual([
      [['linearBar N by T split ', []]],
      [],
      [['linearBar N by T split ', [Aggregation.SUM]], ['linearBar N by T split ', [Aggregation.AVG]],
        ['linearBar  by T split ', [Aggregation.ROW_COUNT]]],
      []
    ]);
    specsPerProfiles.flat().forEach(s => {
      expect(s.timeChart).toBe(true);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create aggregated values over time charts of sums and averages unsplit and split by categories within time series limit',
    () => {

      // given
      const profiles = [measure('N'), time('T', 3), category('S1', TimeSpecGenerator.MAX_TIME_SERIES),
        category('S2', TimeSpecGenerator.MAX_TIME_SERIES + 1)];

      // when
      const specs = generate(profiles).filter(s => s.aggregations.some(a => a === Aggregation.SUM || a === Aggregation.AVG));

      // then
      expect(specs.map(s => describeTileSpec(s) + ' ' + s.aggregations.join())).toEqual([
        'line N by T split  Sum', 'area N by T split  Sum', 'linearBar N by T split  Sum',
        'line N by T split  Average', 'area N by T split  Average', 'linearBar N by T split  Average',
        'line N by T split S1 Sum', 'area N by T split S1 Sum', 'linearBar N by T split S1 Sum',
        'line N by T split S1 Average', 'linearBar N by T split S1 Average'
      ]);
      expect(specs.map(s => s.stacked)).toEqual([false, false, false, false, false, false, false, true, false, false, false]);
      specs.forEach(s => {
        expect(s.showLegend).toBe(s.splitColumns.length > 0);
        expect(s.multiValueAxes).toBe(false);
        expect(s.size).toBe(TileSize.WIDE);
      });
    });

  it('#generate should create aggregated values over time charts of measure pairs with multiple value axes', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), time('T', 3, 61)];

    // when
    const specs = generate(profiles).filter(s => s.dataColumns.length === 2);

    // then
    expect(specs.map(s => describeTileSpec(s) + ' ' + s.aggregations.join())).toEqual(['line N1,N2 by T split  Sum', 'line N1,N2 by T split  Average']);
    specs.forEach(s => {
      expect(s.multiValueAxes).toBe(true);
      expect(s.showLegend).toBe(true);
    });
  });

  it('#generate should create row count over time charts with signature of time column', () => {

    // given
    const profiles = [time('T', 3)];

    // when
    const specs = generate(profiles);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['line  by T split ', 'area  by T split ', 'linearBar  by T split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.ROW_COUNT]);
      expect(s.signature).toBe('chart:T');
      expect(s.showLegend).toBe(false);
      expect(s.timeChart).toBe(true);
    });
  });

  it('#generate should not create row count over time charts of time holding uniform row counts', () => {

    // given
    vi.spyOn(inspector, 'isUniform').mockReturnValue(true);

    // when
    const specs = generate([time('T', 3)]);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should not create aggregating time charts when time buckets equal rows', () => {

    // given
    const profiles = [measure('N'), time('T', 1, 100)];

    // when
    const specs = generate(profiles).filter(s => s.aggregations.length > 0);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should not create aggregating time charts beyond maximum data points of time buckets', () => {

    // given
    const profiles = [measure('N'), { ...time('T', 2, ChartDataService.MAX_DATA_POINTS + 1), presentCount: 5000 }];

    // when
    const specs = generate(profiles).filter(s => s.aggregations.length > 0);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should aggregate running totals per native time unit only', () => {

    // given
    const profiles = [measure('R'), dailyTime(), category('S', 3)];
    runningTotals('R');

    // when
    const specs = generate(profiles).filter(s => s.dataColumns[0]?.name === 'R');

    // then
    expect(specs.map(s => describeAggregated(s))).toEqual([
      'line R by T split  Sum day', 'area R by T split  Sum day',
      'line R by T split  Average day', 'area R by T split  Average day',
      'line R by T split S Sum day', 'area R by T split S Sum day',
      'line R by T split S Average day'
    ]);
    expect(specs.map(s => s.stacked)).toEqual([false, false, false, false, false, true, false]);
  });

  it('#generate should aggregate pairs of running totals per native time unit with multiple value axes', () => {

    // given
    const profiles = [measure('R1'), measure('R2'), dailyTime()];
    runningTotals('R1', 'R2');

    // when
    const specs = generate(profiles).filter(s => s.dataColumns.length === 2);

    // then
    expect(specs.map(s => describeAggregated(s))).toEqual(['line R1,R2 by T split  Sum day', 'line R1,R2 by T split  Average day']);
    specs.forEach(s => expect(s.multiValueAxes).toBe(true));
  });

  it('#generate should keep aggregating other measures per grouping time unit next to running totals', () => {

    // given
    const profiles = [measure('R'), measure('N'), dailyTime()];
    runningTotals('R');

    // when
    const specs = generate(profiles).filter(s => s.dataColumns[0]?.name === 'N');

    // then
    expect(specs.map(s => describeAggregated(s))).toEqual([
      'line N by T split  Sum month', 'area N by T split  Sum month', 'linearBar N by T split  Sum month',
      'line N by T split  Average month', 'area N by T split  Average month', 'linearBar N by T split  Average month'
    ]);
  });

  it('#generate should only average running totals per grouping time unit when their native time units exceed maximum data points', () => {

    // given
    const profiles = [measure('R'), measure('N'), dailyTime(ChartDataService.MAX_DATA_POINTS + 100)];
    runningTotals('R');

    // when
    const specs = generate(profiles).filter(s => s.dataColumns.some(c => c.name === 'R'));

    // then
    expect(specs.map(s => describeAggregated(s))).toEqual([
      'line R by T split  Average month', 'area R by T split  Average month', 'linearBar R by T split  Average month',
      'line R,N by T split  Average month', 'linearBar R,N by T split  Average month'
    ]);
  });

  it('#runningTotalTimes should return the times aggregating running total values per native time unit', () => {

    // given
    const [r, n] = [measure('R'), measure('N')];
    const [daily, longDaily, unaggregated] = [dailyTime(), dailyTime(ChartDataService.MAX_DATA_POINTS + 1),
      { ...dailyTime(), nativeBucketCount: 14_560 }];
    runningTotals('R');

    // when
    const times = [r, n].map(m => generator.runningTotalTimes(m, [daily, longDaily, unaggregated], inspector));

    // then
    expect(times).toEqual([[daily], []]);
  });
});
