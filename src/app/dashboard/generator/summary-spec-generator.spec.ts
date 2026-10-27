import { Aggregation } from 'app/shared/model';
import {
  categoryProfile as category, combinationCounterOf, describeTileSpec, measureProfile as measure, productCombinationCounter,
  timeProfile as time
} from 'app/shared/test';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ColumnProfile } from './column-profile';
import { SummarySpecGenerator } from './summary-spec-generator';
import { TileSize, TileSpec } from './tile-spec';

describe('SummarySpecGenerator', () => {

  let generator: SummarySpecGenerator;

  beforeEach(() => {
    generator = new SummarySpecGenerator();
  });

  interface Profiles {
    categories?: ColumnProfile[];
    measures?: ColumnProfile[];
    times?: ColumnProfile[];
  }

  function generate({ categories = [], measures = [], times = [] }: Profiles,
    combinations: CategoryCombinationCounter = productCombinationCounter(categories)): TileSpec[] {
    return generator.generate(categories, measures, times, combinations);
  }

  function isCount(spec: TileSpec): boolean {
    return spec.aggregations.includes(Aggregation.COUNT);
  }

  it('#generate should create summary tables of measure grouped by categories within row limit', () => {

    // given
    const profiles = { measures: [measure('N')], categories: [category('C1', 4), category('C2', 6), category('C3', 25), category('C4', 3)] };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length && !isCount(s));

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual([
      'table N by C1 split ', 'table N by C2 split ', 'table N by C4 split ',
      'table N by C1,C2 split ', 'table N by C4,C1 split ', 'table N by C4,C2 split '
    ]);
    specs.forEach(s => {
      expect(s.aggregations).toEqual(SummarySpecGenerator.AGGREGATION_SETS[0]);
      expect(s.aggregationChoices).toEqual(SummarySpecGenerator.AGGREGATION_SETS);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create summary tables of measure over time within time row limit', () => {

    // given
    const profiles = {
      measures: [measure('N')],
      times: [time('T1', 2, SummarySpecGenerator.MAX_TIME_BUCKETS), time('T2', 2, SummarySpecGenerator.MAX_TIME_BUCKETS + 1),
        time('T3', 2, 100, SummarySpecGenerator.MAX_TIME_BUCKETS), time('T4', 2, 100, SummarySpecGenerator.MAX_TIME_BUCKETS + 1)]
    };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N by T1 split ', 'table N by T3 split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual(SummarySpecGenerator.AGGREGATION_SETS[0]);
      expect(s.aggregationChoices).toEqual(SummarySpecGenerator.AGGREGATION_SETS);
    });
  });

  it('#generate should create category crosstab summary table', () => {

    // given
    const profiles = { categories: [category('A', 6), category('B', 4), category('C', 5)] };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table A by B split ', 'table A by C split ', 'table C by B split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual([Aggregation.COUNT]);
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create category crosstab summary table of combinations within limit although product exceeds it', () => {

    // given
    const profiles = { categories: [category('A', 10), category('B', 10)] };

    // when
    const specs = generate(profiles, combinationCounterOf(() => SummarySpecGenerator.MAX_HIERARCHY_ROWS))
      .filter(s => s.groupByColumns.length);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table B by A split ']);
  });

  it('#generate should not create hierarchy summary tables of combinations exceeding limit', () => {

    // given
    const profiles = { measures: [measure('N')], categories: [category('A', 4), category('B', 5)] };

    // when
    const specs = generate(profiles, combinationCounterOf(() => SummarySpecGenerator.MAX_HIERARCHY_ROWS + 1))
      .filter(s => s.groupByColumns.length && !s.valueGroupingColumn);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N by A split ', 'table N by B split ']);
  });

  it('#generate should create value range summary table of measure by category within range category limit', () => {

    // given
    const n = measure('N');
    const profiles = { measures: [n], categories: [category('C1', SummarySpecGenerator.MAX_RANGE_CATEGORIES),
      category('C2', SummarySpecGenerator.MAX_RANGE_CATEGORIES + 1)] };

    // when
    const specs = generate(profiles).filter(s => s.valueGroupingColumn && s.groupByColumns.length);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N by C1 split ']);
    expect(specs[0].valueGroupingColumn).toBe(n);
    expect(specs[0].aggregations).toEqual([Aggregation.COUNT]);
    expect(specs[0].size).toBe(TileSize.WIDE);
  });

  it('#generate should create statistics summary table of each measure', () => {

    // given
    const profiles = { measures: [measure('N1'), measure('N2', 100, 3)] };

    // when
    const specs = generate(profiles).filter(s => !s.groupByColumns.length && !isCount(s));

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N1 by  split ', 'table N2 by  split ']);
    specs.forEach(s => {
      expect(s.aggregations).toEqual(SummarySpecGenerator.STATISTICS);
      expect(s.valueGroupingColumn).toBeUndefined();
      expect(s.size).toBe(TileSize.WIDE);
    });
  });

  it('#generate should create value range count summary table of measures exceeding table rows', () => {

    // given
    const n1 = measure('N1', 100, SummarySpecGenerator.MAX_TABLE_ROWS + 1);
    const profiles = { measures: [n1, measure('N2', 100, SummarySpecGenerator.MAX_TABLE_ROWS)] };

    // when
    const specs = generate(profiles).filter(s => !s.groupByColumns.length && isCount(s));

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N1 by  split ']);
    expect(specs[0].valueGroupingColumn).toBe(n1);
    expect(specs[0].aggregations).toEqual([Aggregation.COUNT]);
    expect(specs[0].signature).toBe('count:N1');
  });

  it('#generate should create summary tables of measure grouped by value ranges of other measure exceeding table rows', () => {

    // given
    const n1 = measure('N1');
    const n2 = measure('N2');
    const profiles = { measures: [n1, n2, measure('N3', 100, SummarySpecGenerator.MAX_TABLE_ROWS)] };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual([
      'table N1 by N2 split ', 'table N2 by N1 split ', 'table N3 by N1 split ', 'table N3 by N2 split '
    ]);
    expect(specs.map(s => s.valueGroupingColumn)).toEqual([n2, n1, n1, n2]);
    expect(specs[0].signature).toBe(specs[1].signature);
    specs.forEach(s => expect(s.aggregations).toEqual(SummarySpecGenerator.RANGE_AGGREGATIONS));
  });

  it('#generate should create count summary table of each category within row limit', () => {

    // given
    const profiles = { categories: [category('C1', SummarySpecGenerator.MAX_TABLE_ROWS), category('C2', SummarySpecGenerator.MAX_TABLE_ROWS + 1)] };

    // when
    const specs = generate(profiles, combinationCounterOf(() => SummarySpecGenerator.MAX_HIERARCHY_ROWS + 1));

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table C1 by  split ']);
    expect(specs[0].aggregations).toEqual([Aggregation.COUNT]);
    expect(specs[0].signature).toBe('count:C1');
  });

  it('#generate should create count summary tables of category over time within hierarchy row limit', () => {

    // given
    const profiles = {
      categories: [category('C1', 3), category('C2', 4)],
      times: [time('T1', 2, 20), time('T2', 2, 100, 15)]
    };

    // when
    const specs = generate(profiles, combinationCounterOf(() => SummarySpecGenerator.MAX_HIERARCHY_ROWS + 1))
      .filter(s => s.groupByColumns.length);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table C1 by T1 split ', 'table C1 by T2 split ', 'table C2 by T2 split ']);
    specs.forEach(s => expect(s.aggregations).toEqual([Aggregation.COUNT]));
  });

  it('#generate should create no specs without profiles', () => {

    // when
    const specs = generate({});

    // then
    expect(specs).toEqual([]);
  });

  it('#tableCategoryPairs should return category pairs within hierarchy row limit, lower cardinality first', () => {

    // given
    const categories = [category('A', 6), category('B', 4), category('C', 20)];

    // when
    const pairs = generator.tableCategoryPairs(categories, productCombinationCounter(categories));

    // then
    expect(pairs.map(p => p.map(c => c.name))).toEqual([['B', 'A']]);
  });

  it('#generate should offer every aggregation set to measure summary tables', () => {

    // given
    const profiles = { measures: [measure('N')], categories: [category('C', 3)] };

    // when
    const [spec] = generate(profiles).filter(s => s.groupByColumns.length && !isCount(s));

    // then
    expect(spec.aggregationChoices).toEqual(SummarySpecGenerator.AGGREGATION_SETS);
    spec.aggregationChoices.forEach((choice, i) => expect(choice).not.toBe(SummarySpecGenerator.AGGREGATION_SETS[i]));
    expect(spec.aggregations).not.toBe(SummarySpecGenerator.AGGREGATION_SETS[0]);
  });

  it('AGGREGATION_SETS should be subsets of the first set', () => {

    // when
    const [first, ...others] = SummarySpecGenerator.AGGREGATION_SETS;

    // then
    others.forEach(set => set.forEach(a => expect(first).toContain(a)));
  });

  it('#generate should create three level summary tables of category triples within row limit', () => {

    // given
    const profiles = { measures: [measure('N')], categories: [category('A', 2), category('B', 3), category('C', 4), category('D', 10)] };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length === 3);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N by A,B,C split ', 'table N by A,B,D split ']);
    specs.forEach(s => expect(s.aggregationChoices).toEqual(SummarySpecGenerator.AGGREGATION_SETS));
  });

  it('#generate should create three level count summary table of category triple', () => {

    // given
    const profiles = { categories: [category('A', 2), category('B', 3), category('C', 4)] };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length === 2);

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table C by A,B split ']);
    expect(specs[0].aggregations).toEqual([Aggregation.COUNT]);
    expect(specs[0].size).toBe(TileSize.WIDE);
  });

  it('#generate should create summary tables of measure by category over time within hierarchy row limit', () => {

    // given
    const profiles = { measures: [measure('N')], categories: [category('C1', 3), category('C2', 4)], times: [time('T', 2, 20)] };

    // when
    const specs = generate(profiles).filter(s => s.groupByColumns.length === 2 && s.groupByColumns[1].name === 'T');

    // then
    expect(specs.map(s => describeTileSpec(s))).toEqual(['table N by C1,T split ']);
    expect(specs[0].aggregations).toEqual(SummarySpecGenerator.AGGREGATION_SETS[0]);
    expect(specs[0].aggregationChoices).toEqual(SummarySpecGenerator.AGGREGATION_SETS);
  });

  it('#tableCategoryTriples should estimate rows by smallest pair combination count times third category, lowest cardinality first', () => {

    // given
    const categories = [category('X', 10), category('Y', 6), category('Z', 5)];
    const isYZ = (name1: string, name2: string) => [name1, name2].sort().join() === 'Y,Z';
    const fitting = combinationCounterOf((name1, name2) => isYZ(name1, name2) ? 6 : 60);
    const exceeding = combinationCounterOf((name1, name2) => isYZ(name1, name2) ? 7 : 60);

    // when
    const fittingTriples = generator.tableCategoryTriples(categories, fitting);
    const exceedingTriples = generator.tableCategoryTriples(categories, exceeding);

    // then
    expect(fittingTriples.map(t => t.map(c => c.name))).toEqual([['Z', 'Y', 'X']]);
    expect(exceedingTriples).toEqual([]);
  });

  it('#tableCategoryTriples should return at most maximum hierarchy triples', () => {

    // given
    const categories = Array.from({ length: 8 }, (_, i) => category('C' + i, 2));

    // when
    const triples = generator.tableCategoryTriples(categories, productCombinationCounter(categories));

    // then
    expect(triples.length).toBe(SummarySpecGenerator.MAX_HIERARCHY_TRIPLES);
    expect(triples[0].map(c => c.name)).toEqual(['C0', 'C1', 'C2']);
  });
});
