import { DataPoint } from 'app/shared/model/chart';
import { largestTriangleThreeBucket } from 'd3fc-sample';
import { ChartDataHelper } from './chart-data-helper';

export class DataPointSampler {

  constructor(private readonly maxPoints: number) { }

  exceedsMaxPoints(series: DataPoint[][]): boolean {
    return series.some(points => points.length > this.maxPoints);
  }

  /**
   * stacked series are sampled at the same x values, because Chart.js stacks points of equal x only
   */
  sampleDown(series: DataPoint[][], stacked: boolean): DataPoint[][] {
    if (!stacked || series.length < 2) {
      return series.map(points => this.sample(points));
    }
    const lastPoints = series.map(points => this.lastPointPerX(points));
    const xs = new Set(this.sample(this.stackTotal(lastPoints)).map(p => p.x));
    return lastPoints.map(points => points.filter(p => xs.has(p.x)));
  }

  private sample(points: DataPoint[]): DataPoint[] {
    if (points.length <= this.maxPoints) {
      return points;
    }
    const sampler = largestTriangleThreeBucket();
    sampler.x(d => d.x).y(d => d.y);
    sampler.bucketSize(Math.ceil(points.length / this.maxPoints));
    return sampler(points);
  }

  private lastPointPerX(points: DataPoint[]): DataPoint[] {
    const pointsByX = new Map<number, DataPoint>();
    points.forEach(p => pointsByX.set(p.x, p));
    return [...pointsByX.values()];
  }

  private stackTotal(series: DataPoint[][]): DataPoint[] {
    const totals = new Map<number, number>();
    series.flat().forEach(p => totals.set(p.x, (totals.get(p.x) ?? 0) + p.y));
    const total = [...totals].map(([x, y]) => ({ x, y }));
    ChartDataHelper.sortAscending(total);
    return total;
  }
}
