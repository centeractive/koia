import { Aggregation, DataType } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { categoryProfile as category, combinationCounterOf, describeTileSpec, measureProfile as measure, timeProfile as time } from 'app/shared/test';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile } from './column-profile';
import { RunningTotalSpecGenerator } from './running-total-spec-generator';
import { SummarySpecGenerator } from './summary-spec-generator';
import { TileSize, TileSpec } from './tile-spec';
import { MAX_AXIS_CATEGORIES, MAX_SERIES } from './tile-spec-builder';
import { TimeSeriesInspector } from './time-series-inspector';

describe('RunningTotalSpecGenerator', () => {

  const R = measure('R');
  const generator = new RunningTotalSpecGenerator(new SummarySpecGenerator());
  let inspector: TimeSeriesInspector;

  beforeEach(() => {
    inspector = new TimeSeriesInspector([], []);
    vi.spyOn(inspector, 'isComplete').mockReturnValue(true);
  });

  /**
   * counts the values of a category, and the combinations of two categories as the product of their distinct counts
   */
  function counterOf(categories: ColumnProfile[], combinationCount?: number): CategoryCombinationCounter {
    const distinctCount = (name: string) => categories.find(c => c.name === name).distinctCount;
    return combinationCounterOf((name1, name2) => name1 === name2 ? distinctCount(name1) : combinationCount ?? distinctCount(name1) * distinctCount(name2));
  }

  function generate(series: ColumnProfile[] | undefined, times: ColumnProfile[], combinations = counterOf(series ?? [])): TileSpec[] {
    vi.spyOn(inspector, 'seriesKeyCategoriesOf').mockReturnValue(series);
    return generator.generate([{ measure: R, times }], [...series ?? [], category('Other', 2)], combinations, inspector);
  }

  function descriptionsOf(specs: TileSpec[]): string[] {
    return specs.map(s => describeTileSpec(s));
  }

  it('#generate should create no specs of running totals without series key categories or of more than two', () => {

    // when
    const specs = [generate(undefined, [time('T', 1, 2)]), generate([category('A', 2), category('B', 2), category('C', 2)], [time('T', 1, 2)])];

    // then
    expect(specs).toEqual([[], []]);
  });

  it('#generate should pass the running total and categories to the inspector', () => {

    // given
    const seriesSpy = vi.spyOn(inspector, 'seriesKeyCategoriesOf').mockReturnValue(undefined);
    const categories = [category('C', 2)];

    // when
    generator.generate([{ measure: R, times: [] }], categories, counterOf(categories), inspector);

    // then
    expect(seriesSpy).toHaveBeenCalledWith(R, categories);
  });

  it('#generate should create period tables of the minimum and maximum of a single series within the time bucket limit', () => {

    // given
    const times = [time('T', 1, SummarySpecGenerator.MAX_TIME_BUCKETS), time('U', 1, SummarySpecGenerator.MAX_TIME_BUCKETS + 1)];

    // when
    const specs = generate([], times);

    // then
    expect(descriptionsOf(specs)).toEqual(['table R by T split ']);
    expect(specs[0].aggregations).toEqual([Aggregation.MIN, Aggregation.MAX]);
    expect(specs[0].aggregationChoices).toEqual([[Aggregation.MIN, Aggregation.MAX], [Aggregation.MAX]]);
    expect(specs[0].size).toBe(TileSize.WIDE);
  });

  it('#generate should create latest value table, period tables within the hierarchy row limit and unstacked bars of one category', () => {

    // given
    const c = category('C', 3);
    const times = [time('T', 1, SummarySpecGenerator.MAX_HIERARCHY_ROWS / 3), time('U', 1, SummarySpecGenerator.MAX_HIERARCHY_ROWS / 3 + 1)];

    // when
    const specs = generate([c], times);

    // then
    expect(descriptionsOf(specs)).toEqual(['table R by C split ', 'table R by C,T split ', 'linearBar R by C split ', 'linearHorizontalBar R by C split ']);
    expect(specs[0].aggregations).toEqual([Aggregation.MAX]);
    expect(specs[0].aggregationChoices).toEqual([]);
    expect(specs[1].aggregations).toEqual([Aggregation.MIN, Aggregation.MAX]);
    specs.slice(2).forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.MAX]);
      expect(s.stacked).toBe(false);
      expect(s.showLegend).toBe(false);
      expect(s.size).toBe(TileSize.SMALL);
    });
  });

  it('#generate should create the latest value table of one category only within the table row limit', () => {

    // when
    const specs = [SummarySpecGenerator.MAX_TABLE_ROWS, SummarySpecGenerator.MAX_TABLE_ROWS + 1]
      .map(d => generate([category('C', d)], [time('T', 1, 2)]).filter(s => !s.chartType));

    // then
    expect(specs.map(s => descriptionsOf(s))).toEqual([['table R by C split ', 'table R by C,T split '], []]);
  });

  it('#generate should count missing values as values of one category', () => {

    // given
    const c = category('C', SummarySpecGenerator.MAX_TABLE_ROWS);

    // when
    const specs = generate([c], [], combinationCounterOf(() => SummarySpecGenerator.MAX_TABLE_ROWS + 1));

    // then
    expect(specs.filter(s => !s.chartType)).toEqual([]);
  });

  it('#generate should create no bars of one category that is no text or exceeds the axis category limit', () => {

    // when
    const specs = [category('N', 3, 10, DataType.NUMBER), category('B', 2, 10, DataType.BOOLEAN), category('C', MAX_AXIS_CATEGORIES + 1)]
      .map(c => generate([c], []));

    // then
    expect(specs.map(s => descriptionsOf(s))).toEqual([['table R by N split '], ['table R by B split '], ['table R by C split ']]);
  });

  it('#generate should create latest value table of two categories, lower cardinality first, and bars stacked by a split within the series limit',
    () => {

      // given
      const [a, g] = [category('A', MAX_SERIES + 1), category('G', 2)];
      const t = time('T', 1, 2);

      // when
      const specs = generate([a, g], [t]);

      // then
      expect(descriptionsOf(specs)).toEqual([
        'table R by G,A split ', 'table R by G,A,T split ', 'linearBar R by A split G', 'linearHorizontalBar R by A split G'
      ]);
      specs.slice(2).forEach(s => {
        expect(s.stacked).toBe(true);
        expect(s.showLegend).toBe(true);
      });
    });

  it('#generate should create bars of two categories by each text axis category', () => {

    // given
    const [c, d, b] = [category('C', 3), category('D', 4), category('B', 2, 10, DataType.BOOLEAN)];

    // when
    const specs = [generate([c, d], []), generate([b, c], []), generate([b, category('N', 3, 10, DataType.NUMBER)], [])]
      .map(s => descriptionsOf(s.filter(spec => spec.chartType === ChartType.LINEAR_BAR)));

    // then
    expect(specs).toEqual([['linearBar R by C split D', 'linearBar R by D split C'], ['linearBar R by C split B'], []]);
  });

  it('#generate should create no tables of two categories beyond the hierarchy row limit', () => {

    // given
    const [c, d] = [category('C', 3), category('D', 4)];

    // when
    const specs = generate([c, d], [time('T', 1, 2)], counterOf([c, d], SummarySpecGenerator.MAX_HIERARCHY_ROWS + 1));

    // then
    expect(specs.filter(s => !s.chartType)).toEqual([]);
  });

  it('#generate should create no bars when a series category misses values', () => {

    // given
    const c = category('C', 3);
    vi.spyOn(inspector, 'isComplete').mockImplementation(category => category !== c);

    // when
    const specs = generate([c], []);

    // then
    expect(descriptionsOf(specs)).toEqual(['table R by C split ']);
  });
});
