import { Aggregation, DataType } from 'app/shared/model';
import { ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ColumnProfile, ColumnRole } from './column-profile';
import { Randomizer } from './randomizer';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';

type SpecFields = Pick<TileSpec, 'dataColumns' | 'aggregations' | 'size'> & Partial<Omit<TileSpec, 'signature' | 'key'>>;

/**
 * creates the candidate tile specs of all recipes that apply to the profiled columns
 */
export class TileSpecGenerator {

  static readonly MAX_SERIES = 6;
  static readonly MAX_AXIS_CATEGORIES = 12;
  static readonly MAX_TABLE_ROWS = 24;
  static readonly MAX_TIME_BUCKETS = 36;
  static readonly MAX_RANGE_CATEGORIES = 8;
  static readonly AGGREGATION_SETS: readonly Aggregation[][] = [
    [Aggregation.MIN, Aggregation.MAX, Aggregation.AVG, Aggregation.SUM],
    [Aggregation.SUM, Aggregation.AVG],
    [Aggregation.AVG, Aggregation.MEDIAN, Aggregation.MAX],
    [Aggregation.SUM]
  ];

  private static readonly MAX_CIRCULAR_CATEGORIES = 8;
  private static readonly MIN_RADAR_CATEGORIES = 3;
  private static readonly MAX_RADAR_CATEGORIES = 12;
  private static readonly MAX_BAR_CATEGORIES = 20;
  private static readonly MAX_HORIZONTAL_BAR_CATEGORIES = 30;
  private static readonly TIME_CHART_TYPES = [ChartType.LINE, ChartType.AREA];

  generate(profiles: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    const categories = profiles.filter(p => p.role === ColumnRole.CATEGORY);
    const measures = profiles.filter(p => p.role === ColumnRole.MEASURE);
    const times = profiles.filter(p => p.role === ColumnRole.TIME);
    return [
      ...this.distributions(categories, randomizer),
      ...this.categoriesByCategory(categories, randomizer),
      ...this.countsOverTime(categories, times, randomizer),
      ...this.valuesOverTime(measures, times, categories),
      ...this.scatters(measures, times, categories),
      ...this.measuresByCategories(measures, categories, randomizer),
      ...this.measuresOverTime(measures, times, randomizer),
      ...this.categoryCrosstabs(categories),
      ...this.valueRanges(measures, categories)
    ];
  }

  private distributions(categories: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return categories.flatMap(c => this.distributionChartTypes(c.distinctCount).map(chartType => {
      const legend = [ChartType.PIE, ChartType.DOUGHNUT, ChartType.POLAR_AREA].includes(chartType);
      return this.spec({
        chartType,
        dataColumns: [c],
        aggregations: [Aggregation.COUNT],
        showLegend: legend,
        legendPosition: legend ? randomizer.pick(['top', 'right']) : 'top',
        size: TileSize.SMALL
      });
    }));
  }

  private distributionChartTypes(distinctCount: number): ChartType[] {
    const chartTypes: ChartType[] = [];
    if (distinctCount <= TileSpecGenerator.MAX_CIRCULAR_CATEGORIES) {
      chartTypes.push(ChartType.PIE, ChartType.DOUGHNUT, ChartType.POLAR_AREA);
    }
    if (distinctCount >= TileSpecGenerator.MIN_RADAR_CATEGORIES && distinctCount <= TileSpecGenerator.MAX_RADAR_CATEGORIES) {
      chartTypes.push(ChartType.RADAR);
    }
    if (distinctCount <= TileSpecGenerator.MAX_BAR_CATEGORIES) {
      chartTypes.push(ChartType.BAR);
    }
    if (distinctCount <= TileSpecGenerator.MAX_HORIZONTAL_BAR_CATEGORIES) {
      chartTypes.push(ChartType.HORIZONTAL_BAR);
    }
    return chartTypes;
  }

  private categoriesByCategory(categories: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    const axisCategories = categories.filter(b => b.dataType === DataType.TEXT && b.distinctCount <= TileSpecGenerator.MAX_AXIS_CATEGORIES);
    return this.seriesCategories(categories).flatMap(a => axisCategories
      .filter(b => b !== a)
      .flatMap(b => [ChartType.LINEAR_BAR, ChartType.LINEAR_HORIZONTAL_BAR].map(chartType => this.spec({
        chartType,
        dataColumns: [a],
        groupByColumns: [b],
        aggregations: [Aggregation.COUNT],
        stacked: randomizer.chance(),
        showLegend: true,
        size: TileSize.SMALL
      }))));
  }

  private countsOverTime(categories: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return this.seriesCategories(categories).flatMap(a => times
      .flatMap(t => TileSpecGenerator.TIME_CHART_TYPES.map(chartType => this.spec({
        chartType,
        dataColumns: [a],
        groupByColumns: [t],
        aggregations: [Aggregation.COUNT],
        stacked: randomizer.chance(),
        showLegend: true,
        size: TileSize.WIDE,
        timeChart: true
      }))));
  }

  private valuesOverTime(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return times
      .filter(t => t.maxValueCount === 1)
      .flatMap(t => [
        ...measures.flatMap(n => this.splitVariants(n, categories).flatMap(split => this.timeCharts([n], t, split))),
        ...this.pairsOf(measures)
          .filter(pair => pair.every(n => n.presentCount <= ChartDataService.MAX_DATA_POINTS))
          .flatMap(pair => this.timeCharts(pair, t, []))
      ]);
  }

