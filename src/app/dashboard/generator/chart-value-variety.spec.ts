import { ChartDataset } from 'chart.js';
import { hasVaryingValues } from './chart-value-variety';

describe('hasVaryingValues', () => {

  function datasetsOf(...data: unknown[][]): ChartDataset[] {
    return data.map(d => ({ data: d }) as ChartDataset);
  }

  it('should detect different numbers', () => {
    expect(hasVaryingValues(datasetsOf([1, 1], [1, 2]))).toBe(true);
  });

  it('should detect different point values', () => {
    expect(hasVaryingValues(datasetsOf([{ x: 1, y: 3 }], [{ x: 2, y: 4 }]))).toBe(true);
  });

  it('should not detect equal numbers', () => {
    expect(hasVaryingValues(datasetsOf([5, 5], [5]))).toBe(false);
  });

  it('should not detect equal point values at different positions', () => {
    expect(hasVaryingValues(datasetsOf([{ x: 1, y: 10 }, { x: 2, y: 10 }], [{ x: 1, y: 10 }]))).toBe(false);
  });

  it('should ignore missing values', () => {
    expect(hasVaryingValues(datasetsOf([5, null, undefined, { x: 1 }, { x: 2, y: 5 }]))).toBe(false);
  });

  it('should accept less than two values', () => {
    expect([hasVaryingValues(datasetsOf([7])), hasVaryingValues(datasetsOf([])), hasVaryingValues([])]).toEqual([true, true, true]);
  });
});
