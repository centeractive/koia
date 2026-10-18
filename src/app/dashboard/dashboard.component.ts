import { CdkDragEnd, DragRef, Point } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { BoundingRectangle, Edges, ResizeEvent } from 'angular-resizable-element';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ViewController } from 'app/shared/controller';
import { View, ViewElement } from 'app/shared/model/view-config';
import { TextBox } from 'app/shared/services/view-persistence';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { LanguageService } from 'app/shared/services/language';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { firstValueFrom } from 'rxjs';
import { ElementContext, Route, TextBoxContext } from '../shared/model';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../shared/services';
import { FreeLayout, Rect, TileRect } from './free-layout';
import { DashboardGenerator } from './generator/dashboard-generator';
import { MathRandomSource } from './generator/random-source';
import { GridLayout, GridSpans } from './grid-layout';
import { resizableEdges } from './resizable-edges';
import { Guide, Snap, SnapGuides } from './snap-guides';

interface CanvasInteraction {
  context: ElementContext;
  scale: number;
  pagesRect: DOMRect;
  page: number;
  guides: SnapGuides;
  /** rendered rects of the grid tiles an overlay may be anchored to, empty in free layout */
  anchorTiles: TileRect<ElementContext>[];
  snap?: Snap;
}

@Component({
  selector: 'koia-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DashboardComponent extends ViewController {

  readonly gridColumnChoices = GridLayout.COLUMN_CHOICES;
  readonly gridCellRatioChoices = GridLayout.CELL_RATIO_CHOICES;
  readonly gridLayout = new GridLayout();
  readonly freeLayout = new FreeLayout();
  @ViewChild('gridCells') gridCellsRef: ElementRef<HTMLDivElement>;
  @ViewChild('canvasPages') canvasPagesRef: ElementRef<HTMLDivElement>;
  resizePreview: { left: number, top: number, width: number, height: number };
  canvasGuides: Guide[] = [];
  private gridResizeContentWidth: number;
  private canvasInteraction: CanvasInteraction;

  private readonly dashboardGenerator: DashboardGenerator;

  constructor(router: Router, bottomSheet: MatBottomSheet, dbService: DBService, dialogService: DialogService,
    viewPersistenceService: ViewPersistenceService, chartMarginService: ChartMarginService, notificationService: NotificationService,
    exportService: ExportService, viewTabsService: ViewTabsService, chartDataService: ChartDataService) {
    super(Route.GRID, router, bottomSheet, dbService, dialogService, viewPersistenceService, chartMarginService, notificationService,
      exportService, viewTabsService);
    this.dashboardGenerator = new DashboardGenerator(chartMarginService, chartDataService, new MathRandomSource());
  }

  isGridLayout(): boolean {
    return this.route === Route.GRID;
  }

  toggleGridLayout(): void {
    this.setLayout(this.isGridLayout() ? Route.FLEX : Route.GRID);
  }

  setLayout(route: Route): void {
    if (route !== this.route) {
      const view = this.toView('');
      if (route === Route.FLEX) {
        this.applyRenderedTilePositions(view.elements);
      } else {
        this.applyGridSpans(view.elements);
      }
      this.closeSideBar();
      this.route = route;
      this.elementContexts = this.restoreElementContexts(view.elements);
      this.renderChartsOnceCreated(this.elementContexts);
      this.requestPersist();
    }
  }

  private closeSideBar(): void {
    this.sidenav.close();
    this.selectedContext = undefined;
    this.selectedContextPosition = undefined;
  }

  generateDashboard(): void {
    if (this.elementContexts.length === 0) {
      this.replaceByGeneratedElements();
    } else {
      const data = new ConfirmDialogData(LanguageService.instant('dashboard.regenerate'),
        '<p>' + LanguageService.instant('dashboard.regenerateQuestion') + '</p>', ConfirmDialogData.YES_NO);
      firstValueFrom(this.dialogService.showConfirmDialog(data).afterClosed())
        .then(() => {
          if (data.closedWithButtonIndex === 0) {
            this.replaceByGeneratedElements();
          }
        });
    }
  }

  private replaceByGeneratedElements(): void {
    const result = this.dashboardGenerator.generate({
      columns: () => this.clonedColumns(),
      entries: this.entries,
      currentContexts: this.elementContexts.filter(c => !this.isTextBoxContext(c)),
      currentGrid: { columns: this.gridLayout.gridColumns, cellRatio: this.gridLayout.gridCellRatio },
      containerWidth: this.generationContainerWidth()
    });
    if (!result) {
      this.notifyWarning(LanguageService.instant('dashboard.nothingToGenerate'));
      return;
    }
    this.closeSideBar();
    this.route = Route.GRID;
    this.gridLayout.gridColumns = result.grid.columns;
    this.gridLayout.gridCellRatio = result.grid.cellRatio;
    this.elementContexts = this.bindElementContexts(result.elementContexts);
    this.renderChartsOnceCreated(this.elementContexts);
    setTimeout(() => this.divContentRef.nativeElement.scrollTo({ top: 0 }));
    this.requestPersist();
  }

  /**
   * returns the width of the scroller as if a vertical scrollbar were shown, as the generated grid usually scrolls
   */
  private generationContainerWidth(): number {
    return this.divContentRef.nativeElement.offsetWidth - DomMetrics.scrollbarWidth();
  }

  /**
   * fits the rendered tiles to pages, overlays keep their offset to the fitted anchor tile, all within its page
   */
  private applyRenderedTilePositions(elements: ViewElement[]): void {
    if (this.gridCellsRef?.nativeElement.getBoundingClientRect().width > 0) {
      const rendered = this.renderedGridRects()
        .map((r, i) => ({ element: elements[i], overlay: r.tile.isOverlay(), layerRect: r.rect }))
        .filter(t => t.layerRect.width > 0 && t.layerRect.height > 0);
      const renderedTiles = rendered.filter(t => !t.overlay);
      const rects = this.freeLayout.fitToPages(renderedTiles.map(t => t.layerRect));
      elements.forEach(element => element.x = element.y = undefined);
      renderedTiles.forEach((t, i) => Object.assign(t.element, rects[i], { z: i + 1 }));
      rendered.filter(t => t.overlay).forEach((t, i) => {
        const textBox = t.element as TextBox;
        const anchorRect = rects[renderedTiles.findIndex(r => r.element === elements[textBox.anchor])];
        const rect = anchorRect ? this.positionInAnchor(textBox, t.layerRect, anchorRect) : t.layerRect;
        const pageTop = FreeLayout.pageTopOf((anchorRect ?? rect).y);
        Object.assign(textBox, this.freeLayout.clampIntoPage(rect, pageTop), { z: renderedTiles.length + i + 1 });
      });
    }
  }

  private positionInAnchor(textBox: TextBox, rect: Rect, anchorRect: Rect): Rect {
    return {
      ...rect,
      x: Math.round(anchorRect.x + textBox.anchorX * anchorRect.width),
      y: Math.round(anchorRect.y + textBox.anchorY * anchorRect.height)
    };
  }

  /**
   * derives the spans of the tiles from their canvas size, overlays get anchored to the tile below their top left corner
   */
  private applyGridSpans(elements: ViewElement[]): void {
    const canvasWidth = this.canvasPagesRef?.nativeElement.clientWidth;
    if (canvasWidth > 0) {
      const scale = canvasWidth / FreeLayout.PAGE_WIDTH;
      const overlays = elements.filter((_element, i) => this.elementContexts[i].isOverlay()) as TextBox[];
      elements.sort((a, b) => a.y - b.y || a.x - b.x);
      const tiles = elements.filter(e => !overlays.includes(e as TextBox));
      tiles.forEach(element => {
        const rect = this.freeLayout.rectOf(element);
        const spans = this.gridLayout.spansOf(rect.width * scale, rect.height * scale, this.contentWidth());
        element.gridColumnSpan = spans.columnSpan;
        element.gridRowSpan = spans.rowSpan;
      });
      const tileRects = tiles.map(tile => ({ tile, rect: this.freeLayout.rectOf(tile) }));
      overlays.forEach(textBox => {
        const anchoring = this.freeLayout.anchorAt(this.freeLayout.rectOf(textBox), tileRects);
        textBox.anchor = anchoring && elements.indexOf(anchoring.tile);
        textBox.anchorX = anchoring?.offset.x;
        textBox.anchorY = anchoring?.offset.y;
      });
    }
  }

  private contentWidth(): number {
    return this.divContentRef?.nativeElement.clientWidth;
  }

  private renderChartsOnceCreated(contexts: ElementContext[]): void {
    if (this.entries) {
      setTimeout(() => contexts
        .filter(c => this.isChartContext(c) && c.hasDataColumn())
        .forEach(c => c.fireStructureChanged()));
    }
  }

  setGridColumns(gridColumns: number): void {
    this.gridLayout.setGridColumns(gridColumns, this.elementContexts);
    this.requestPersist();
  }

  setGridCellRatio(gridCellRatio: string): void {
    this.gridLayout.setGridCellRatio(gridCellRatio, this.elementContexts);
    this.requestPersist();
  }

  gridCellsStyle(): object {
    return { ...this.gridLayout.gridStyle(), ...this.freeLayout.canvasStyle() };
  }

  /**
   * @returns the anchor name of the tile of the given context, unique within the grid
   */
  anchorNameOf(context: ElementContext): string {
    return '--koia-tile-' + this.elementContexts.indexOf(context);
  }

  resizableEdgesOf(context: ElementContext): Edges {
    return resizableEdges(this.isShowResizableMargin(context));
  }

  onGridResizeStart(): void {
    this.gridResizeContentWidth = this.contentWidth();
  }

  onGridResizing(resizeEvent: ResizeEvent): void {
    const rect = resizeEvent.rectangle;
    const spans = this.resizedGridSpansOf(rect);
    this.resizePreview = { left: rect.left, top: rect.top, ...this.gridLayout.tileSizeOf(spans, this.gridResizeContentWidth) };
  }

  onGridResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    const spans = this.resizedGridSpansOf(resizeEvent.rectangle);
    context.gridColumnSpan = spans.columnSpan;
    context.gridRowSpan = spans.rowSpan;
    this.resizePreview = undefined;
  }

  private resizedGridSpansOf(rect: BoundingRectangle): GridSpans {
    const cw = this.gridResizeContentWidth;
    return this.gridLayout.coveredSpansOf(rect.width, rect.height, this.gridLayout.columnOf(rect.left, cw), cw);
  }

  protected override restoreElementContexts(elements: ViewElement[]): ElementContext[] {
    const contexts = super.restoreElementContexts(elements);
    this.placeUnpositionedTiles(contexts);
    return contexts;
  }

  protected onElementContextAdded(context: ElementContext): void {
    this.placeUnpositionedTiles(this.elementContexts);
    if (this.isGridLayout() && context.isOverlay()) {
      this.anchorToTileBelow(context as TextBoxContext, this.freeLayout.rectOf(context), this.renderedGridTileRects());
    }
  }

  private placeUnpositionedTiles(contexts: ElementContext[]): void {
    if (this.isGridLayout()) {
      this.freeLayout.placeUnpositionedOverlays(contexts, this.visibleGridTop());
    } else {
      this.freeLayout.placeUnpositioned(contexts);
    }
  }

  /**
   * @returns the top of the visible part of the grid in page units, 0 when the grid is not rendered
   */
  private visibleGridTop(): number {
    const cells = this.gridCellsRef?.nativeElement.getBoundingClientRect();
    if (!(cells?.width > 0)) {
      return 0;
    }
    const scale = cells.width / FreeLayout.PAGE_WIDTH;
    return Math.max(0, (this.divContentRef.nativeElement.getBoundingClientRect().top - cells.top) / scale);
  }

  private anchorToTileBelow(context: TextBoxContext, rect: Rect, tiles: TileRect<ElementContext>[]): void {
    const anchoring = this.freeLayout.anchorAt(rect, tiles);
    if (anchoring) {
      context.setAnchor(anchoring.tile, anchoring.offset);
    } else {
      context.clearAnchor();
    }
  }

  private renderedGridTileRects(): TileRect<ElementContext>[] {
    return this.renderedGridRects().filter(r => !r.tile.isOverlay());
  }

  /**
   * @returns the rendered rects of the grid's tiles and overlays in page units, relative to the grid cells
   */
  private renderedGridRects(): TileRect<ElementContext>[] {
    const cellsRect = this.gridCellsRef.nativeElement.getBoundingClientRect();
    const scale = cellsRect.width / FreeLayout.PAGE_WIDTH;
    return this.elementContainerDivRefs.map((ref, i) => {
      const r = ref.nativeElement.parentElement.getBoundingClientRect();
      return {
        tile: this.elementContexts[i],
        rect: this.freeLayout.rectFromRendered(r.left - cellsRect.left, r.top - cellsRect.top, r.width, r.height, scale)
      };
    });
  }

  /**
   * in grid layout, text boxes anchored to the removed tile stay where they are drawn
   */
  override removeElement(context: ElementContext): void {
    const anchored = this.textBoxesAnchoredTo(context);
    if (this.isGridLayout() && anchored.length) {
      const rects = this.renderedGridRects();
      anchored.forEach(textBox => {
        const rect = rects.find(r => r.tile === textBox).rect;
        textBox.setPosition(rect.x, rect.y);
      });
    }
    super.removeElement(context);
  }

  onFreeMoveStarted(context: ElementContext): void {
    this.startCanvasInteraction(context);
  }

  readonly constrainFreeMove = (point: Point, _dragRef: DragRef, _dimensions: DOMRect, pickup: Point): Point => {
    const { context, scale, pagesRect, guides } = this.canvasInteraction;
    const livePagesRect = this.layerElement().getBoundingClientRect();
    const snap = guides.snapMove({
      ...this.freeLayout.rectOf(context),
      x: (point.x - pickup.x - livePagesRect.left) / scale,
      y: (point.y - pickup.y - livePagesRect.top) / scale
    });
    this.canvasInteraction.snap = snap;
    return { x: pagesRect.left + snap.rect.x * scale, y: pagesRect.top + snap.rect.y * scale };
  };

  onFreeMoving(): void {
    this.canvasGuides = this.canvasInteraction.snap?.guides ?? [];
  }

  onFreeMoveEnded(context: ElementContext, event: CdkDragEnd): void {
    const { snap, page } = this.canvasInteraction;
    if (snap) {
      context.setPosition(snap.rect.x, snap.rect.y);
      this.anchorInGrid(context, snap.rect);
      if (this.freeLayout.pageOf(context) !== page) {
        this.renderChartsOnceCreated([context]);
      }
    }
    this.endCanvasInteraction();
    event.source.reset();
    this.bringToFront(context);
  }

  onFreeResizeStart(context: ElementContext): void {
    this.startCanvasInteraction(context);
  }

  onFreeResizing(context: ElementContext, resizeEvent: ResizeEvent): void {
    const snap = this.freeResizeSnapOf(context, resizeEvent);
    const scale = this.canvasInteraction.scale;
    this.resizePreview = {
      left: snap.rect.x * scale,
      top: snap.rect.y * scale,
      width: snap.rect.width * scale,
      height: snap.rect.height * scale
    };
    this.canvasGuides = snap.guides;
  }

  onFreeResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    if (Object.values(resizeEvent.edges).some(delta => delta !== 0)) {
      const snap = this.freeResizeSnapOf(context, resizeEvent);
      context.setSize(snap.rect.width, snap.rect.height);
      this.anchorInGrid(context, snap.rect);
      this.bringToFront(context);
    }
    this.resizePreview = undefined;
    this.endCanvasInteraction();
  }

  private freeResizeSnapOf(context: ElementContext, resizeEvent: ResizeEvent): Snap {
    const { scale, guides } = this.canvasInteraction;
    return guides.snapResize({
      ...this.freeLayout.rectOf(context),
      width: resizeEvent.rectangle.width / scale,
      height: resizeEvent.rectangle.height / scale
    }, this.freeLayout.minSizeOf(context));
  }

  private anchorInGrid(context: ElementContext, rect: Rect): void {
    if (this.isGridLayout()) {
      this.anchorToTileBelow(context as TextBoxContext, rect, this.canvasInteraction.anchorTiles);
    }
  }

  /**
   * in grid layout, the overlay's position is first taken from where it is drawn, as it follows its anchor tile
   */
  private startCanvasInteraction(context: ElementContext): void {
    const layer = this.layerElement();
    const scale = layer.clientWidth / FreeLayout.PAGE_WIDTH;
    const threshold = FreeLayout.SNAP_THRESHOLD_PX / scale;
    let guides: SnapGuides;
    let anchorTiles: TileRect<ElementContext>[] = [];
    if (this.isGridLayout()) {
      const rects = this.renderedGridRects();
      const rect = rects.find(r => r.tile === context).rect;
      context.setPosition(rect.x, rect.y);
      guides = new SnapGuides(rects.filter(r => r.tile !== context).map(r => r.rect), 0, threshold, false);
      anchorTiles = rects.filter(r => !r.tile.isOverlay());
    } else {
      const others = this.elementContexts
        .filter(c => c !== context)
        .map(c => this.freeLayout.rectOf(c));
      guides = new SnapGuides(others, this.freeLayout.pageIndexes(this.elementContexts).length, threshold);
    }
    this.canvasInteraction = {
      context,
      scale,
      pagesRect: layer.getBoundingClientRect(),
      page: this.freeLayout.pageOf(context),
      guides,
      anchorTiles
    };
  }

  private layerElement(): HTMLDivElement {
    return (this.isGridLayout() ? this.gridCellsRef : this.canvasPagesRef).nativeElement;
  }

  private endCanvasInteraction(): void {
    this.canvasInteraction = undefined;
    this.canvasGuides = [];
  }

  bringToFront(context: ElementContext): void {
    this.freeLayout.bringToFront(context, this.elementContexts);
    this.requestPersist();
  }

  sendToBack(context: ElementContext): void {
    this.freeLayout.sendToBack(context, this.elementContexts);
    this.requestPersist();
  }

  protected onPreRestoreView(view: View): void {
    this.route = view.route;
    if (view.gridColumns) {
      this.gridLayout.gridColumns = view.gridColumns;
    }
    if (view.gridCellRatio) {
      this.gridLayout.gridCellRatio = view.gridCellRatio;
    }
  }

  protected onPreSaveView(view: View): void {
    view.gridColumns = this.gridLayout.gridColumns;
    view.gridCellRatio = this.gridLayout.gridCellRatio;
  }
}
