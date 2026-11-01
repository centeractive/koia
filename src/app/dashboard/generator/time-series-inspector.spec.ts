import { Column, ComputeOperator, DataType, TimeUnit } from 'app/shared/model';
import { categoryProfile, measureProfile } from 'app/shared/test/tile-spec-fixtures';
import { ColumnProfile, ColumnRole } from './column-profile';
import { TimeSeriesInspector } from './time-series-inspector';

describe('TimeSeriesInspector', () => {

  const MEASURE = measureProfile('N');

  function timeOf(distinctCount: number, nativeBucketCount = distinctCount): ColumnProfile {
    return {
      name: 'T', dataType: DataType.TIME, role: ColumnRole.TIME, distinctCount, presentCount: 100, maxValueCount: 1,
      groupingTimeUnit: TimeUnit.DAY, timeBucketCount: nativeBucketCount, nativeTimeUnit: TimeUnit.DAY, nativeBucketCount
    };
  }

  function seriesEntries(values: Record<string, number[]>): object[] {
    return Object.entries(values).flatMap(([series, ns]) => ns.map((n, t) => ({ T: t, S: series, N: n })));
  }

  it('#isRunningTotal should detect values accumulating within each series', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2, 4, 7], b: [10, 10, 12, 30] }), ['S']);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(4));

    // then
    expect(runningTotal).toBe(true);
  });

  it('#isRunningTotal should not detect accumulating values mixed across series', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2, 4, 7], b: [10, 10, 12, 30] }), []);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(4));

    // then
    expect(runningTotal).toBe(false);
  });

  it('#isRunningTotal should tolerate decreases within the maximum decrease ratio', () => {

    // given
    const values = Array.from({ length: 21 }, (_, i) => i === 10 ? 8 : i * 10);
    const inspector = new TimeSeriesInspector(seriesEntries({ a: values }), ['S']);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(21));

    // then
    expect(runningTotal).toBe(true);
  });

  it('#isRunningTotal should reject decreases beyond the maximum decrease ratio', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2, 3, 2, 4, 5, 6, 7, 8, 9] }), ['S']);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(10));

    // then
    expect(runningTotal).toBe(false);
  });

  it('#isRunningTotal should reject constant values', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [5, 5, 5, 5] }), ['S']);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(4));

    // then
    expect(runningTotal).toBe(false);
  });

  it('#isRunningTotal should reject a single step of otherwise constant values', () => {

    // given
    const values = Array.from({ length: 20 }, (_, i) => i < 10 ? 5 : 6);
    const inspector = new TimeSeriesInspector(seriesEntries({ a: values }), ['S']);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(20));

    // then
    expect(runningTotal).toBe(false);
  });

  it('#isRunningTotal should compare entries of the same time with the last entry of the previous time', () => {

    // given
    const entries = [{ T: 0, N: 5 }, { T: 0, N: 1 }, { T: 1, N: 3 }, { T: 1, N: 4 }, { T: 2, N: 6 }];
    const inspector = new TimeSeriesInspector(entries, []);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(3));

    // then
    expect(runningTotal).toBe(true);
  });

  it('#isRunningTotal should not split series by the measure itself', () => {

    // given
    const entries = [1, 2, 3, 4].map(n => ({ T: n, N: n }));
    const inspector = new TimeSeriesInspector(entries, ['N']);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(4));

    // then
    expect(runningTotal).toBe(true);
  });

  it('#isRunningTotal should skip entries without numeric time or measure', () => {

    // given
    const entries = [{ T: 0, N: 1 }, { T: 1, N: 'x' }, { T: 'y', N: 0 }, { N: 0 }, { T: 2, N: 3 }, { T: 3, N: 4 }];
    const inspector = new TimeSeriesInspector(entries, []);

    // when
    const runningTotal = inspector.isRunningTotal(MEASURE, timeOf(4));

    // then
    expect(runningTotal).toBe(true);
  });

  it('#isRunningTotal should sort entries once per time column and memoize its result', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2, 3] }), ['S']);
    const sortSpy = vi.spyOn(inspector as never as { sortedByTime: (name: string) => object[] }, 'sortedByTime');

    // when
    const results = [inspector.isRunningTotal(MEASURE, timeOf(3)), inspector.isRunningTotal(MEASURE, timeOf(3)),
      inspector.isUniform(timeOf(3))];

    // then
    expect(results).toEqual([true, true, true]);
    expect(sortSpy).toHaveBeenCalledTimes(2);
    expect(sortSpy.mock.results[0].value).toBe(sortSpy.mock.results[1].value);
  });

  it('#isUniform should detect equal row counts of a complete native grid', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2, 3], b: [4, 5, 6] }), ['S']);

    // when
    const uniform = inspector.isUniform(timeOf(3));

    // then
    expect(uniform).toBe(true);
  });

  it('#isUniform should detect equal category counts of a complete native grid', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2, 3], b: [4, 5, 6] }), ['S']);

    // when
    const uniform = inspector.isUniform(timeOf(3), categoryProfile('S', 2));

    // then
    expect(uniform).toBe(true);
  });

  it('#isUniform should not detect differing category counts', () => {

    // given
    const entries = [...seriesEntries({ a: [1, 2, 3], b: [4, 5, 6] }), { T: 1, S: 'a', N: 0 }, { T: 0, S: null, N: 0 }];
    const inspector = new TimeSeriesInspector(entries, ['S']);

    // when
    const uniform = [inspector.isUniform(timeOf(3)), inspector.isUniform(timeOf(3), categoryProfile('S', 2))];

    // then
    expect(uniform).toEqual([false, false]);
  });

  it('#isUniform should not detect category mixes that differ with equal row counts', () => {

    // given
    const entries = [{ T: 0, S: 'a' }, { T: 0, S: 'b' }, { T: 1, S: 'a' }, { T: 1, S: 'a' }];
    const inspector = new TimeSeriesInspector(entries, ['S']);

    // when
    const uniform = [inspector.isUniform(timeOf(2)), inspector.isUniform(timeOf(2), categoryProfile('S', 2))];

    // then
    expect(uniform).toEqual([true, false]);
  });

  it('#isUniform should never detect unique timestamps not filling their native grid', () => {

    // given
    const inspector = new TimeSeriesInspector([0, 5, 9].map(t => ({ T: t })), []);

    // when
    const uniform = inspector.isUniform(timeOf(3, 10));

    // then
    expect(uniform).toBe(false);
  });

  it('#isUniform should not detect a single time value', () => {

    // given
    const inspector = new TimeSeriesInspector([{ T: 0 }, { T: 0 }], []);

    // when
    const uniform = inspector.isUniform(timeOf(1));

    // then
    expect(uniform).toBe(false);
  });

  it('#isUniform should memoize its result per time and category', () => {

    // given
    const inspector = new TimeSeriesInspector(seriesEntries({ a: [1, 2] }), ['S']);
    const computeSpy = vi.spyOn(inspector as never as { computeUniform: () => boolean }, 'computeUniform');

    // when
    inspector.isUniform(timeOf(2));
    inspector.isUniform(timeOf(2));
    inspector.isUniform(timeOf(2), categoryProfile('S', 1));

    // then
    expect(computeSpy).toHaveBeenCalledTimes(2);
  });

  it('#seriesColumnNamesOf should take text and boolean columns but computed and excluded ones and add ordinal categories', () => {

    // given
    const columns: Column[] = [
      { name: 'Level', dataType: DataType.TEXT, width: 10 },
      { name: 'Ok', dataType: DataType.BOOLEAN, width: 10 },
      { name: 'ID', dataType: DataType.TEXT, width: 10 },
      { name: 'Amount', dataType: DataType.NUMBER, width: 10 },
      { name: 'Rating', dataType: DataType.NUMBER, width: 10 },
      { name: 'Label', dataType: DataType.TEXT, width: 10, computation: { leftColumn: 'Level', operator: ComputeOperator.ADD, rightColumn: 'Ok' } }
    ];
    const profiles = [categoryProfile('Level', 3), categoryProfile('Rating', 5, 30, DataType.NUMBER), measureProfile('Amount')];

    // when
    const names = TimeSeriesInspector.seriesColumnNamesOf(columns, profiles, ['ID']);

    // then
    expect(names).toEqual(['Level', 'Ok', 'Rating']);
  });

  it('#seriesKeyCategoriesOf should return the profiled categories of the series columns but the measure', () => {

    // given
    const [s, k, n] = [categoryProfile('S', 2), categoryProfile('K', 3), categoryProfile('N', 4, 10, DataType.NUMBER)];
    const inspector = new TimeSeriesInspector([{ S: 'a', K: 'x', N: 1 }, { S: 'b', K: 'y', N: 2 }], ['K', 'N', 'S']);

    // when
    const keyCategories = inspector.seriesKeyCategoriesOf(measureProfile('N'), [s, categoryProfile('C', 2), k, n]);

    // then
    expect(keyCategories).toEqual([s, k]);
  });

  it('#seriesKeyCategoriesOf should ignore unprofiled series columns of a single value, missing values included', () => {

    // given
    const s = categoryProfile('S', 2);
    const inspector = new TimeSeriesInspector([{ S: 'a', U: 'u' }, { S: 'b', U: 'u' }, { S: 'a', U: 'u', E: null }], ['S', 'U', 'E']);

    // when
    const keyCategories = inspector.seriesKeyCategoriesOf(MEASURE, [s]);

    // then
    expect(keyCategories).toEqual([s]);
  });

  it('#seriesKeyCategoriesOf should return undefined when an unprofiled series column holds distinct values', () => {

    // given
    const inspector = new TimeSeriesInspector([{ S: 'a', U: 'u' }, { S: 'b' }], ['S', 'U']);

    // when
    const keyCategories = inspector.seriesKeyCategoriesOf(MEASURE, [categoryProfile('S', 2)]);

    // then
    expect(keyCategories).toBeUndefined();
  });

  it('#seriesKeyCategoriesOf should read the values of an unprofiled series column once', () => {

    // given
    let reads = 0;
    const entries = [0, 1].map(() => ({ get U() { reads++; return 'u'; } }));
    const inspector = new TimeSeriesInspector(entries, ['U']);

    // when
    const keyCategories = [inspector.seriesKeyCategoriesOf(MEASURE, []), inspector.seriesKeyCategoriesOf(MEASURE, [])];

    // then
    expect(keyCategories).toEqual([[], []]);
    expect(reads).toBe(2);
  });

  it('#isComplete should detect categories present in every entry', () => {

    // given
    const inspector = new TimeSeriesInspector(Array.from({ length: 100 }, () => ({})), []);

    // when
    const complete = [inspector.isComplete(categoryProfile('C', 2)), inspector.isComplete({ ...categoryProfile('C', 2), presentCount: 99 })];

    // then
    expect(complete).toEqual([true, false]);
  });
});
