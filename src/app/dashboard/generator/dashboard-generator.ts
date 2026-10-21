import { ColorProviderFactory } from 'app/shared/color';
import { Column, ElementContext } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { ChartDataService } from 'app/shared/services/chart/chart-data.service';
import { ChartMarginService } from 'app/shared/services/chart/chart-margin.service';
import { TableFitter } from 'app/shared/ui/table-fit/table-fitter';
import { SummaryTableWidthEstimator } from 'app/summary-table/summary-table-width-estimator';
import { GridLayout } from '../grid-layout';
import { CategoryCombinationCounter } from './category-combination-counter';
import { ChartSpecPicker } from './chart-spec-picker';
import { ColorOptionsChooser } from './color-options-chooser';
import { ColumnProfile } from './column-profile';
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

/**
 * a summary table or a relationship graph, never widened
 */
interface SizedTile {
  context: ElementContext;
  size: TileSize;
}

export interface GeneratedDashboard {
  grid: GridDef;
  elementContexts: ElementContext[];
}

/**
 * composes a dashboard of valid charts, up to two summary tables and, as last resort, one relationship graph that fill the rows of
 * a newly chosen grid
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
    const combinations = new CategoryCombinationCounter(request.entries);
    const specs = this.specGenerator.generate(profiles, this.randomizer, combinations);
    if (!specs.length) {
      return undefined;
    }
    const grid = this.gridChooser.next(request.currentGrid);
    const rows = rowsOf(grid.columns);
    const ranked = this.ranker.rank(specs, request.currentContexts, this.randomizer);
    const accepted = new Set<string>();
    const chartSignatures = new Set<string>();
    const acceptedKeys = new Set<string>();
    const invalidSpecs = new Set<TileSpec>();

    const feature = this.findFeature(ranked, request, accepted, invalidSpecs);
    const tiles: SizedTile[] = [this.createTable(ranked, request, accepted, grid.columns)].filter(t => t !== undefined);
    const wideCharts: ChartContext[] = [];
    const smallCharts: ChartContext[] = [];
    const remainingRows = rows - (feature ? 1 : 0);
    const tilesOf = (withTiles: SizedTile[], size: TileSize) => withTiles.filter(t => t.size === size).map(t => t.context);
    const fillableRows = (withTiles: SizedTile[]) => {
      const wideTiles = tilesOf(withTiles, TileSize.WIDE).length;
      return this.planner.fillableRows(grid.columns, remainingRows, wideTiles + wideCharts.length,
        withTiles.length - wideTiles + smallCharts.length, wideTiles);
    };
    const fillsMoreRows = (tile: SizedTile) => fillableRows([...tiles, tile]) > fillableRows(tiles);
    const usedChartTypes = new Set<ChartType>(feature ? [ChartType.fromType(feature.chartType)] : []);
    let validations = 0;
    const acceptCharts = (next: () => TileSpec | undefined) => {
      while (validations < DashboardGenerator.MAX_VALIDATIONS && fillableRows(tiles) < remainingRows) {
        const spec = next();
        if (!spec) {
          break;
        }
        const context = this.factory.createChart(spec, request.columns(), request.entries);
        validations++;
        if (this.validator.isValid(context)) {
          accepted.add(spec.signature);
          chartSignatures.add(spec.signature);
          acceptedKeys.add(spec.key);
          usedChartTypes.add(spec.chartType);
          (spec.size === TileSize.SMALL ? smallCharts : wideCharts).push(context);
        } else {
          invalidSpecs.add(spec);
        }
      }
    };
    acceptCharts(() => this.picker.next(ranked, accepted, invalidSpecs, usedChartTypes));
    const secondTable = fillableRows(tiles) < remainingRows ? this.createTable(ranked, request, accepted, grid.columns) : undefined;
    const addSecondTable = () => {
      if (secondTable && !tiles.includes(secondTable) && fillsMoreRows(secondTable)) {
        tiles.push(secondTable);
      }
    };
    addSecondTable();
    acceptCharts(() => this.picker.nextVariant(ranked, chartSignatures, acceptedKeys, invalidSpecs, usedChartTypes));
    addSecondTable();
    if (fillableRows(tiles) < remainingRows) {
      const graph = this.createGraph(profiles, combinations, request, fillsMoreRows);
      if (graph) {
        tiles.push(graph);
      }
    }
    if (!feature && !tiles.length && !wideCharts.length && !smallCharts.length) {
      return undefined;
    }

    const wideTiles = tilesOf(tiles, TileSize.WIDE);
    const wides = [...wideTiles, ...wideCharts];
    const smalls = [...tilesOf(tiles, TileSize.SMALL), ...smallCharts];
    const plan = this.planner.plan(grid.columns, rows, !!feature, wides.length, smalls.length, tiles[0]?.size === TileSize.SMALL,
      wideTiles.length);
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
    SizedTile | undefined {
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
   * creates the relationship graph that spans two cells when that fills more rows, otherwise one cell when that does
   */
  private createGraph(profiles: ColumnProfile[], combinations: CategoryCombinationCounter, request: GenerationRequest,
    fillsMoreRows: (tile: SizedTile) => boolean): SizedTile | undefined {
    const groupings = this.specGenerator.graphGroupings(profiles, combinations);
    if (!groupings.length) {
      return undefined;
    }
    const context = this.factory.createGraph(groupings, request.columns(), request.entries);
    return [TileSize.WIDE, TileSize.SMALL].map(size => ({ context, size })).find(fillsMoreRows);
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
