import { ColorProviderFactory } from 'app/shared/color';
import { Column, ElementContext, SummaryContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { TableFitter } from 'app/shared/ui/table-fit/table-fitter';
import { SummaryTableWidthEstimator } from 'app/summary-table/summary-table-width-estimator';
import { GridLayout } from '../grid-layout';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ChartSpecPicker } from './chart-spec-picker';
import { ColorOptionsChooser } from './color-options-chooser';
import { ColumnProfiler } from './column-profiler';
import { GridChooser, GridDef, rowsOf } from './generated-grid';
import { GridPlanner } from './grid-planner';
import { RandomSource } from './random-source';
import { Randomizer } from './randomizer';
import { TileContextFactory } from './tile-context-factory';
import { TileSize, TileSpec } from './tile-spec';
import { TileSpecGenerator } from './tile-spec-generator';
import { TileSpecRanker } from './tile-spec-ranker';
import { TileValidator } from './tile-validator';

export interface GenerationRequest {
  /** returns fresh column clones on every call */
  columns: () => Column[];
  entries: object[];
  currentContexts: ElementContext[];
  currentGrid: GridDef;
  /** width of the grid scroller without scrollbar, 0 when unknown */
  containerWidth: number;
}

interface GeneratedTable {
  context: SummaryContext;
  size: TileSize;
}

export interface GeneratedDashboard {
  grid: GridDef;
  elementContexts: ElementContext[];
}

/**
 * composes a dashboard of valid charts and up to two summary tables that fill the rows of a newly chosen grid
 */
export class DashboardGenerator {

  static readonly MAX_VALIDATIONS = 40;

  private readonly randomizer: Randomizer;
  private readonly profiler = new ColumnProfiler();
  private readonly specGenerator = new TileSpecGenerator();
  private readonly ranker = new TileSpecRanker();
  private readonly picker = new ChartSpecPicker();
  private readonly factory: TileContextFactory;
  private readonly validator: TileValidator;
  private readonly gridChooser: GridChooser;
  private readonly planner: GridPlanner;
  private readonly colorChooser: ColorOptionsChooser;

  constructor(chartMarginService: ChartMarginService, chartDataService: ChartDataService, randomSource: RandomSource,
    private readonly tableWidthEstimator = new SummaryTableWidthEstimator()) {
    this.randomizer = new Randomizer(randomSource);
    this.factory = new TileContextFactory(chartMarginService);
    this.validator = new TileValidator(chartDataService);
    this.gridChooser = new GridChooser(this.randomizer);
    this.planner = new GridPlanner(this.randomizer);
    this.colorChooser = new ColorOptionsChooser(this.randomizer);
  }

  generate(request: GenerationRequest): GeneratedDashboard | undefined {
    if (!request.entries?.length) {
      return undefined;
    }
    const profiles = this.profiler.profile(request.columns(), request.entries);
    if (!profiles.length) {
      return undefined;
    }
    const specs = this.specGenerator.generate(profiles, this.randomizer, new CategoryCombinationCounter(request.entries));
    if (!specs.length) {
      return undefined;
    }
    const grid = this.gridChooser.next(request.currentGrid);
    const rows = rowsOf(grid.columns);
    const ranked = this.ranker.rank(specs, request.currentContexts, this.randomizer);
    const accepted = new Set<string>();
    const invalidSpecs = new Set<TileSpec>();

    const feature = this.findFeature(ranked, request, accepted, invalidSpecs);
    const tables = [this.createTable(ranked, request, accepted, grid.columns)].filter(t => t !== undefined);
    const wideCharts: ChartContext[] = [];
    const smallCharts: ChartContext[] = [];
    const remainingRows = rows - (feature ? 1 : 0);
    const tablesOf = (withTables: GeneratedTable[], size: TileSize) => withTables.filter(t => t.size === size).map(t => t.context);
    const fillableRows = (withTables: GeneratedTable[]) => {
      const wideTables = tablesOf(withTables, TileSize.WIDE).length;
      return this.planner.fillableRows(grid.columns, remainingRows, wideTables + wideCharts.length,
        withTables.length - wideTables + smallCharts.length, wideTables);
    };
    const usedChartTypes = new Set<ChartType>(feature ? [ChartType.fromType(feature.chartType)] : []);
    let validations = 0;
    while (validations < DashboardGenerator.MAX_VALIDATIONS && fillableRows(tables) < remainingRows) {
      const spec = this.picker.next(ranked, accepted, invalidSpecs, usedChartTypes);
      if (!spec) {
        break;
      }
      const context = this.factory.createChart(spec, request.columns(), request.entries);
      validations++;
      if (this.validator.isValid(context)) {
        accepted.add(spec.signature);
        usedChartTypes.add(spec.chartType);
        (spec.size === TileSize.SMALL ? smallCharts : wideCharts).push(context);
      } else {
        invalidSpecs.add(spec);
      }
    }
    if (fillableRows(tables) < remainingRows) {
      const secondTable = this.createTable(ranked, request, accepted, grid.columns);
      if (secondTable && fillableRows([...tables, secondTable]) > fillableRows(tables)) {
        tables.push(secondTable);
      }
    }
    if (!feature && !tables.length && !wideCharts.length && !smallCharts.length) {
      return undefined;
    }

    const wideTables = tablesOf(tables, TileSize.WIDE);
    const wides = [...wideTables, ...wideCharts];
    const smalls = [...tablesOf(tables, TileSize.SMALL), ...smallCharts];
    const plan = this.planner.plan(grid.columns, rows, !!feature, wides.length, smalls.length, tables[0]?.size === TileSize.SMALL,
      wideTables.length);
    const elementContexts = this.assign(plan, feature, wides, smalls, grid.columns);
    this.applyColors(elementContexts, request.currentContexts);
    return { grid, elementContexts };
  }

