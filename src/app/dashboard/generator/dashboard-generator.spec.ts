import { CategoricalColorProvider, CategoricalColorScheme, ColorOptions, ColorProviderFactory, ColorSchemeType } from 'app/shared/color';
import { Aggregation, Column, DataType, ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { appLogsSampleOf } from 'app/shared/samples/app-logs.sample';
import { fruitSalesSampleOf } from 'app/shared/samples/fruit-sales.sample';
import { SampleData, toEntries } from 'app/shared/samples/sample-data';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { LANGUAGES } from 'app/shared/services/language';
import { occupiedCells, SequenceRandomSource } from 'app/shared/test';
import { SummaryTableSizeEstimator } from 'app/summary-table/summary-table-size-estimator';
import { ColumnProfiler } from './column-profiler';
import { DashboardGenerator, GeneratedDashboard, GenerationRequest } from './dashboard-generator';
import { GENERATED_GRID_COLUMNS, GridChooser, GridDef, rowsOf } from './generated-grid';
import { SummaryTablePicker } from './summary-table-picker';
import { TileContextFactory } from './tile-context-factory';
import { TileSignature } from './tile-signature';
import { TileSize, TileSpec } from './tile-spec';
import { TileSpecGenerator } from './tile-spec-generator';
import { TileValidator } from './tile-validator';

describe('DashboardGenerator', () => {

  const SEQUENCES = [[0], [0.99], [0.1, 0.7, 0.4], [0.5, 0.2, 0.9, 0.3], [0.37, 0.81, 0.05, 0.62]];
  const LEVEL: Column = { name: 'Level', dataType: DataType.TEXT, width: 10 };
  const REGION: Column = { name: 'Region', dataType: DataType.TEXT, width: 10 };
  const TIME: Column = { name: 'Time', dataType: DataType.TIME, width: 10 };
  const AMOUNT: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
  const COLUMNS = [LEVEL, REGION, TIME, AMOUNT];
  const ENTRIES = monthsOf(24).flatMap((time, m) => ['INFO', 'WARN', 'ERROR'].flatMap((level, l) => ['North', 'South']
    .map((region, r) => ({ Level: level, Region: region, Time: time, Amount: ((m + l * 7 + r * 3) % 9) * 10 + 5 }))));
  const MARGIN = { top: 0, right: 0, bottom: 0, left: 0 };
  const HOUR = 3_600_000;
  const LOG_TIME: Column = { name: 'Date/Time', dataType: DataType.TIME, width: 10 };
  const PATH: Column = { name: 'Path', dataType: DataType.TEXT, width: 10 };
  const DATA: Column = { name: 'Data', dataType: DataType.TEXT, width: 10 };
  const HOST: Column = { name: 'Host', dataType: DataType.TEXT, width: 10 };
  const LOG_COLUMNS = [LOG_TIME, LEVEL, DATA, HOST, PATH];
  const FOOD: Column = { name: 'Food', dataType: DataType.TEXT, width: 10 };
  const RATING: Column = { name: 'Rating', dataType: DataType.NUMBER, width: 10 };
  const RESTAURANT_COLUMNS: Column[] = [{ name: 'Name', dataType: DataType.TEXT, width: 10 }, { name: 'City', dataType: DataType.TEXT, width: 10 },
    FOOD, RATING];
  const RESTAURANT_ENTRIES = Array.from({ length: 240 }, (_, i) => ({
    Name: 'n' + i,
    City: 'c' + (i % 100),
    Food: i % 40 === 39 ? null : 'F' + (i % 12),
    Rating: (i % 12 + Math.floor(i / 12) % 4) % 6
  }));
  const LOG_ENTRIES = Array.from({ length: 40 }, (_, i) => ({
    'Date/Time': new Date(2024, 0, 1).getTime() + Math.round(i * 29 / 39) * HOUR,
    Level: ['ERROR', 'INFO', 'WARN', 'DEBUG'][i % 4],
    Path: '/p' + (i % 7),
    Data: 'message ' + i,
    Host: 'host'
  }));

  afterEach(() => vi.restoreAllMocks());

  function monthsOf(count: number): number[] {
    return Array.from({ length: count }, (_, m) => new Date(2024, m, 1).getTime());
  }

  function generatorOf(values: number[] = [0.3], tableSizeEstimator?: SummaryTableSizeEstimator): DashboardGenerator {
    return new DashboardGenerator(new ChartMarginService(), new ChartDataService(), new SequenceRandomSource(values), tableSizeEstimator);
  }

  function requestOf(columns: Column[], entries: object[], currentContexts: ElementContext[] = [],
    currentGrid: GridDef = { columns: 3, cellRatio: '1:1' }, containerWidth = 0): GenerationRequest {
    return { columns: () => columns.map(c => ({ ...c })), entries, currentContexts, currentGrid, containerWidth };
  }

  function estimatorOf(width: number, height = 100): SummaryTableSizeEstimator {
    const estimator = new SummaryTableSizeEstimator();
    vi.spyOn(estimator, 'estimate').mockImplementation(context => ({ width, height, aggregationWidths: context.aggregations.map(() => 0) }));
    return estimator;
  }

  function tableOf(result: GeneratedDashboard): SummaryContext {
    return result.elementContexts.find(c => c instanceof SummaryContext);
  }

  function chooseGridOf(columns: number): void {
    vi.spyOn(GridChooser.prototype, 'next').mockReturnValue({ columns, cellRatio: '1:1' });
  }

  /**
   * creates category columns C0, C1, ... of three values each, and entries holding every value of each category in every month
   */
  function categoryColumns(count: number): Column[] {
    return Array.from({ length: count }, (_, i) => ({ name: 'C' + i, dataType: DataType.TEXT, width: 10 }));
  }

  function categoryEntries(categoryCount: number, timeColumns: Column[]): object[] {
    return monthsOf(24).flatMap((time, m) => [0, 1, 2].map(k => {
      const entry = { Amount: ((m * 3 + k) % 5) * 10 };
      categoryColumns(categoryCount).forEach((c, i) => entry[c.name] = 'v' + ((k + i) % 3));
      timeColumns.forEach(c => entry[c.name] = time);
      return entry;
    }));
  }

  function cellsOf(result: GeneratedDashboard): boolean[][] {
    return occupiedCells(result.grid.columns, result.elementContexts.map(c => ({ columns: c.gridColumnSpan, rows: c.gridRowSpan })));
  }

  function expectFilled(result: GeneratedDashboard): void {
    const cells = cellsOf(result);
    expect(cells.length).toBe(rowsOf(result.grid.columns));
    expect(cells.flat().every(c => c)).toBe(true);
  }

  function isTimeChart(context: ChartContext): boolean {
    return [ChartType.LINE.type, ChartType.AREA.type, ChartType.LINEAR_BAR.type].includes(context.chartType)
      && context.groupByColumns[0]?.dataType === DataType.TIME;
  }

  function charts(result: GeneratedDashboard): ChartContext[] {
    return result.elementContexts.filter(c => c instanceof ChartContext);
  }

  function graphsOf(result: GeneratedDashboard): GraphContext[] {
    return result.elementContexts.filter(c => c instanceof GraphContext);
  }

  function spyIsValid(valid: (context: ChartContext, isValid: () => boolean) => boolean): ChartContext[] {
    const isValid = TileValidator.prototype.isValid;
    const contexts: ChartContext[] = [];
    vi.spyOn(TileValidator.prototype, 'isValid').mockImplementation(function (this: TileValidator, context: ChartContext) {
      contexts.push(context);
      return valid(context, () => isValid.call(this, context));
    });
    return contexts;
  }

  function generateSpecsMatching(matches: (spec: TileSpec) => boolean): void {
    const generate = TileSpecGenerator.prototype.generate;
    vi.spyOn(TileSpecGenerator.prototype, 'generate').mockImplementation(function (this: TileSpecGenerator, profiles, randomizer, combinations) {
      return generate.call(this, profiles, randomizer, combinations).filter(matches);
    });
  }

  function generateWithoutUngroupedTables(): void {
    generateSpecsMatching(s => !!s.chartType || s.groupByColumns.length > 0);
  }

  function colorOptionsOf(scheme: CategoricalColorScheme, bgColorOpacity = 0.75): ColorOptions {
    return { type: ColorSchemeType.CATEGORICAL, scheme, bgColorOpacity, borderColorOpacity: 1 };
  }

  function chartContextOf(chartType: ChartType, dataColumns: Column[], groupByColumns: Column[]): ChartContext {
    const context = new ChartContext(COLUMNS, chartType.type, MARGIN);
    context.dataColumns = dataColumns;
    context.groupByColumns = groupByColumns;
    return context;
  }

  it('#generate should return undefined without entries', () => {

    // when
    const result = generatorOf().generate(requestOf(COLUMNS, []));

    // then
    expect(result).toBeUndefined();
  });

  it('#generate should return undefined when no column qualifies', () => {

    // given
    const columns: Column[] = [{ name: 'Id', dataType: DataType.NUMBER, width: 10 }, { name: 'Kind', dataType: DataType.TEXT, width: 10 }];
    const entries = Array.from({ length: ColumnProfiler.MIN_IDENTIFIER_DISTINCT }, (_, i) => ({ Id: i, Kind: 'same' }));

    // when
    const result = generatorOf().generate(requestOf(columns, entries));

    // then
    expect(result).toBeUndefined();
  });

  it('#generate should return undefined when qualifying columns allow no tile', () => {

    // given
    const entries = monthsOf(24).map(time => ({ Time: time }));

    // when
    const result = generatorOf().generate(requestOf([TIME], entries));

    // then
    expect(result).toBeUndefined();
  });

  it('#generate should fill grid of chosen resolution without holes', () => {
    for (const currentColumns of [3, 4, 5]) {
      for (const values of SEQUENCES) {

        // when
        const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES, [], { columns: currentColumns, cellRatio: '1:1' }));

        // then
        expectFilled(result);
      }
    }
  });

  it('#generate should choose grid differing from current grid', () => {
    for (const currentColumns of [1, 2, 3, 4, 5]) {
      for (const values of SEQUENCES) {

        // when
        const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES, [], { columns: currentColumns, cellRatio: '2:1' }));

        // then
        expect(result.grid.columns).not.toBe(currentColumns);
        expect(GENERATED_GRID_COLUMNS).toContain(result.grid.columns);
        expect(result.grid.cellRatio).toBe('1:1');
      }
    }
  });

  it('#generate should start with full width time chart when time column qualifies', () => {
    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      const first = result.elementContexts[0] as ChartContext;
      expect(first).toBeInstanceOf(ChartContext);
      expect(isTimeChart(first)).toBe(true);
      expect([first.gridColumnSpan, first.gridRowSpan]).toEqual([result.grid.columns, 1]);
    }
  });

  it('#generate should not include full width time chart without qualifying time column', () => {
    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values).generate(requestOf([LEVEL, REGION, AMOUNT], ENTRIES));

      // then
      expect(result.elementContexts.length).toBeGreaterThan(0);
      result.elementContexts.forEach(c => expect(c.gridColumnSpan).toBeLessThanOrEqual(2));
    }
  });

  it('#generate should place circular charts in square tiles only', () => {

    // given
    const generate = TileSpecGenerator.prototype.generate;
    vi.spyOn(TileSpecGenerator.prototype, 'generate').mockImplementation(function (this: TileSpecGenerator, profiles, randomizer, combinations) {
      return generate.call(this, profiles, randomizer, combinations).filter(s => s.size !== TileSize.SMALL || ChartType.CIRCULAR.includes(s.chartType));
    });
    const circularCharts: ChartContext[] = [];

    // when
    for (const currentColumns of [3, 4, 5]) {
      for (const values of SEQUENCES) {
        const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES, [], { columns: currentColumns, cellRatio: '1:1' }));
        circularCharts.push(...charts(result).filter(c => c.isCircularChart()));
      }
    }

    // then
    expect(circularCharts.length).toBeGreaterThan(0);
    circularCharts.forEach(c => expect([c.gridColumnSpan, c.gridRowSpan]).toEqual([1, 1]));
  });

  it('#generate should include one summary table', () => {
    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      expect(result.elementContexts.filter(c => c instanceof SummaryContext).length).toBe(1);
    }
  });

  it('#generate should generate tiles of distinct signatures', () => {
    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      const signatures = result.elementContexts.map(c => TileSignature.ofContext(c));
      expect(new Set(signatures).size).toBe(signatures.length);
    }
  });

  it('#generate should prefer signatures not used by current tiles', () => {
    for (const values of SEQUENCES) {

      // given
      const previous = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));
      const current = { ...previous, elementContexts: [previous.elementContexts[0], previous.elementContexts.find(c => c instanceof SummaryContext)] };

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES, current.elementContexts, current.grid));

      // then
      expect(TileSignature.ofContext(result.elementContexts[0])).not.toBe(TileSignature.ofContext(current.elementContexts[0]));
      const tableSignature = (r: GeneratedDashboard) => TileSignature.ofContext(r.elementContexts.find(c => c instanceof SummaryContext));
      expect(tableSignature(result)).not.toBe(tableSignature(current));
    }
  });

  it('#generate should apply same new color scheme to all tiles', () => {

    // given
    ColorProviderFactory.create(colorOptionsOf(CategoricalColorScheme.TABLEAU_10));

    // when
    const result = generatorOf([0.5, 0.2, 0.9, 0.3]).generate(requestOf(COLUMNS, ENTRIES));

    // then
    const options = result.elementContexts[0].colorProvider.options;
    expect(options.type).toBe(ColorSchemeType.CATEGORICAL);
    expect(options.scheme).not.toBe(CategoricalColorScheme.TABLEAU_10);
    result.elementContexts.forEach(c => expect(c.colorProvider.options).toEqual(options));
    expect(ColorProviderFactory.create().options).toEqual(options);
  });

  it('#generate should choose color scheme other than of first current tile', () => {
    for (const values of SEQUENCES) {

      // given
      ColorProviderFactory.create(colorOptionsOf(CategoricalColorScheme.TABLEAU_10));
      const current = new SummaryContext(COLUMNS);
      current.colorProvider = new CategoricalColorProvider(colorOptionsOf(CategoricalColorScheme.SET_1, 0.5));

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES, [current]));

      // then
      const options = result.elementContexts[0].colorProvider.options;
      expect(options.scheme).not.toBe(CategoricalColorScheme.SET_1);
      expect(options.bgColorOpacity).toBe(0.5);
    }
  });

  it('#generate should choose color scheme other than current color provider when dashboard is empty', () => {
    for (const values of SEQUENCES) {

      // given
      ColorProviderFactory.create(colorOptionsOf(CategoricalColorScheme.PAIRED, 0.6));

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      const options = result.elementContexts[0].colorProvider.options;
      expect(options.scheme).not.toBe(CategoricalColorScheme.PAIRED);
      expect(options.bgColorOpacity).toBe(0.6);
    }
  });

  it('#generate should skip invalid chart specs', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      const invalidTypes = [ChartType.PIE.type, ChartType.LINEAR_BAR.type, ChartType.LINE.type];
      spyIsValid((context, isValid) => !invalidTypes.includes(context.chartType) && isValid());

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      expect(charts(result).length).toBeGreaterThan(0);
      charts(result).forEach(c => expect(invalidTypes).not.toContain(c.chartType));
    }
  });

  it('#generate should stop validating after maximum validations', () => {

    // given
    const columns = [...categoryColumns(8), AMOUNT];
    const validated = spyIsValid(() => false);

    // when
    generatorOf().generate(requestOf(columns, categoryEntries(8, [])));

    // then
    expect(validated.length).toBe(DashboardGenerator.MAX_VALIDATIONS);
  });

  it('#generate should find time chart feature and summary table within the validation budget', () => {

    // given
    const categories = categoryColumns(8);
    const columns = [...categories, TIME];
    const currentContexts = categories.map(c => chartContextOf(ChartType.LINE, [c], [TIME]));
    const validated = spyIsValid((context, isValid) => isTimeChart(context) && isValid());
    const createSummarySpy = vi.spyOn(TileContextFactory.prototype, 'createSummary');

    // when
    const result = generatorOf().generate(requestOf(columns, categoryEntries(8, [TIME]), currentContexts));

    // then
    expect(validated.length).toBeLessThanOrEqual(1 + DashboardGenerator.MAX_VALIDATIONS);
    const first = result.elementContexts[0] as ChartContext;
    expect(isTimeChart(first)).toBe(true);
    expect(first.gridColumnSpan).toBe(result.grid.columns);
    expect(result.elementContexts.filter(c => c instanceof SummaryContext).length).toBeGreaterThan(0);
    createSummarySpy.mock.results.forEach(r => expect(r.value).toBeInstanceOf(SummaryContext));
  });

  it('#generate should stop feature search after maximum validations', () => {

    // given
    const timeColumns: Column[] = ['T1', 'T2', 'T3'].map(name => ({ name, dataType: DataType.TIME, width: 10 }));
    const columns = [...categoryColumns(8), ...timeColumns, AMOUNT];
    const validated = spyIsValid(() => false);

    // when
    generatorOf().generate(requestOf(columns, categoryEntries(8, timeColumns)));

    // then
    expect(validated.length).toBe(2 * DashboardGenerator.MAX_VALIDATIONS);
    expect(validated.slice(0, DashboardGenerator.MAX_VALIDATIONS).every(c => isTimeChart(c))).toBe(true);
  });

  it('#generate should return undefined when no spec is valid', () => {

    // given
    const validated = spyIsValid(() => false);

    // when
    const result = generatorOf().generate(requestOf([TIME], ENTRIES));

    // then
    expect(validated.length).toBeGreaterThan(0);
    expect(result).toBeUndefined();
  });

  it('#generate should keep first valid spec of each signature', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      const validated: { signature: string; key: string; valid: boolean }[] = [];
      spyIsValid((context, isValid) => {
        const valid = context.chartType !== ChartType.PIE.type && isValid();
        validated.push({ signature: TileSignature.ofContext(context), key: TileSignature.keyOfContext(context), valid });
        return valid;
      });

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      const firstValidKeys = new Map<string, string>();
      validated.forEach(v => {
        expect(firstValidKeys.has(v.signature)).toBe(false);
        if (v.valid) {
          firstValidKeys.set(v.signature, v.key);
        }
      });
      charts(result).forEach(c => expect(TileSignature.keyOfContext(c)).toBe(firstValidKeys.get(TileSignature.ofContext(c))));
    }
  });

  it('#generate should continue validating small charts until odd column rows can be filled', () => {

    // given
    const currentContexts = [
      chartContextOf(ChartType.PIE, [LEVEL], []),
      chartContextOf(ChartType.PIE, [REGION], []),
      chartContextOf(ChartType.LINEAR_BAR, [LEVEL], [REGION])
    ];
    const smallSignatures = currentContexts.map(c => TileSignature.ofContext(c));

    // when
    const result = generatorOf([0.2]).generate(requestOf(COLUMNS, ENTRIES, currentContexts, { columns: 4, cellRatio: '1:1' }));

    // then
    expect(result.grid.columns).toBe(3);
    expectFilled(result);
    const smalls = result.elementContexts.filter(c => c.gridColumnSpan === 1 && smallSignatures.includes(TileSignature.ofContext(c)));
    expect(smalls.length).toBeGreaterThan(0);
  });

  it('#generate should not include full width time chart when no time chart is valid', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      spyIsValid((context, isValid) => !isTimeChart(context) && isValid());

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      expect(result.elementContexts.length).toBeGreaterThan(0);
      result.elementContexts.forEach(c => expect(c.gridColumnSpan).toBeLessThanOrEqual(2));
      charts(result).forEach(c => expect(isTimeChart(c)).toBe(false));
      expect(cellsOf(result).flat().every(c => c)).toBe(true);
    }
  });

  it('#generate should generate without summary table when no table spec exists', () => {

    // given
    const entries = monthsOf(24).flatMap(time => Array.from({ length: 30 }, () => ({ Time: time })));

    // when
    const result = generatorOf().generate(requestOf([TIME], entries));

    // then
    expect(result.elementContexts.length).toBeGreaterThan(0);
    expect(result.elementContexts.some(c => c instanceof SummaryContext)).toBe(false);
    expect(isTimeChart(result.elementContexts[0] as ChartContext)).toBe(true);
  });

  it('#generate should fill a row with two wide summary tables when no chart is valid', () => {

    // given
    chooseGridOf(4);
    const createSummarySpy = vi.spyOn(TileContextFactory.prototype, 'createSummary');
    spyIsValid(() => false);

    // when
    const result = generatorOf().generate(requestOf(COLUMNS, ENTRIES));

    // then
    expect(createSummarySpy).toHaveBeenCalledTimes(2);
    expect(result.elementContexts.every(c => c instanceof SummaryContext)).toBe(true);
    expect(result.elementContexts.map(c => [c.gridColumnSpan, c.gridRowSpan])).toEqual([[2, 1], [2, 1]]);
    expect(new Set(result.elementContexts.map(c => TileSignature.ofContext(c))).size).toBe(2);
  });

  it('#generate should add second summary table of its own width when it fills more rows', () => {

    // given
    chooseGridOf(3);
    const pickSpy = vi.spyOn(SummaryTablePicker.prototype, 'pick');
    const estimator = new SummaryTableSizeEstimator();
    vi.spyOn(estimator, 'estimate').mockImplementation(context => ({
      width: pickSpy.mock.calls.length === 1 ? 400 : 100, height: 100, aggregationWidths: context.aggregations.map(() => 0)
    }));
    spyIsValid(() => false);

    // when
    const result = generatorOf([0.3], estimator).generate(requestOf(COLUMNS, ENTRIES, [], undefined, 1000));

    // then
    expect(result.elementContexts.every(c => c instanceof SummaryContext)).toBe(true);
    expect(result.elementContexts.map(c => c.gridColumnSpan).sort()).toEqual([1, 2]);
    expect(cellsOf(result).flat().every(c => c)).toBe(true);
  });

  it('#generate should not add second summary table when it would only replace charts', () => {

    // given
    chooseGridOf(4);
    const createSummarySpy = vi.spyOn(TileContextFactory.prototype, 'createSummary');
    spyIsValid((context, isValid) => !isTimeChart(context) && context.chartType !== ChartType.SCATTER.type && isValid());

    // when
    const result = generatorOf().generate(requestOf(COLUMNS, ENTRIES));

    // then
    expect(createSummarySpy).toHaveBeenCalledTimes(2);
    expect(result.elementContexts.filter(c => c instanceof SummaryContext).length).toBe(1);
    expect(charts(result).length).toBe(rowsOf(4) * 4 - 2);
  });

  it('#generate should drop wide second summary table that cannot get a wide slot and fill its cell with small relationship graph', () => {

    // given
    chooseGridOf(3);
    const createSummarySpy = vi.spyOn(TileContextFactory.prototype, 'createSummary');
    spyIsValid(() => false);

    // when
    const result = generatorOf().generate(requestOf(COLUMNS, ENTRIES));

    // then
    expect(createSummarySpy).toHaveBeenCalledTimes(2);
    expect(result.elementContexts.length).toBe(2);
    expect(tableOf(result).gridColumnSpan).toBe(2);
    const graphs = graphsOf(result);
    expect(graphs.map(g => [g.gridColumnSpan, g.gridRowSpan])).toEqual([[1, 1]]);
    expect(graphs[0].groupByColumns.map(c => c.name)).toEqual(['Region', 'Level']);
    expect(cellsOf(result).flat().every(c => c)).toBe(true);
  });

  it('#generate should not widen lone summary table', () => {

    // given
    chooseGridOf(5);
    spyIsValid(() => false);

    // when
    const result = generatorOf().generate(requestOf([LEVEL, REGION], ENTRIES));

    // then
    expect(result.elementContexts.length).toBe(1);
    expect(result.elementContexts[0]).toBeInstanceOf(SummaryContext);
    expect([result.elementContexts[0].gridColumnSpan, result.elementContexts[0].gridRowSpan]).toEqual([2, 1]);
  });

  it('#generate should widen charts but not summary table of underfilled row', () => {

    // given
    chooseGridOf(5);
    generateWithoutUngroupedTables();
    vi.spyOn(TileSpecGenerator.prototype, 'graphGroupings').mockReturnValue([]);
    spyIsValid((context, isValid) => context.chartType === ChartType.PIE.type && context.dataColumns[0].name === 'Level' && isValid());

    // when
    const result = generatorOf().generate(requestOf([LEVEL, REGION], ENTRIES));

    // then
    expect(tableOf(result).gridColumnSpan).toBe(2);
    expect(charts(result).map(c => c.gridColumnSpan)).toEqual([3]);
  });

  it('#generate should prefer unused chart types', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      const validated = spyIsValid((_context, isValid) => isValid());

      // when
      generatorOf(values).generate(requestOf([LEVEL, REGION], ENTRIES));

      // then
      const chartTypes = validated.map(c => c.chartType);
      const distinctCount = new Set(chartTypes).size;
      expect(chartTypes.length).toBeGreaterThan(distinctCount);
      expect(new Set(chartTypes.slice(0, distinctCount)).size).toBe(distinctCount);
    }
  });

  it('#generate should reuse chart type when no other chart type is valid', () => {

    // given
    spyIsValid((context, isValid) => context.chartType === ChartType.PIE.type && isValid());

    // when
    const result = generatorOf().generate(requestOf(COLUMNS, ENTRIES));

    // then
    expect(charts(result).map(c => c.chartType)).toEqual([ChartType.PIE.type, ChartType.PIE.type]);
  });

  it('#generate should stop validating before maximum validations when candidates run out', () => {

    // given
    const validated = spyIsValid(() => false);

    // when
    generatorOf().generate(requestOf([LEVEL], ENTRIES));

    // then
    expect(validated.length).toBe(6);
    expect(validated.length).toBeLessThan(DashboardGenerator.MAX_VALIDATIONS);
  });

  it('#generate should chart ordinal number column as category without combining it with itself', () => {

    // given
    const entries = Array.from({ length: 60 }, (_, i) => ({ Rating: i % 6 }));

    // when
    const result = generatorOf().generate(requestOf([RATING], entries));

    // then
    expect(charts(result).length).toBeGreaterThan(0);
    charts(result).forEach(c => {
      expect(c.dataColumns.map(col => col.name)).toEqual(['Rating']);
      expect(c.groupByColumns).toEqual([]);
      expect(c.aggregations).toEqual([Aggregation.COUNT]);
    });
    const tables = result.elementContexts.filter(c => c instanceof SummaryContext);
    expect(tables.length).toBeGreaterThan(0);
    tables.forEach(t => expect(t.groupByColumns).toEqual([]));
  });

  it('#generate should place time chart, summary table and charts of sparse log data filling the grid of every resolution', () => {
    for (const columns of [3, 4, 5]) {
      for (const values of SEQUENCES) {

        // given
        vi.restoreAllMocks();
        chooseGridOf(columns);

        // when
        const result = generatorOf(values).generate(requestOf(LOG_COLUMNS, LOG_ENTRIES));

        // then
        const first = result.elementContexts[0] as ChartContext;
        expect(isTimeChart(first)).toBe(true);
        expect(first.gridColumnSpan).toBe(columns);
        const tables = result.elementContexts.filter(c => c instanceof SummaryContext);
        expect([1, 2]).toContain(tables.length);
        tables.forEach(t => expect(t.gridColumnSpan).toBe(2));
        expect(charts(result).length).toBeGreaterThan(1);
        expectFilled(result);
      }
    }
  });


  it('#generate should unstack line time chart of series with different time buckets', () => {

    // given
    generateSpecsMatching(s => s.chartType !== ChartType.AREA);

    // when
    const result = generatorOf([0]).generate(requestOf(LOG_COLUMNS, LOG_ENTRIES));

    // then
    const first = result.elementContexts[0] as ChartContext;
    expect(isTimeChart(first)).toBe(true);
    expect(first.stacked).toBe(false);
  });

  it('#generate should not revalidate time charts found invalid in feature search', () => {

    // given
    const generate = TileSpecGenerator.prototype.generate;
    const specs: TileSpec[] = [];
    vi.spyOn(TileSpecGenerator.prototype, 'generate').mockImplementation(function (this: TileSpecGenerator, profiles, randomizer, combinations) {
      specs.push(...generate.call(this, profiles, randomizer, combinations));
      return specs;
    });
    const validated = spyIsValid((context, isValid) => !isTimeChart(context) && isValid());

    // when
    generatorOf().generate(requestOf(COLUMNS, ENTRIES));

    // then
    const timeChartKeys = validated.filter(c => isTimeChart(c)).map(c => TileSignature.keyOfContext(c));
    expect(timeChartKeys.length).toBe(specs.filter(s => s.timeChart).length);
    expect(new Set(timeChartKeys).size).toBe(timeChartKeys.length);
  });

  it('#generate should give summary table one cell when its content fits a cell', () => {
    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values, estimatorOf(100)).generate(requestOf(COLUMNS, ENTRIES, [], undefined, 1000));

      // then
      expectFilled(result);
      expect([tableOf(result).gridColumnSpan, tableOf(result).gridRowSpan]).toEqual([1, 1]);
    }
  });

  it('#generate should give summary table two cells when its content exceeds a cell', () => {
    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values, estimatorOf(400)).generate(requestOf(COLUMNS, ENTRIES, [], undefined, 1000));

      // then
      expectFilled(result);
      expect([tableOf(result).gridColumnSpan, tableOf(result).gridRowSpan]).toEqual([2, 1]);
    }
  });

  it('#generate should give summary table two cells without container width', () => {

    // given
    const estimator = estimatorOf(0);

    // when
    const result = generatorOf([0.3], estimator).generate(requestOf(COLUMNS, ENTRIES));

    // then
    expect(estimator.estimate).not.toHaveBeenCalled();
    expect(tableOf(result).gridColumnSpan).toBe(2);
  });

  it('#generate should place small summary table in a small slot', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      chooseGridOf(4);
      const generate = TileSpecGenerator.prototype.generate;
      vi.spyOn(TileSpecGenerator.prototype, 'generate').mockImplementation(function (this: TileSpecGenerator, profiles, randomizer, combinations) {
        return generate.call(this, profiles, randomizer, combinations).filter(s => s.size !== TileSize.SMALL || !s.chartType);
      });

      // when
      const result = generatorOf(values, estimatorOf(100)).generate(requestOf(COLUMNS, ENTRIES, [], undefined, 1000));

      // then
      expectFilled(result);
      expect(tableOf(result).gridColumnSpan).toBe(1);
      expect(charts(result).filter(c => c.gridColumnSpan === 2).length).toBeGreaterThan(0);
    }
  });

  it('#generate should estimate only summary contexts created for the pick', () => {

    // given
    chooseGridOf(4);
    const createSummarySpy = vi.spyOn(TileContextFactory.prototype, 'createSummary');
    const estimator = estimatorOf(100);

    // when
    const result = generatorOf([0.3], estimator).generate(requestOf(COLUMNS, ENTRIES, [], undefined, 1000));

    // then
    const created = createSummarySpy.mock.results.map(r => r.value);
    const estimated = vi.mocked(estimator.estimate).mock.calls.map(([context]) => context);
    expect(estimated.length).toBeGreaterThan(1);
    estimated.forEach(context => expect(created).toContain(context));
    expect(estimated).toContain(tableOf(result));
  });

  it('#generate should feature stacked or single series area when only areas are time charts', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      generateSpecsMatching(s => !s.timeChart || s.chartType === ChartType.AREA);

      // when
      const result = generatorOf(values).generate(requestOf(COLUMNS, ENTRIES));

      // then
      expect((result.elementContexts[0] as ChartContext).chartType).toBe(ChartType.AREA.type);
      charts(result).filter(c => c.chartType === ChartType.AREA.type).forEach(c =>
        expect(c.stacked || new ChartDataService().createData(c).data.datasets.length === 1).toBe(true));
    }
  });

  it('#generate should reject stacked area of series with different time buckets', () => {

    // given
    generateSpecsMatching(s => !s.timeChart || s.chartType === ChartType.AREA);
    const validations: [ChartContext, boolean][] = [];
    spyIsValid((context, isValid) => {
      const valid = isValid();
      validations.push([context, valid]);
      return valid;
    });

    // when
    const result = generatorOf([0]).generate(requestOf(LOG_COLUMNS, LOG_ENTRIES));

    // then
    const isLevelArea = (c: ChartContext) => c.chartType === ChartType.AREA.type && c.dataColumns[0]?.name === 'Level';
    expect(validations.filter(([c]) => isLevelArea(c)).map(([, valid]) => valid)).toEqual([false]);
    const feature = result.elementContexts[0] as ChartContext;
    expect(feature.chartType).toBe(ChartType.AREA.type);
    expect(feature.isRowCountSelected()).toBe(true);
    expect(new ChartDataService().createData(feature).data.datasets.length).toBe(1);
    expect(charts(result).some(c => isLevelArea(c))).toBe(false);
  });

  [fruitSalesSampleOf, appLogsSampleOf].forEach(sampleOf => LANGUAGES.forEach(language =>
    it('#generate should create charts rendering without error from sample entries (' + sampleOf(language).file + ')', async () => {

    // given
    const response = await fetch('/assets/samples/' + sampleOf(language).file);
    expect(response.ok).toBe(true);
    const data: SampleData = await response.json();
    const entries = toEntries(data);

    for (const values of SEQUENCES) {

      // when
      const result = generatorOf(values).generate(requestOf(data.scene.columns, entries));

      // then
      expectFilled(result);
      expect(result.elementContexts.filter(c => c instanceof SummaryContext).length).toBe(1);
      charts(result).forEach(c => {
        const chartData = new ChartDataService().createData(c);
        expect(chartData.error).toBeUndefined();
        expect(chartData.data.datasets.length).toBeGreaterThan(0);
        expect(c.dataSampledDown).toBe(false);
      });
    }
  })));

  it('#generate should place first summary table with best score of its candidates', async () => {

    // given
    const data: SampleData = await (await fetch('/assets/samples/' + fruitSalesSampleOf('en').file)).json();
    const entries = toEntries(data);
    const scorer = new SummaryTablePicker(new TileContextFactory(new ChartMarginService()), new SummaryTableSizeEstimator());

    for (const columns of [3, 4, 5]) {
      for (const values of SEQUENCES) {
        vi.restoreAllMocks();
        chooseGridOf(columns);
        const pickSpy = vi.spyOn(SummaryTablePicker.prototype, 'pick');
        const request = requestOf(data.scene.columns, entries, [], undefined, 1500);

        // when
        const result = generatorOf(values).generate(request);

        // then
        const [candidates] = pickSpy.mock.calls[0];
        const picked = pickSpy.mock.results[0].value;
        const scores = candidates.slice(0, SummaryTablePicker.MAX_CANDIDATES).map(c => scorer.pick([c], request, columns).score);
        expect(picked.score).toBe(Math.max(...scores));
        expect(picked.score).toBeGreaterThan(0);
        expect(result.elementContexts).toContain(picked.context);
      }
    }
  });

  it('#generate should fill grid of food types and ratings with other chart types of the same columns', () => {
    for (const columns of [3, 4]) {
      for (const values of SEQUENCES) {

        // given
        vi.restoreAllMocks();
        chooseGridOf(columns);

        // when
        const result = generatorOf(values).generate(requestOf(RESTAURANT_COLUMNS, RESTAURANT_ENTRIES));

        // then
        expectFilled(result);
        const signatures = charts(result).map(c => TileSignature.ofContext(c));
        expect(new Set(signatures).size).toBeLessThan(signatures.length);
        const keys = charts(result).map(c => TileSignature.keyOfContext(c));
        expect(new Set(keys).size).toBe(keys.length);
        expect(graphsOf(result)).toEqual([]);
      }
    }
  });

  it('#generate should fill last cells with wide relationship graph of category pair when charts run out', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      chooseGridOf(5);

      // when
      const result = generatorOf(values, estimatorOf(100)).generate(requestOf(RESTAURANT_COLUMNS, RESTAURANT_ENTRIES, [], undefined, 1000));

      // then
      const graphs = graphsOf(result);
      expect(graphs.length).toBe(1);
      expect([graphs[0].gridColumnSpan, graphs[0].gridRowSpan]).toEqual([2, 1]);
      expect(graphs[0].groupByColumns.map(c => c.name)).toEqual(['Rating', 'Food']);
      expect(graphs[0].entries).toBe(RESTAURANT_ENTRIES);
      expect(charts(result).length).toBe(11);
      expectFilled(result);
    }
  });

  it('#generate should add second summary table dropped before other chart types when it completes the grid after them', () => {
    for (const values of SEQUENCES) {

      // given
      vi.restoreAllMocks();
      chooseGridOf(5);

      // when
      const result = generatorOf(values).generate(requestOf(RESTAURANT_COLUMNS, RESTAURANT_ENTRIES));

      // then
      expect(result.elementContexts.filter(c => c instanceof SummaryContext).map(t => t.gridColumnSpan)).toEqual([2, 2]);
      expect(charts(result).length).toBe(11);
      expect(graphsOf(result)).toEqual([]);
      expectFilled(result);
    }
  });

  it('#generate should complete underfilled row with wide relationship graph instead of widening charts', () => {

    // given
    chooseGridOf(5);
    generateWithoutUngroupedTables();
    spyIsValid((context, isValid) => context.chartType === ChartType.PIE.type && context.dataColumns[0].name === 'Level' && isValid());

    // when
    const result = generatorOf().generate(requestOf([LEVEL, REGION], ENTRIES));

    // then
    expect(tableOf(result).gridColumnSpan).toBe(2);
    expect(charts(result).map(c => c.gridColumnSpan)).toEqual([1]);
    const graphs = graphsOf(result);
    expect(graphs.map(g => g.gridColumnSpan)).toEqual([2]);
    expect(graphs[0].groupByColumns.map(c => c.name)).toEqual(['Region', 'Level']);
    expect(cellsOf(result).length).toBe(1);
    expect(cellsOf(result).flat().every(c => c)).toBe(true);
  });

  it('#generate should fill last cells with relationship graph of single category without category pair', () => {

    // given
    chooseGridOf(4);
    generateWithoutUngroupedTables();
    const entries = Array.from({ length: 60 }, (_, i) => ({ Rating: i % 6 }));

    // when
    const result = generatorOf().generate(requestOf([RATING], entries));

    // then
    const graphs = graphsOf(result);
    expect(graphs.length).toBe(1);
    expect(graphs[0].groupByColumns.map(c => c.name)).toEqual(['Rating']);
    expect(graphs[0].gridColumnSpan).toBe(2);
    expect(charts(result).length).toBe(6);
    expect(cellsOf(result).length).toBe(2);
    expect(cellsOf(result).flat().every(c => c)).toBe(true);
  });

  it('#generate should validate other chart types of accepted signatures within the same validation budget', () => {

    // given
    chooseGridOf(5);
    generateSpecsMatching(s => !!s.chartType && !s.groupByColumns.length);
    const signatures = new Set<string>();
    const validated = spyIsValid(context => {
      const signature = TileSignature.ofContext(context);
      const first = !signatures.has(signature);
      signatures.add(signature);
      return first;
    });

    // when
    generatorOf().generate(requestOf(categoryColumns(8), categoryEntries(8, [])));

    // then
    expect(validated.length).toBe(DashboardGenerator.MAX_VALIDATIONS);
  });

  it('#generate should not add relationship graph without category column', () => {

    // given
    chooseGridOf(5);
    generateWithoutUngroupedTables();
    const graphGroupings = vi.spyOn(TileSpecGenerator.prototype, 'graphGroupings');

    // when
    const result = generatorOf().generate(requestOf([TIME, AMOUNT], ENTRIES));

    // then
    expect(graphGroupings).toHaveReturnedWith([]);
    expect(graphsOf(result)).toEqual([]);
    expect(cellsOf(result).length).toBeLessThan(rowsOf(5));
  });

  it('#generate should include summary table and sampled scatter for many yearly values of two measures', () => {

    // given
    const ch4: Column = { name: 'CH4', dataType: DataType.NUMBER, width: 10 };
    const co2: Column = { name: 'CO2', dataType: DataType.NUMBER, width: 10 };
    const entries = Array.from({ length: 1500 }, (_, i) => ({ Time: new Date(500 + i, 0, 1).getTime(), CH4: 600 + i % 97, CO2: 270 + i % 41 }));

    // when
    const result = generatorOf().generate(requestOf([TIME, ch4, co2], entries));

    // then
    expect(result.elementContexts.some(c => c instanceof SummaryContext)).toBe(true);
    const scatters = charts(result).filter(c => c.chartType === ChartType.SCATTER.type);
    expect(scatters.length).toBeGreaterThan(0);
    expect(scatters.every(c => c.dataSampledDown)).toBe(true);
  });

  it('#generate should accept other chart types of accepted signatures before exceeding charts per chart type', () => {

    // given
    chooseGridOf(5);
    const name: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };
    const measures: Column[] = ['M1', 'M2', 'M3'].map(n => ({ name: n, dataType: DataType.NUMBER, width: 10 }));
    const entries = Array.from({ length: 6 }, (_, i) => ({ Name: ['A', 'B', 'C'][i % 3], M1: i * 10, M2: i * 7 % 6, M3: 50 - i * 3 }));
    const accepted: ChartContext[] = [];
    spyIsValid((context, isValid) => {
      const valid = isValid();
      if (valid) {
        accepted.push(context);
      }
      return valid;
    });

    // when
    generatorOf().generate(requestOf([name, ...measures], entries));

    // then
    const signatures = accepted.map(c => TileSignature.ofContext(c));
    const firstVariant = signatures.findIndex((s, i) => signatures.indexOf(s) < i);
    expect(firstVariant).toBeGreaterThan(0);
    const typesBeforeVariants = accepted.slice(0, firstVariant).map(c => c.chartType);
    typesBeforeVariants.forEach(t =>
      expect(typesBeforeVariants.filter(u => u === t).length).toBeLessThanOrEqual(DashboardGenerator.MAX_CHARTS_PER_TYPE));
  });

  it('#generate should fill remaining cells with charts of full chart types when no other chart type is valid', () => {

    // given
    chooseGridOf(4);
    generateSpecsMatching(s => s.chartType === ChartType.SCATTER);
    const measures: Column[] = ['M1', 'M2', 'M3', 'M4'].map(n => ({ name: n, dataType: DataType.NUMBER, width: 10 }));
    const entries = Array.from({ length: 12 }, (_, i) => ({ M1: i, M2: i * 7 % 12, M3: 30 - i * 2, M4: i * i % 11 }));

    // when
    const result = generatorOf().generate(requestOf(measures, entries));

    // then
    expect(charts(result).length).toBeGreaterThan(DashboardGenerator.MAX_CHARTS_PER_TYPE);
    charts(result).forEach(c => expect(c.chartType).toBe(ChartType.SCATTER.type));
    expectFilled(result);
  });

  it('#generate should not repeat time chart feature in other chart type', () => {
    const fixtures: [Column[], object[]][] = [[[TIME, AMOUNT], ENTRIES], [LOG_COLUMNS, LOG_ENTRIES]];
    for (const [columns, entries] of fixtures) {
      for (const gridColumns of [3, 4, 5]) {
        for (const values of SEQUENCES) {

          // given
          vi.restoreAllMocks();
          chooseGridOf(gridColumns);

          // when
          const result = generatorOf(values).generate(requestOf(columns, entries));

          // then
          const [feature, ...others] = result.elementContexts.map(c => TileSignature.ofContext(c));
          expect(isTimeChart(result.elementContexts[0] as ChartContext)).toBe(true);
          expect(others).not.toContain(feature);
        }
      }
    }
  });

});
