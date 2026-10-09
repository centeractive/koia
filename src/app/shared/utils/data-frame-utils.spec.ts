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

  it('#hasColumn should return false when data frame is empty', () => {

    // given
    const dataFrame = new DataFrame<number, object>([]);

    // when
    const hasColumn = DataFrameUtils.hasColumn(dataFrame, 'a');

    // then
    expect(hasColumn).toBe(false);
  });
});