  private findFeature(ranked: TileSpec[], request: GenerationRequest, accepted: Set<string>, invalidSpecs: Set<TileSpec>):
    ChartContext | undefined {
    let validations = 0;
    for (const spec of ranked.filter(s => s.timeChart)) {
      if (validations >= DashboardGenerator.MAX_VALIDATIONS) {
        break;
      }
      const context = this.factory.createChart(spec, request.columns(), request.entries);
      validations++;
      if (this.validator.isValid(context)) {
        accepted.add(spec.signature);
        return context;
      }
      invalidSpecs.add(spec);
    }
    return undefined;
  }

  /**
   * creates the summary table that spans one cell when its estimated content width fits a cell, otherwise two cells
   */
  private createTable(ranked: TileSpec[], request: GenerationRequest, accepted: Set<string>, gridColumns: number):
    GeneratedTable | undefined {
    const spec = ranked.find(s => !s.chartType && !accepted.has(s.signature));
    if (!spec) {
      return undefined;
    }
    accepted.add(spec.signature);
    const context = this.factory.createSummary(spec, request.columns(), request.entries);
    const cellWidth = request.containerWidth / gridColumns - GridLayout.GAP_PX;
    const fits = request.containerWidth > 0 && !TableFitter.hasHorizontalOverflow(this.tableWidthEstimator.estimate(context), cellWidth);
    return { context, size: fits ? TileSize.SMALL : TileSize.WIDE };
  }

  /**
   * assigns the contexts to the planned sizes in DOM order, wide contexts left over by wide slots fill small slots after the
   * small contexts, charts widened to fill an underfilled last row
   */
  private assign(plan: TileSize[], feature: ChartContext | undefined, wides: ElementContext[], smalls: ElementContext[],
    gridColumns: number): ElementContext[] {
    const wideSlots = plan.filter(s => s === TileSize.WIDE).length;
    const wideQueue = wides.slice(0, wideSlots);
    const smallQueue = [...smalls, ...wides.slice(wideSlots)];
    const contexts = plan.map(size =>
      size === TileSize.FEATURE ? feature : size === TileSize.WIDE ? wideQueue.shift() : smallQueue.shift());
    const spans = GridPlanner.columnSpansOf(plan, gridColumns, contexts.map(c => c instanceof ChartContext));
    contexts.forEach((c, i) => this.factory.applyColumnSpan(c, spans[i]));
    return contexts;
  }

  private applyColors(elementContexts: ElementContext[], currentContexts: ElementContext[]): void {
    const colorOptions = this.colorChooser.next(currentContexts.length ?
      currentContexts.map(c => c.colorProvider.options) : [ColorProviderFactory.create().options]);
    elementContexts.forEach(c => c.colorProvider = ColorProviderFactory.create({ ...colorOptions }));
  }
}
