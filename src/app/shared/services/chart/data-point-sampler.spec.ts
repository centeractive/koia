import { DataPoint } from 'app/shared/model/chart';
import { DataPointSampler } from './data-point-sampler';

describe('DataPointSampler', () => {

  const sampler = new DataPointSampler(3);

  function pointsOf(ys: number[]): DataPoint[] {
    return ys.map((y, x) => ({ x, y }));
  }

  function xsOf(points: DataPoint[]): number[] {
    return points.map(p => p.x);
  }

  let a: DataPoint[];
  let b: DataPoint[];

  beforeEach(() => {
    a = pointsOf([0, 9, 0, 0, 0, 0, 0]);
    b = pointsOf([0, 0, 0, 9, 0, 0, 0]);
  });

  it('#exceedsMaxPoints should return false when no series exceeds the max points', () => {

    // when
    const exceeds = sampler.exceedsMaxPoints([pointsOf([1, 2, 3]), pointsOf([1])]);

    // then
    expect(exceeds).toBe(false);
  });

  it('#exceedsMaxPoints should return true when one series exceeds the max points', () => {

    // when
    const exceeds = sampler.exceedsMaxPoints([pointsOf([1, 2, 3]), pointsOf([1, 2, 3, 4])]);

    // then
    expect(exceeds).toBe(true);
  });

  it('#sampleDown should return unstacked series within the max points unchanged', () => {

    // given
    const series = [pointsOf([1, 2, 3]), pointsOf([4])];

    // when
    const sampled = sampler.sampleDown(series, false);

    // then
    expect(sampled[0]).toBe(series[0]);
    expect(sampled[1]).toBe(series[1]);
  });

  it('#sampleDown should sample down unstacked series independently', () => {

    // when
    const sampled = sampler.sampleDown([a, b], false);

    // then
    expect(sampled.map(s => xsOf(s))).toEqual([[0, 1, 4, 6], [0, 3, 4, 6]]);
  });

  it('#sampleDown should sample down a single stacked series like an unstacked one', () => {

    // when
    const sampled = sampler.sampleDown([b], true);

    // then
    expect(sampled.map(s => xsOf(s))).toEqual([[0, 3, 4, 6]]);
  });

  it('#sampleDown should sample stacked series at the x values of their sampled stack total', () => {

    // when
    const sampled = sampler.sampleDown([a, b], true);

    // then
    expect(sampled.map(s => xsOf(s))).toEqual([[0, 1, 4, 6], [0, 1, 4, 6]]);
    sampled[0].forEach(p => expect(p).toBe(a[p.x]));
    sampled[1].forEach(p => expect(p).toBe(b[p.x]));
  });

  it('#sampleDown should keep only own points of a stacked series lacking x values of the others', () => {

    // given
    const c = [{ x: 0, y: 0 }, { x: 3, y: 9 }, { x: 4, y: 0 }];

    // when
    const sampled = sampler.sampleDown([a, c], true);

    // then
    expect(sampled.map(s => xsOf(s))).toEqual([[0, 1, 4, 6], [0, 4]]);
  });

  it('#sampleDown should keep the last point per x of a stacked series with duplicate x', () => {

    // given
    const d = [a[0], { x: 1, y: 5 }, ...a.slice(1)];

    // when
    const sampled = sampler.sampleDown([d, b], true);

    // then
    expect(xsOf(sampled[0])).toEqual([0, 1, 4, 6]);
    expect(sampled[0][1]).toBe(a[1]);
  });
});
