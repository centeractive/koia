import { Aggregation, DataType, TimeUnit } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { SequenceRandomSource } from 'app/shared/test';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';
import { TileSpecGenerator } from './tile-spec-generator';

describe('TileSpecGenerator', () => {

  let generator: TileSpecGenerator;

  beforeEach(() => {
    generator = new TileSpecGenerator();
  });

  function category(name: string, distinctCount: number, maxValueCount = 10, dataType = DataType.TEXT): ColumnProfile {
    return { name, dataType, role: ColumnRole.CATEGORY, distinctCount, presentCount: 100, maxValueCount };
  }

  function measure(name: string, presentCount = 100): ColumnProfile {
    return { name, dataType: DataType.NUMBER, role: ColumnRole.MEASURE, distinctCount: 50, presentCount };
  }

  function time(name: string, maxValueCount: number, timeBucketCount = 10): ColumnProfile {
    return {
      name, dataType: DataType.TIME, role: ColumnRole.TIME, distinctCount: 50, presentCount: 100, maxValueCount,
      groupingTimeUnit: TimeUnit.DAY, timeBucketCount
    };
  }

  function counterOf(count: (name1: string, name2: string) => number): CategoryCombinationCounter {
    const counter = new CategoryCombinationCounter([]);
    vi.spyOn(counter, 'count').mockImplementation(count);
    return counter;
  }

  function productCounter(profiles: ColumnProfile[]): CategoryCombinationCounter {
    const distinctCount = (name: string) => profiles.find(p => p.name === name).distinctCount;
    return counterOf((name1, name2) => distinctCount(name1) * distinctCount(name2));
  }

  function generate(profiles: ColumnProfile[], randomValues = [0], combinations = productCounter(profiles)): TileSpec[] {
    return generator.generate(profiles, new Randomizer(new SequenceRandomSource(randomValues)), combinations);
  }

  function namesOf(profiles: ColumnProfile[]): string {
    return profiles.map(p => p.name).join(',');
  }

  function describeSpec(spec: TileSpec): string {
    return (spec.chartType?.type ?? 'table') + ' ' + namesOf(spec.dataColumns) + ' by ' + namesOf(spec.groupByColumns)
      + ' split ' + namesOf(spec.splitColumns);
  }

  function isTable(spec: TileSpec): boolean {
    return spec.chartType === undefined;
  }

  it('#generate should create distribution charts of chart types matching category count', () => {

    // when
    const specsPerCount = [2, 8, 10, 25].map(d => generate([category('C', d)], [0.5]));

    // then
    expect(specsPerCount.map(specs => specs.map(s => s.chartType))).toEqual([
      [ChartType.PIE, ChartType.DOUGHNUT, ChartType.POLAR_AREA, ChartType.BAR, ChartType.HORIZONTAL_BAR],
      [ChartType.PIE, ChartType.DOUGHNUT, ChartType.POLAR_AREA, ChartType.RADAR, ChartType.BAR, ChartType.HORIZONTAL_BAR],
      [ChartType.RADAR, ChartType.BAR, ChartType.HORIZONTAL_BAR],
      [ChartType.HORIZONTAL_BAR]
    ]);
    expect(specsPerCount[1].map(s => [s.showLegend, s.legendPosition])).toEqual([
      [true, 'right'], [true, 'right'], [true, 'right'], [false, 'top'], [false, 'top'], [false, 'top']
    ]);
    specsPerCount.flat().forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.COUNT]);
      expect(s.groupByColumns).toEqual([]);
      expect(s.size).toBe(TileSize.SMALL);
      expect(s.timeChart).toBe(false);
    });
  });

  it('#generate should create no distribution chart for category exceeding maximum horizontal bar categories', () => {

    // when
    const specs = generate([category('C', 31)]);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should create crosstab charts for category pairs within series and axis limits', () => {

    // given
    const profiles = [category('A', 3), category('B', 12), category('C', 7), category('D', 13)];

    // when
    const specs = generate(profiles).filter(s => [ChartType.LINEAR_BAR, ChartType.LINEAR_HORIZONTAL_BAR].includes(s.chartType));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'linearBar A by B split ', 'linearHorizontalBar A by B split ',
      'linearBar A by C split ', 'linearHorizontalBar A by C split '
    ]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.COUNT]);
      expect(s.stacked).toBe(true);
      expect(s.showLegend).toBe(true);
      expect(s.legendPosition).toBe('top');
      expect(s.size).toBe(TileSize.SMALL);
    });
  });

  it('#generate should not group category crosstab charts by boolean column', () => {

    // given
    const profiles = [category('A', 2), category('Done', 2, 10, DataType.BOOLEAN)];

    // when
    const specs = generate(profiles).filter(s => s.chartType === ChartType.LINEAR_BAR);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['linearBar Done by A split ']);
  });

  it('#generate should create count over time charts as time charts', () => {

    // given
    const profiles = [category('A', 3), category('B', 7), time('T', 2)];

    // when
    const specs = generate(profiles, [0.9]).filter(s => s.timeChart && s.aggregations.includes(Aggregation.COUNT));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['line A by T split ', 'area A by T split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.COUNT]);
      expect(s.stacked).toBe(false);
      expect(s.showLegend).toBe(true);
      expect(s.legendPosition).toBe('top');
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create values over time charts with multiple value axes for measure pairs', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), time('T', 1)];

    // when
    const specs = generate(profiles).filter(s => s.timeChart && s.aggregations.length === 0);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'line N1 by T split ', 'area N1 by T split ',
      'line N2 by T split ', 'area N2 by T split ',
      'line N1,N2 by T split ', 'area N1,N2 by T split '
    ]);
    expect(specs.map(s => s.multiValueAxes)).toEqual([false, false, false, false, true, true]);
    expect(specs.map(s => s.showLegend)).toEqual([false, false, false, false, true, true]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([]);
      expect(s.stacked).toBe(false);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should not create values over time charts when time values repeat', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), category('S', 3), time('T', 2)];

    // when
    const specs = generate(profiles).filter(s => s.timeChart && s.aggregations.length === 0);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should create values over time and scatter charts unsplit and split by each low cardinality category', () => {

    // given
    const profiles = [measure('N'), time('T', 1), category('S1', 3), category('S2', 6), category('S3', 7)];

    // when
    const specs = generate(profiles).filter(s => !isTable(s) && s.aggregations.length === 0);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'line N by T split ', 'area N by T split ',
      'line N by T split S1', 'area N by T split S1',
      'line N by T split S2', 'area N by T split S2',
      'scatter N by T split ', 'scatter N by T split S1', 'scatter N by T split S2'
    ]);
    specs.forEach(s => {
      expect(s.stacked).toBe(false);
      expect(s.multiValueAxes).toBe(false);
      expect(s.showLegend).toBe(s.splitColumns.length > 0);
      expect(s.legendPosition).toBe('top');
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should not create scatter specs whose series may exceed maximum data points', () => {

    // given
    const profiles = [measure('N1', 1001), measure('N2', 500), time('T', 1), category('S1', 3, 1000), category('S2', 4, 1001)];

    // when
    const specs = generate(profiles).filter(s => s.chartType === ChartType.SCATTER);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'scatter N1 by T split S1', 'scatter N1 by N2 split S1',
      'scatter N2 by T split ', 'scatter N2 by T split S1', 'scatter N2 by T split S2',
      'scatter N2 by N1 split ', 'scatter N2 by N1 split S1', 'scatter N2 by N1 split S2'
    ]);
  });

  it('#generate should create scatter charts of measure by other measure and time', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), time('T', 2)];

    // when
    const specs = generate(profiles).filter(s => s.chartType === ChartType.SCATTER);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'scatter N1 by T split ', 'scatter N1 by N2 split ', 'scatter N2 by T split ', 'scatter N2 by N1 split '
    ]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([]);
      expect(s.showLegend).toBe(false);
      expect(s.timeChart).toBe(false);
    });
  });

  it('#generate should create summary tables of measure grouped by categories within row limit', () => {

    // given
    const profiles = [measure('N'), category('C1', 4), category('C2', 6), category('C3', 25), category('C4', 3)];

    // when
    const specs = generate(profiles, [0.5]).filter(s => isTable(s) && !s.aggregations.includes(Aggregation.COUNT));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'table N by C1 split ', 'table N by C2 split ', 'table N by C4 split ',
      'table N by C1,C2 split ', 'table N by C4,C1 split ', 'table N by C4,C2 split '
    ]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual(TileSpecGenerator.AGGREGATION_SETS[2]);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create summary table of measure over time within bucket limit', () => {

    // given
    const profiles = [measure('N'), time('T1', 2, 36), time('T2', 2, 37)];

    // when
    const specs = generate(profiles).filter(s => isTable(s));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['table N by T1 split ']);
    expect(specs[0].aggregations).toEqual(TileSpecGenerator.AGGREGATION_SETS[0]);
  });

  it('#generate should create category crosstab summary table', () => {

    // given
    const profiles = [category('A', 6), category('B', 4), category('C', 5)];

    // when
    const specs = generate(profiles).filter(s => isTable(s));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['table A by B split ', 'table A by C split ', 'table C by B split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.COUNT]);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create category crosstab summary table of combinations within limit although product exceeds it', () => {

    // given
    const profiles = [category('A', 10), category('B', 10)];

    // when
    const specs = generate(profiles, [0], counterOf(() => TileSpecGenerator.MAX_HIERARCHY_ROWS)).filter(s => isTable(s));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['table B by A split ']);
  });

  it('#generate should not create hierarchy summary tables of combinations exceeding limit', () => {

    // given
    const profiles = [measure('N'), category('A', 4), category('B', 5)];

    // when
    const specs = generate(profiles, [0], counterOf(() => TileSpecGenerator.MAX_HIERARCHY_ROWS + 1)).filter(s => isTable(s));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'table N by A split ', 'table N by B split ', 'table N by A split ', 'table N by B split '
    ]);
  });

  it('#generate should never combine column with itself', () => {

    // given
    const profiles = [measure('R'), category('R', 6, 10, DataType.NUMBER), category('C', 3), time('T', 1)];

    // when
    const specs = generate(profiles);

    // then
    expect(specs.length).toBeGreaterThan(0);
    specs.forEach(s => {
      const names = [...s.dataColumns, ...s.groupByColumns, ...s.splitColumns].map(c => c.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });

  it('#generate should create distribution and crosstab charts of ordinal category', () => {

    // given
    const profiles = [category('Rating', 6, 50, DataType.NUMBER), category('Food', 5)];

    // when
    const specs = generate(profiles).filter(s => !isTable(s) && s.dataColumns[0].name === 'Rating');

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'pie Rating by  split ', 'doughnut Rating by  split ', 'polarArea Rating by  split ', 'radar Rating by  split ',
      'bar Rating by  split ', 'horizontalBar Rating by  split ',
      'linearBar Rating by Food split ', 'linearHorizontalBar Rating by Food split '
    ]);
  });

  it('#generate should create values over time charts regardless of their data points', () => {

    // given
    const profiles = [measure('N1', 5000), measure('N2', 5000), time('T', 1)];

    // when
    const specs = generate(profiles).filter(s => s.timeChart && s.aggregations.length === 0);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'line N1 by T split ', 'area N1 by T split ',
      'line N2 by T split ', 'area N2 by T split ',
      'line N1,N2 by T split ', 'area N1,N2 by T split '
    ]);
  });

  it('#generate should create aggregated values over time charts unsplit and split by categories within time series limit', () => {

    // given
    const profiles = [measure('N'), time('T', 3), category('S1', TileSpecGenerator.MAX_TIME_SERIES),
      category('S2', TileSpecGenerator.MAX_TIME_SERIES + 1)];

    // when
    const specs = generate(profiles).filter(s => s.timeChart && s.aggregations.includes(Aggregation.SUM));

    // then
    expect(specs.map(s => describeSpec(s))).toEqual([
      'line N by T split ', 'area N by T split ',
      'line N by T split S1', 'area N by T split S1'
    ]);
    expect(specs.map(s => s.showLegend)).toEqual([false, false, true, true]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.SUM]);
      expect(s.multiValueAxes).toBe(false);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create row count over time charts with signature of time column', () => {

    // given
    const profiles = [time('T', 3)];

    // when
    const specs = generate(profiles);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['line  by T split ', 'area  by T split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.ROW_COUNT]);
      expect(s.signature).toBe('chart:T');
      expect(s.showLegend).toBe(false);
      expect(s.timeChart).toBe(true);
    });
  });

  it('#generate should not create aggregating time charts when time buckets equal rows', () => {

    // given
    const profiles = [measure('N'), time('T', 1, 100)];

    // when
    const specs = generate(profiles).filter(s => s.timeChart && s.aggregations.length > 0);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should not create aggregating time charts beyond maximum data points of time buckets', () => {

    // given
    const profiles = [measure('N'), { ...time('T', 2, ChartDataService.MAX_DATA_POINTS + 1), presentCount: 5000 }];

    // when
    const specs = generate(profiles).filter(s => s.timeChart && s.aggregations.length > 0);

    // then
    expect(specs).toEqual([]);
  });

  it('#generate should create value range summary table', () => {

    // given
    const n = measure('N');
    const profiles = [n, category('C1', 8), category('C2', 9)];

    // when
    const specs = generate(profiles).filter(s => s.valueGroupingColumn);

    // then
    expect(specs.map(s => describeSpec(s))).toEqual(['table N by C1 split ']);
    expect(specs[0].valueGroupingColumn).toBe(n);
    expect(specs[0].aggregations).toEqual([Aggregation.COUNT]);
    expect(specs[0].size).toBe(TileSize.WIDE);
  });

  it('#generate should never combine count with value aggregations', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), category('C', 3), category('B', 2, 10, DataType.BOOLEAN), time('T', 1)];

    // when
    const specs = generate(profiles, [0.1, 0.4, 0.7, 0.9]);

    // then
    expect(specs.length).toBeGreaterThan(0);
    specs
      .filter(s => s.aggregations.includes(Aggregation.COUNT))
      .forEach(s => expect(s.aggregations).toEqual([Aggregation.COUNT]));
  });

  it('#generate should create every spec with signature of its columns', () => {

    // given
    const profiles = [measure('N1'), measure('N2'), category('C', 3), category('B', 2, 10, DataType.BOOLEAN), time('T', 1)];

    // when
    const specs = generate(profiles);

    // then
    expect(specs.length).toBeGreaterThan(0);
    specs.forEach(s => {
      const columnNames = [...s.dataColumns, ...s.groupByColumns, ...s.splitColumns].map(c => c.name);
      const kind = isTable(s) ? s.aggregations.join() === Aggregation.COUNT ? 'count' : 'table' : 'chart';
      const signature = TileSignature.of(kind, columnNames);
      expect(s.signature).toBe(signature);
      expect(s.key).toBe(TileSignature.keyOf(signature, s.chartType?.type));
    });
  });

  it('#generate should create no specs without profiles', () => {

    // when
    const specs = generate([]);

    // then
    expect(specs).toEqual([]);
  });
});
