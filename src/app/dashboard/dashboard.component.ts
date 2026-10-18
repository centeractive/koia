import { CdkDragEnd, DragRef, Point } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, ElementRef, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { BoundingRectangle, Edges, ResizeEvent } from 'angular-resizable-element';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ViewController } from 'app/shared/controller';
import { View, ViewElement } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { LanguageService } from 'app/shared/services/language';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { firstValueFrom } from 'rxjs';
import { ElementContext, Route } from '../shared/model';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../shared/services';
import { FreeLayout } from './free-layout';
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
      this.confirm('dashboard.regenerate', 'dashboard.regenerateQuestion')
        .then(ok => {
          if (ok) {
            this.replaceByGeneratedElements();
          }
        });
    }
  }

  private async confirm(titleKey: string, questionKey: string): Promise<boolean> {
    const data = new ConfirmDialogData(LanguageService.instant(titleKey),
      '<p>' + LanguageService.instant(questionKey) + '</p>', ConfirmDialogData.YES_NO);
    await firstValueFrom(this.dialogService.showConfirmDialog(data).afterClosed());
    return data.closedWithButtonIndex === 0;
  }

  private replaceByGeneratedElements(): void {
    const result = this.dashboardGenerator.generate({
      columns: () => this.clonedColumns(),
      entries: this.entries,
      currentContexts: this.elementContexts,
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

  private applyRenderedTilePositions(elements: ViewElement[]): void {
    const cells = this.gridCellsRef?.nativeElement.getBoundingClientRect();
    if (cells?.width > 0) {
      const scale = cells.width / FreeLayout.PAGE_WIDTH;
      const tiles = elements.map((element, i) =>
        ({ element, rect: this.elementContainerDivRefs.get(i)?.nativeElement.parentElement.getBoundingClientRect() }));
      const renderedTiles = tiles.filter(t => t.rect?.width > 0 && t.rect.height > 0);
      const rects = this.freeLayout.fitToPages(renderedTiles.map(t =>
        this.freeLayout.rectFromRendered(t.rect.left - cells.left, t.rect.top - cells.top, t.rect.width, t.rect.height, scale)));
      tiles.forEach(t => t.element.x = t.element.y = undefined);
      renderedTiles.forEach((t, i) => Object.assign(t.element, rects[i], { z: i + 1 }));
    }
  }

  private applyGridSpans(elements: ViewElement[]): void {
    const canvasWidth = this.canvasPagesRef?.nativeElement.clientWidth;
    if (canvasWidth > 0) {
      const scale = canvasWidth / FreeLayout.PAGE_WIDTH;
      elements.sort((a, b) => a.y - b.y || a.x - b.x);
      elements.forEach(element => {
        const rect = this.freeLayout.rectOf(element);
        const spans = this.gridLayout.spansOf(rect.width * scale, rect.height * scale, this.contentWidth());
        element.gridColumnSpan = spans.columnSpan;
        element.gridRowSpan = spans.rowSpan;
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
    if (this.gridLayout.narrowsElements(gridColumns, this.elementContexts)) {
      this.confirm('dashboard.gridColumns', 'dashboard.confirmResize')
        .then(ok => {
          if (ok) {
            this.applyGridColumns(gridColumns);
          }
        });
    } else {
      this.applyGridColumns(gridColumns);
    }
  }

  private applyGridColumns(gridColumns: number): void {
    this.gridLayout.setGridColumns(gridColumns, this.elementContexts);
    this.requestPersist();
  }

  setGridCellRatio(gridCellRatio: string): void {
    this.gridLayout.setGridCellRatio(gridCellRatio, this.elementContexts);
    this.requestPersist();
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

  protected onElementContextAdded(): void {
    this.placeUnpositionedTiles(this.elementContexts);
  }

  private placeUnpositionedTiles(contexts: ElementContext[]): void {
    if (!this.isGridLayout()) {
      this.freeLayout.placeUnpositioned(contexts);
    }
  }

  onFreeMoveStarted(context: ElementContext): void {
    this.startCanvasInteraction(context);
  }

  readonly constrainFreeMove = (point: Point, _dragRef: DragRef, _dimensions: DOMRect, pickup: Point): Point => {
    const { context, scale, pagesRect, guides } = this.canvasInteraction;
    const livePagesRect = this.canvasPagesRef.nativeElement.getBoundingClientRect();
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
    });
  }

  private startCanvasInteraction(context: ElementContext): void {
    const pages = this.canvasPagesRef.nativeElement;
    const scale = pages.clientWidth / FreeLayout.PAGE_WIDTH;
    const others = this.elementContexts
      .filter(c => c !== context)
      .map(c => this.freeLayout.rectOf(c));
    this.canvasInteraction = {
      context,
      scale,
      pagesRect: pages.getBoundingClientRect(),
      page: this.freeLayout.pageOf(context),
      guides: new SnapGuides(others, this.freeLayout.pageIndexes(this.elementContexts).length, FreeLayout.SNAP_THRESHOLD_PX / scale)
    };
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