  private timeCharts(dataColumns: ColumnProfile[], time: ColumnProfile, splitColumns: ColumnProfile[]): TileSpec[] {
    return TileSpecGenerator.TIME_CHART_TYPES.map(chartType => this.spec({
      chartType,
      dataColumns,
      groupByColumns: [time],
      splitColumns,
      aggregations: [],
      multiValueAxes: dataColumns.length > 1,
      showLegend: splitColumns.length > 0 || dataColumns.length > 1,
      size: TileSize.WIDE,
      timeChart: true
    }));
  }

  private scatters(measures: ColumnProfile[], times: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    return measures.flatMap(n => [...times, ...measures.filter(x => x !== n)]
      .flatMap(x => this.splitVariants(n, categories).map(split => this.spec({
        chartType: ChartType.SCATTER,
        dataColumns: [n],
        groupByColumns: [x],
        splitColumns: split,
        aggregations: [],
        showLegend: split.length > 0,
        size: TileSize.WIDE
      }))));
  }

  /**
   * @returns the split columns of all individual values specs of the specified measure whose series fit
   */
  private splitVariants(measure: ColumnProfile, categories: ColumnProfile[]): ColumnProfile[][] {
    const variants: ColumnProfile[][] = measure.presentCount <= ChartDataService.MAX_DATA_POINTS ? [[]] : [];
    this.seriesCategories(categories)
      .filter(s => Math.min(measure.presentCount, s.maxValueCount) <= ChartDataService.MAX_DATA_POINTS)
      .forEach(s => variants.push([s]));
    return variants;
  }

  private measuresByCategories(measures: ColumnProfile[], categories: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    const groupings = [
      ...categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_TABLE_ROWS).map(c => [c]),
      ...this.tableCategoryPairs(categories)
    ];
    return measures.flatMap(n => groupings.map(groupByColumns => this.spec({
      dataColumns: [n],
      groupByColumns,
      aggregations: [...randomizer.pick(TileSpecGenerator.AGGREGATION_SETS)],
      size: TileSize.WIDE
    })));
  }

  private measuresOverTime(measures: ColumnProfile[], times: ColumnProfile[], randomizer: Randomizer): TileSpec[] {
    return measures.flatMap(n => times
      .filter(t => t.timeBucketCount <= TileSpecGenerator.MAX_TIME_BUCKETS)
      .map(t => this.spec({
        dataColumns: [n],
        groupByColumns: [t],
        aggregations: [...randomizer.pick(TileSpecGenerator.AGGREGATION_SETS)],
        size: TileSize.WIDE
      })));
  }

  private categoryCrosstabs(categories: ColumnProfile[]): TileSpec[] {
    return this.tableCategoryPairs(categories).map(([c1, c2]) => this.spec({
      dataColumns: [c2],
      groupByColumns: [c1],
      aggregations: [Aggregation.COUNT],
      size: TileSize.WIDE
    }));
  }

  private valueRanges(measures: ColumnProfile[], categories: ColumnProfile[]): TileSpec[] {
    const rangeCategories = categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_RANGE_CATEGORIES);
    return measures.flatMap(n => rangeCategories.map(c => this.spec({
      dataColumns: [n],
      groupByColumns: [c],
      aggregations: [Aggregation.COUNT],
      valueGroupingColumn: n,
      size: TileSize.WIDE
    })));
  }

  private seriesCategories(categories: ColumnProfile[]): ColumnProfile[] {
    return categories.filter(c => c.distinctCount <= TileSpecGenerator.MAX_SERIES);
  }

  /**
   * @returns the category pairs within the table row limit, the category of lower cardinality first
   */
  private tableCategoryPairs(categories: ColumnProfile[]): ColumnProfile[][] {
    return this.pairsOf(categories)
      .filter(([c1, c2]) => c1.distinctCount * c2.distinctCount <= TileSpecGenerator.MAX_TABLE_ROWS)
      .map(([c1, c2]) => c2.distinctCount < c1.distinctCount ? [c2, c1] : [c1, c2]);
  }

  private pairsOf(profiles: ColumnProfile[]): ColumnProfile[][] {
    return profiles.flatMap((p1, i) => profiles.slice(i + 1).map(p2 => [p1, p2]));
  }

  private spec(fields: SpecFields): TileSpec {
    const groupByColumns = fields.groupByColumns ?? [];
    const splitColumns = fields.splitColumns ?? [];
    const columnNames = [...fields.dataColumns, ...groupByColumns, ...splitColumns].map(c => c.name);
    const signature = TileSignature.of(fields.chartType ? 'chart' : 'table', columnNames);
    return {
      signature,
      key: TileSignature.keyOf(signature, fields.chartType?.type),
      chartType: fields.chartType,
      dataColumns: fields.dataColumns,
      groupByColumns,
      splitColumns,
      aggregations: fields.aggregations,
      valueGroupingColumn: fields.valueGroupingColumn,
      stacked: fields.stacked ?? false,
      multiValueAxes: fields.multiValueAxes ?? false,
      showLegend: fields.showLegend ?? false,
      legendPosition: fields.legendPosition ?? 'top',
      size: fields.size,
      timeChart: fields.timeChart ?? false
    };
  }
}
