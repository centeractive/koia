import { DataFrame } from 'data-forge';
import { DataFrameUtils } from './data-frame-utils';

describe('DataFrameUtils', () => {

  it('#transformColumn should transform column values', () => {

    // given
    const dataFrame = new DataFrame([{ a: 1, b: 'x' }, { a: 2, b: 'y' }]);

    // when
    const result = DataFrameUtils.transformColumn(dataFrame, 'a', (v: number) => v * 10);

    // then
    expect(result.toArray()).toEqual([{ a: 10, b: 'x' }, { a: 20, b: 'y' }]);
  });

  it('#transformColumn should transform column values when column is missing in first row', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ b: 'x' }, { a: 2, b: 'y' }]);

    // when
    const result = DataFrameUtils.transformColumn(dataFrame, 'a', (v: number) => v === undefined ? 0 : v * 10);

    // then
    expect(result.toArray()).toEqual([{ b: 'x', a: 0 }, { a: 20, b: 'y' }]);
    expect(result.getColumnNames()).toEqual(['b', 'a']);
  });

  it('#transformColumn should return empty data frame when data frame is empty', () => {

    // given
    const dataFrame = new DataFrame<number, object>([]);

    // when
    const result = DataFrameUtils.transformColumn(dataFrame, 'a', (v: number) => v * 10);

    // then
    expect(result.toArray()).toEqual([]);
  });

  it('#hasColumn should return true when column is missing in first row only', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ b: 'x' }, { a: 2, b: 'y' }]);

    // when
    const hasColumn = DataFrameUtils.hasColumn(dataFrame, 'a');

    // then
    expect(hasColumn).toBe(true);
  });

  it('#hasColumn should return false when column is missing in all rows', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ b: 'x' }, { b: 'y' }]);

    // when
    const hasColumn = DataFrameUtils.hasColumn(dataFrame, 'a');

    // then
    expect(hasColumn).toBe(false);
  });

  it('#hasColumn should return false when column named constructor is missing in all rows', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ ID: 1 }, { ID: 2 }]);

    // when
    const hasColumn = DataFrameUtils.hasColumn(dataFrame, 'constructor');

    // then
    expect(hasColumn).toBe(false);
  });

  it('#hasColumn should return false when data frame is empty', () => {

    // given
    const dataFrame = new DataFrame<number, object>([]);

    // when
    const hasColumn = DataFrameUtils.hasColumn(dataFrame, 'a');

    // then
    expect(hasColumn).toBe(false);
  });

  it('#columnValues should return undefined for rows lacking column named constructor', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ constructor: 'a' }, { ID: 1 }]);

    // when
    const values = DataFrameUtils.columnValues<string>(dataFrame, 'constructor');

    // then
    expect(values.toPairs()).toEqual([[0, 'a']]);
    expect(values.count()).toBe(2);
  });

  it('#orderBy should order ascending with empty values first', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ a: 2 }, { a: undefined }, { a: 1 }, { a: null }]);

    // when
    const result = DataFrameUtils.orderBy(dataFrame, [r => r['a']], 'asc');

    // then
    expect(result.toArray().map(r => r['a'])).toEqual([undefined, null, 1, 2]);
  });

  it('#orderBy should order descending with empty values last', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ a: 2 }, { a: undefined }, { a: 1 }, { a: null }]);

    // when
    const result = DataFrameUtils.orderBy(dataFrame, [r => r['a']], 'desc');

    // then
    expect(result.toArray().map(r => r['a'])).toEqual([2, 1, undefined, null]);
  });

  it('#orderBy should order by further selector when previous values are equal', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ a: 1, b: 2 }, { a: 1, b: undefined }, { a: 0, b: 3 }]);

    // when
    const result = DataFrameUtils.orderBy(dataFrame, [r => r['a'], r => r['b']], 'asc');

    // then
    expect(result.toArray().map(r => r['b'])).toEqual([3, undefined, 2]);
  });

  it('#orderBy should order descending by further selector when previous values are equal', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ a: 1, b: 1 }, { a: 1, b: 2 }]);

    // when
    const result = DataFrameUtils.orderBy(dataFrame, [r => r['a'], r => r['b']], 'desc');

    // then
    expect(result.toArray().map(r => r['b'])).toEqual([2, 1]);
  });

  it('#orderBy should treat null like undefined', () => {

    // given
    const dataFrame = new DataFrame<number, object>([{ a: null, b: 2 }, { a: undefined, b: 1 }]);

    // when
    const result = DataFrameUtils.orderBy(dataFrame, [r => r['a'], r => r['b']], 'asc');

    // then
    expect(result.toArray().map(r => r['b'])).toEqual([1, 2]);
  });
});
