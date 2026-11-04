import { CdkDragEnd, CdkDragMove, DragRef, Point } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, inject, NgZone, Renderer2, ViewChild } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatMenu } from '@angular/material/menu';
import { Router } from '@angular/router';
import { Edges, ResizeEvent } from 'angular-resizable-element';
import { confirmYesNo, ViewController } from 'app/shared/controller';
import { View, ViewElement } from 'app/shared/model/view-config';
import { TextBox } from 'app/shared/services/view-persistence';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { LanguageService } from 'app/shared/services/language';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { listenToDocumentOutsideAngular } from 'app/shared/ui/document-listener';
import { isRendered } from 'app/shared/ui/rendered';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { CanvasPaging, ElementContext, Route, TextBoxContext } from '../shared/model';
import { DialogService, ExportService, NotificationService } from '../shared/services';
import { DragAutoScroll } from './drag-auto-scroll';
import { CanvasClipboard } from './canvas-clipboard';
import { CanvasEditor, CanvasEditorHost } from './canvas-editor';
import { CanvasLayerMapping, rectOfClient } from './canvas-layer-mapping';
import { isCanvasKey, shortcutLabelOf } from './canvas-shortcuts';
import { containsRect, FreeLayout, intersects, Rect, Size, TileRect } from './free-layout';
import { DashboardGenerator } from './generator/dashboard-generator';
import { MathRandomSource } from './generator/random-source';
import { GridLayout, GridSpans } from './grid-layout';
import { GroupDrag, translateBetween } from './group-drag';
import { GroupResize } from './group-resize';
import { GridResizeSession } from './grid-resize-session';
import { isLegacyFlexView } from './legacy-flex-view';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { PageReflow } from './page-reflow';
import { RESIZE_CURSORS } from './resize-handles/resize-handles.component';
import { RowInsertion } from './row-insertion';
import { RowRoom } from './row-room';
import { MarqueeEnd } from './marquee.directive';
import { OverlapResolver } from './overlap-resolver';
import { blurActiveElement, CONTROLS, isAdditiveClick, isContentPress, isOverlayTarget, isSelectingClick } from './selecting-click';
import { SelectionBounds, selectionBoundsOf } from './selection-bounds';
import { Guide, MovedEdges, Snap, SnapGuides } from './snap-guides';
import { textBoxTileStyle } from './text-box-tile-style';
import { TileSelection } from './tile-selection';
import { visibleCenterOf } from './visible-center';
import type { TextExtent } from 'app/text-box/text-fit';
import type { TextBoxComponent } from 'app/text-box/text-box.component';

interface CanvasInteraction {
  context: ElementContext;
  scale: number;
  pagesRect: DOMRect;
  guides: SnapGuides;
  /** rendered rects of the grid tiles an overlay may be anchored to, empty in free layout */
  anchorTiles: TileRect<ElementContext>[];
  /** the moved tiles, the context alone unless it is moved with the other selected tiles */
  group: GroupDrag<ElementContext>;
  /** the snapped rect of the context, the bounds of the moved tiles while moved together */
  snap?: Snap;
  /** scrolls the content while a tile is moved, none while resizing */
  autoScroll?: DragAutoScroll;
  /** the resize of the selected tiles by their selection box */
  groupResize?: { resize: GroupResize, bounds: SelectionBounds };
  /** where the tile moved alone lands in the row it is inserted into and the tiles shifted to make room for it */
  arrangement?: { target: Rect, shifted: Map<ElementContext, Rect> };
}

@Component({
  selector: 'koia-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DashboardComponent extends ViewController {

  readonly CanvasPaging = CanvasPaging;
  readonly gridColumnChoices = GridLayout.COLUMN_CHOICES;
  readonly gridCellRatioChoices = GridLayout.CELL_RATIO_CHOICES;
  readonly gridLayout = new GridLayout();
  readonly freeLayout = new FreeLayout();
  readonly textBoxTileStyle = textBoxTileStyle;
  readonly resizeCursors = RESIZE_CURSORS;
  readonly tileSelection = new TileSelection<ElementContext>();
  @ViewChild('gridCells') gridCellsRef: ElementRef<HTMLDivElement>;
  @ViewChild('canvasPages') canvasPagesRef: ElementRef<HTMLDivElement>;
  @ViewChild('canvasMenu') canvasMenu: MatMenu;
  readonly shortcutLabelOf = shortcutLabelOf;
  readonly editor = new CanvasEditor(this.editorHost(), inject(CanvasClipboard), this.freeLayout);
  /** the tiles the open context menu acts on, [[undefined]] for the menu of the canvas background */
  contextMenuTiles: ElementContext[];
  /** the layout point the context menu was opened at */
  contextMenuPoint: Point;
  resizePreview: { left: number, top: number, width: number, height: number };
  canvasGuides: Guide[] = [];
  printedAt = new Date();
  /** whether tiles of the canvas may overlap, otherwise covered tiles are pushed down */
  canvasOverlapAllowed = false;
  private readonly layerMapping = new CanvasLayerMapping(() => this.isGridLayout(), this.freeLayout, () => this.layerElement());
  private readonly overlapResolver = new OverlapResolver(this.freeLayout);
  private readonly rowInsertion = new RowInsertion(this.freeLayout);
  private readonly rowRoom = new RowRoom(this.freeLayout);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly renderer = inject(Renderer2);
  private readonly removeDocumentListeners: (() => void)[];
  private gridResizeContentWidth: number;
  private gridResizeSession: GridResizeSession;
  /** the column span the resized grid tile is drawn with while its left edge passes its neighbours */
  private gridResizeSpan: { context: ElementContext, columnSpan: number };
  private canvasInteraction: CanvasInteraction;

  private readonly dashboardGenerator: DashboardGenerator;

  constructor(router: Router, bottomSheet: MatBottomSheet, dbService: DBService, dialogService: DialogService,
    chartMarginService: ChartMarginService, notificationService: NotificationService, exportService: ExportService,
    viewTabsService: ViewTabsService, chartDataService: ChartDataService, computedColumnService: ComputedColumnService) {
    super(Route.GRID, router, bottomSheet, dbService, dialogService, chartMarginService, notificationService, exportService,
      viewTabsService, computedColumnService);
    this.dashboardGenerator = new DashboardGenerator(chartMarginService, chartDataService, new MathRandomSource());
    this.removeDocumentListeners = [
      listenToDocumentOutsideAngular(this.zone, this.renderer, 'pointerdown',
        event => this.renderIf(!this.isCanvasOverlayEvent(event) && this.tileSelection.endPress())),
      listenToDocumentOutsideAngular(this.zone, this.renderer, 'keydown', event => this.onKeyDown(event as KeyboardEvent))
    ];
  }

  /**
   * a menu of the canvas acts on the selection, which a press or Escape within the menu hence keeps
   */
  private isCanvasOverlayEvent(event: Event): boolean {
    return !this.isGridLayout() && isOverlayTarget(event);
  }

  /**
   * the keys of the canvas are handled while the canvas is shown, every cached dashboard listens
   */
  private onKeyDown(event: KeyboardEvent): void {
    const content = this.divContentRef?.nativeElement;
    if (event.key === 'Escape') {
      this.renderIf(!this.isCanvasOverlayEvent(event) && this.tileSelection.clear());
    } else if (!this.isGridLayout() && isRendered(content) && isCanvasKey(event, content) && this.zone.run(() => this.editor.handleKey(event))) {
      event.preventDefault();
      this.cdr.detectChanges();
    }
  }

  private editorHost(): CanvasEditorHost {
    return {
      selection: this.tileSelection,
      contexts: () => this.elementContexts,
      remove: context => this.removeElement(context),
      toViewElements: contexts => this.toViewElements(contexts),
      append: elements => {
        const added = this.restoreElementContexts(elements);
        this.elementContexts = this.elementContexts.concat(added);
        return added;
      },
      arranged: (changedPage, fixed) => {
        this.renderChartsOnceCreated(changedPage);
        this.pushDownCoveredBy(fixed);
        this.requestPersist();
      },
      reordered: () => this.requestPersist(),
      overlapAllowed: () => this.isGridLayout() || this.canvasOverlapAllowed,
      sceneId: () => this.scene._id
    };
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.removeDocumentListeners.forEach(remove => remove());
  }

  /**
   * the document listeners run outside Angular, as every cached dashboard listens
   */
  private renderIf(changed: boolean): void {
    if (changed) {
      this.cdr.detectChanges();
    }
  }

  isGridLayout(): boolean {
    return this.route === Route.GRID;
  }

  isPagedCanvas(): boolean {
    return !this.isGridLayout() && this.freeLayout.pageFormat.paged;
  }

  /**
   * @returns the padding of the content, the paged canvas lies on a desk around its sheets
   */
  contentPaddingPx(): number {
    return this.isPagedCanvas() ? PageFormat.DESK_GUTTER_PX : GridLayout.PADDING_PX;
  }

  /**
   * @returns the paging of the sheets to print, [[undefined]] unless the canvas is paged
   */
  printSheets(): CanvasPaging {
    return this.isPagedCanvas() ? this.freeLayout.pageFormat.paging : undefined;
  }

  snapToGrid(): void {
    this.setLayout(Route.GRID);
  }

  showCanvas(paging: CanvasPaging): void {
    this.setLayout(Route.FLEX, PageFormat.of(paging));
  }

  /**
   * the grid lies on the screen, without snapping to it the tiles go anywhere on the screen
   */
  toggleSnapToGrid(): void {
    if (this.isGridLayout()) {
      this.showCanvas(CanvasPaging.NONE);
    } else {
      this.snapToGrid();
    }
  }

  /**
   * the grid lies on the screen, choosing pages shows the canvas on pages
   */
  onPagingChange(paging: CanvasPaging): void {
    if (!this.isGridLayout() || paging !== CanvasPaging.NONE) {
      this.showCanvas(paging);
    }
  }

  /**
   * @param pageFormat format of the canvas pages, the grid is laid out in landscape page units
   */
  setLayout(route: Route, pageFormat = PageFormat.LANDSCAPE): void {
    if (route !== this.route || pageFormat !== this.freeLayout.pageFormat) {
      const view = this.toView('');
      if (route === Route.FLEX) {
        this.applyCanvasPositions(view.elements, pageFormat);
      } else {
        this.applyGridSpans(view.elements);
      }
      this.closeSideBar();
      this.tileSelection.clear();
      this.route = route;
      this.freeLayout.pageFormat = pageFormat;
      this.elementContexts = this.restoreElementContexts(view.elements);
      this.resolveOverlaps([]);
      this.renderChartsOnceCreated(this.elementContexts);
      this.requestPersist();
    }
  }

  /**
   * the grid is measured in landscape page units, the reflow scales the tiles to the width of other pages
   */
  private applyCanvasPositions(elements: ViewElement[], pageFormat: PageFormat): void {
    let source = this.freeLayout;
    if (this.isGridLayout()) {
      source = new FreeLayout(pageFormat.paged ? PageFormat.LANDSCAPE : PageFormat.UNPAGED);
      this.applyRenderedTilePositions(elements, source);
    }
    if (source.pageFormat !== pageFormat) {
      new PageReflow(source, new FreeLayout(pageFormat)).reflow(elements, this.elementContexts);
    }
  }

  onPrintStart(printedAt: Date): void {
    this.printedAt = printedAt;
    this.cdr.detectChanges();
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

  private confirm(titleKey: string, questionKey: string): Promise<boolean> {
    return confirmYesNo(this.dialogService, LanguageService.instant(titleKey), LanguageService.instant(questionKey));
  }

  private replaceByGeneratedElements(): void {
    const result = this.dashboardGenerator.generate({
      columns: () => this.clonedColumns(),
      entries: this.entries,
      currentContexts: this.elementContexts.filter(c => !this.isTextBoxContext(c)),
      currentGrid: { columns: this.gridLayout.gridColumns, cellRatio: this.gridLayout.gridCellRatio },
      containerWidth: this.generationContainerWidth(),
      excludedColumnNames: this.scene.columnMappings?.filter(cp => cp.sequence).map(cp => cp.target.name) ?? []
    });
    if (!result) {
      this.notifyWarning(LanguageService.instant('dashboard.nothingToGenerate'));
      return;
    }
    this.closeSideBar();
    this.tileSelection.clear();
    this.route = Route.GRID;
    this.freeLayout.pageFormat = PageFormat.LANDSCAPE;
    this.canvasOverlapAllowed = false;
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
   * fits the rendered tiles to pages, overlays keep their offset to the fitted anchor tile, all within its page,
   * text boxes grown to their content keep their own height
   */
  private applyRenderedTilePositions(elements: ViewElement[], layout: FreeLayout): void {
    if (this.gridCellsRef?.nativeElement.getBoundingClientRect().width > 0) {
      const { scale, rects: renderedRects } = this.renderedGridRects();
      const rendered = renderedRects
        .map((r, i) => ({ element: elements[i], context: r.tile, overlay: r.tile.isOverlay(), layerRect: r.rect }))
        .filter(t => t.layerRect.width > 0 && t.layerRect.height > 0);
      const renderedTiles = rendered.filter(t => !t.overlay);
      const rects = layout.fitToPages(renderedTiles.map(t => t.layerRect));
      elements.forEach(element => element.x = element.y = undefined);
      renderedTiles.forEach((t, i) => Object.assign(t.element, rects[i], { z: i + 1 }));
      rendered.filter(t => t.overlay).forEach((t, i) => {
        const textBox = t.element as TextBox;
        const anchorRect = rects[renderedTiles.findIndex(r => r.element === elements[textBox.anchor])];
        const rect = anchorRect ? layout.anchoredRect(t.layerRect, anchorRect, { x: textBox.anchorX, y: textBox.anchorY }) : t.layerRect;
        const pageTop = layout.pageFormat.pageTopOf((anchorRect ?? rect).y);
        Object.assign(textBox, layout.clampIntoPage(rect, pageTop), { z: renderedTiles.length + i + 1 });
      });
      rendered
        .filter(t => this.isGridGrown(t.context))
        .forEach(t => t.element.height = Math.min(t.element.height, this.ungrownHeightOf(t.context, scale)));
    }
  }

  private isGridGrown(context: ElementContext): boolean {
    return context.isOverlay() ? this.isGrown(context) : this.gridRowSpanOf(context) > context.gridRowSpan;
  }

  private isGrown(context: ElementContext): boolean {
    return this.growthOf(context) > 0;
  }

  /**
   * @returns the height in page units a text box is drawn larger than its size to show its whole content
   */
  private growthOf(context: ElementContext): number {
    return this.freeLayout.drawnRectOf(context).height - this.freeLayout.rectOf(context).height;
  }

  /**
   * @returns the height in page units of the grown text box as of its own size
   */
  private ungrownHeightOf(context: ElementContext, scale: number): number {
    if (context.isOverlay()) {
      return this.freeLayout.rectOf(context).height;
    }
    const spans = { columnSpan: context.gridColumnSpan, rowSpan: context.gridRowSpan };
    return Math.round(this.gridLayout.tileSizeOf(spans, this.contentWidth()).height / scale);
  }

  /**
   * derives the spans of the tiles from their canvas size, the canvas width spans the grid width, heights are measured in
   * landscape page units as the grid; overlays get anchored to the tile below their top left corner as drawn
   */
  private applyGridSpans(elements: ViewElement[]): void {
    if (this.layerScale() > 0) {
      const gridWidth = this.contentWidth() - 2 * GridLayout.PADDING_PX;
      const scaleX = gridWidth / this.freeLayout.pageFormat.width;
      const scaleY = gridWidth / PageFormat.LANDSCAPE.width;
      const contextOf = new Map(elements.map((element, i) => [element, this.elementContexts[i]]));
      const overlays = elements.filter(element => contextOf.get(element).isOverlay()) as TextBox[];
      elements.sort((a, b) => a.y - b.y || a.x - b.x);
      const tiles = elements.filter(e => !overlays.includes(e as TextBox));
      tiles.forEach(element => {
        const rect = this.freeLayout.rectOf(element);
        const spans = this.gridLayout.spansOf(rect.width * scaleX, rect.height * scaleY, this.contentWidth());
        element.gridColumnSpan = spans.columnSpan;
        element.gridRowSpan = spans.rowSpan;
      });
      const tileRects = tiles.map(tile => ({ tile, rect: this.freeLayout.grownRect(this.freeLayout.rectOf(tile), contextOf.get(tile)) }));
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
        .filter(c => this.isChartContext(c) && this.asChartContext(c).isDataDefined())
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

  gridCellsStyle(): object {
    return { ...this.gridLayout.gridStyle(), ...this.freeLayout.canvasStyle() };
  }

  /**
   * @returns the anchor name of the tile of the given context, unique within the grid
   */
  anchorNameOf(context: ElementContext): string {
    return '--koia-tile-' + this.elementContexts.indexOf(context);
  }

  gridCellStyleOf(context: ElementContext): object {
    const columnSpan = this.gridResizeSpan?.context === context ? this.gridResizeSpan.columnSpan : context.gridColumnSpan;
    return this.gridLayout.cellStyle(context, this.gridRowSpanOf(context), columnSpan);
  }

  /**
   * @returns the given row span, enlarged for a text box that needs more rows to show its whole content
   */
  private gridRowSpanOf(context: ElementContext, rowSpan = context.gridRowSpan, contentWidth?: number): number {
    const scale = context instanceof TextBoxContext && context.fitHeight > 0 ? this.layerScale() : 0;
    if (scale > 0) {
      const fitRowSpan = this.gridLayout.rowSpanToFit((context as TextBoxContext).fitHeight * scale, contentWidth ?? this.contentWidth());
      return Math.max(rowSpan, fitRowSpan);
    }
    return rowSpan;
  }

  /**
   * @param height height in pixels the text box needs to show its whole content
   */
  onTextFitHeight(context: TextBoxContext, height: number): void {
    const scale = this.layerScale();
    if (scale > 0) {
      const drawnHeight = this.freeLayout.drawnRectOf(context).height;
      context.fitHeight = Math.ceil(height / scale);
      if (!context.isOverlay() && this.freeLayout.drawnRectOf(context).height > drawnHeight) {
        this.pushDownCoveredBy([context]);
      }
    }
  }

  /**
   * on the canvas, the header controls of a selected tile, such as its menu, act on the selection, which their click hence keeps
   */
  onTileClick(context: ElementContext, event: MouseEvent): void {
    if (!isSelectingClick(event)) {
      if (this.isGridLayout() || !this.tileSelection.isSelected(context) || !(event.target as Element).closest('koia-element-header')) {
        this.tileSelection.clear();
      }
    } else if (!this.isGridLayout() && isAdditiveClick(event)) {
      this.tileSelection.toggle(context);
    } else {
      this.tileSelection.select(context);
    }
  }

  /**
   * the click on the text toggles nothing, the text box handles it
   */
  onTextBoxFrameClick(context: ElementContext, event: MouseEvent): void {
    if (!(event.target as Element).closest('koia-text-box')) {
      if (isAdditiveClick(event)) {
        this.tileSelection.toggle(context);
      } else {
        this.tileSelection.clear();
      }
    }
  }

  /**
   * an additive click on the canvas reaches the frame of the text box, which toggles its selection
   */
  onMoveZoneClick(textBox: TextBoxComponent, event: MouseEvent): void {
    if (this.isGridLayout() || !isAdditiveClick(event)) {
      textBox.startEditing();
    }
  }

  onTilePress(context: ElementContext, event: PointerEvent): void {
    this.tileSelection.press(context, !this.isGridLayout() && isAdditiveClick(event));
  }

  /**
   * prevents the browser from extending the text selection across the tiles on an additive click beside a text and controls
   */
  preventTextSelectionOnAdditive(event: MouseEvent): void {
    const target = event.target as Element;
    if (isAdditiveClick(event) && !target.closest('koia-text-box') && !target.closest(CONTROLS)) {
      event.preventDefault();
      blurActiveElement();
    }
  }

  /**
   * a press on the content of a canvas tile handling the pointer itself moves no tile, a press beside moves it
   */
  onTileBodyPress(event: MouseEvent): void {
    if (isContentPress(event)) {
      this.preventTextSelectionOnAdditive(event);
      event.stopPropagation();
    }
  }

  onMarqueeStart(additive: boolean): void {
    this.tileSelection.pressBackground(additive);
  }

  onMarqueeEnd(marquee: MarqueeEnd): void {
    const layerRect = this.layerElement().getBoundingClientRect();
    const scale = this.layerScale();
    const area = rectOfClient(marquee.rect);
    const marked = this.elementContexts.filter(c => {
      const r = rectOfClient(this.layerMapping.clientRectOf(this.freeLayout.drawnRectOf(c), layerRect, scale));
      return marquee.touching ? intersects(area, r) : containsRect(area, r);
    });
    this.tileSelection.selectAll(marked, marquee.additive);
  }

  /**
   * a tile not selected yet becomes the only selected one, the menu acts on the selection; within a text or a title being
   * edited, the menu of the browser is shown instead
   */
  onTileContextMenu(context: ElementContext, event: MouseEvent): void {
    if ((event.target as Element).closest('koia-text-box, textarea:focus')) {
      event.stopPropagation();
      this.canvasMenu.closed.emit();
    } else {
      if (!this.tileSelection.isSelected(context)) {
        this.tileSelection.select(context);
      }
      this.contextMenuTiles = this.tileSelection.tiles();
    }
  }

  /**
   * notes where the menu is opened, the menu of the background acts on no tiles
   */
  onCanvasContextMenu(event: MouseEvent): void {
    const layerRect = this.layerElement().getBoundingClientRect();
    const scale = this.layerScale();
    this.contextMenuPoint = {
      x: this.layerMapping.layoutXOf((event.clientX - layerRect.left) / scale),
      y: this.layerMapping.layoutYOf((event.clientY - layerRect.top) / scale, scale)
    };
    if (!(event.target as Element).closest('.div_tile')) {
      this.contextMenuTiles = undefined;
    }
  }

  /**
   * @returns the box drawn around several selected tiles, none while they are moved or one of them is resized
   */
  selectionBounds(): SelectionBounds {
    const selected = this.tileSelection.tiles();
    const interaction = this.canvasInteraction;
    const scale = this.layerScale();
    if (this.isGridLayout() || selected.length < 2 || (interaction && !interaction.groupResize) || !(scale > 0)) {
      return undefined;
    }
    return selectionBoundsOf(selected, this.freeLayout, this.layerMapping, scale);
  }

  toggleOverlap(): void {
    this.canvasOverlapAllowed = !this.canvasOverlapAllowed;
    this.pushDownCoveredBy([]);
    this.requestPersist();
  }

  /**
   * pushes the tiles covering others down unless overlapping is allowed, tiles moved onto another page are rendered again
   *
   * @param fixed the tiles keeping their position
   */
  private pushDownCoveredBy(fixed: ElementContext[]): void {
    let moved: ElementContext[] = [];
    const changedPage = this.freeLayout.contextsMovedToOtherPage(this.elementContexts, () => moved = this.resolveOverlaps(fixed));
    if (moved.length) {
      this.renderChartsOnceCreated(changedPage);
      this.requestPersist();
    }
  }

  /**
   * @returns the tiles pushed down, none on the grid or while overlapping is allowed
   */
  private resolveOverlaps(fixed: ElementContext[]): ElementContext[] {
    return this.isGridLayout() || this.canvasOverlapAllowed ? [] : this.overlapResolver.pushDown(this.elementContexts, fixed);
  }

  /**
   * the margin of a chart has resize handles of its own
   */
  showsResizeHandles(context: ElementContext): boolean {
    return this.tileSelection.isSoleSelected(context) && !this.isShowResizableMargin(context);
  }

  /**
   * @param context the resized tile, the tiles left of it move after it while its left edge passes them
   */
  onGridResizeStart(context: ElementContext): void {
    this.gridResizeContentWidth = this.contentWidth();
    const { scale } = this.renderedGridRects();
    this.gridResizeSession = new GridResizeSession(context, [...this.elementContexts], this.renderedGridTileRects(), scale,
      this.gridLayout, this.gridResizeContentWidth);
  }

  onGridResizing(context: ElementContext, resizeEvent: ResizeEvent): void {
    const session = this.gridResizeSession;
    const state = session.update(resizeEvent);
    if (session.apply(state)) {
      this.elementContexts = state ? state.order : session.order;
      this.gridResizeSpan = state && { context, columnSpan: state.columnSpan };
    }
    const spans = this.resizedGridSpansOf(context, resizeEvent);
    const drawnSpans = { columnSpan: state?.columnSpan ?? spans.columnSpan, rowSpan: this.gridRowSpanOf(context, spans.rowSpan, this.gridResizeContentWidth) };
    const origin = this.resizeOriginOf(resizeEvent);
    this.resizePreview = { ...origin, left: state?.previewLeftPx ?? origin.left, ...this.gridLayout.tileSizeOf(drawnSpans, this.gridResizeContentWidth) };
  }

  onGridResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    const state = this.gridResizeSession.update(resizeEvent);
    const spans = this.resizedGridSpansOf(context, resizeEvent);
    context.gridColumnSpan = state?.columnSpan ?? spans.columnSpan;
    context.gridRowSpan = spans.rowSpan;
    if (state) {
      this.elementContexts = state.order;
      this.selectedContextPosition = this.selectedContext && this.tilePositionOf(this.selectedContext);
      this.requestPersist();
    }
    this.gridResizeSession = undefined;
    this.gridResizeSpan = undefined;
    this.resizePreview = undefined;
  }

  /**
   * the resized rect is drawn, the rows a text box is grown by to show its whole content are hence taken off
   */
  private resizedGridSpansOf(context: ElementContext, resizeEvent: ResizeEvent): GridSpans {
    const rect = resizeEvent.rectangle;
    const cw = this.gridResizeContentWidth;
    const spans = { columnSpan: context.gridColumnSpan, rowSpan: context.gridRowSpan };
    const drawnSpans = { ...spans, rowSpan: this.gridRowSpanOf(context, spans.rowSpan, cw) };
    const growth = this.gridLayout.tileSizeOf(drawnSpans, cw).height - this.gridLayout.tileSizeOf(spans, cw).height;
    const column = this.gridLayout.columnOf(this.resizeOriginOf(resizeEvent).left, cw);
    return this.gridLayout.resizedSpansOf(rect.width, rect.height - growth, column, cw);
  }

  /**
   * @returns the top left corner of the tile at resize start, the grid keeps the tile there whichever edge is moved
   */
  private resizeOriginOf(resizeEvent: ResizeEvent): { left: number, top: number } {
    const rect = resizeEvent.rectangle;
    return { left: rect.left - this.edgeDelta(resizeEvent, 'left'), top: rect.top - this.edgeDelta(resizeEvent, 'top') };
  }

  /**
   * @returns the pixels the edge was moved by, 0 for an edge the handle does not move
   */
  private edgeDelta(resizeEvent: ResizeEvent, edge: keyof Edges): number {
    return Number(resizeEvent.edges[edge] ?? 0);
  }

  protected override restoreElementContexts(elements: ViewElement[]): ElementContext[] {
    const contexts = super.restoreElementContexts(elements);
    this.placeUnpositionedTiles(contexts);
    return contexts;
  }

  protected onElementContextAdded(context: ElementContext): void {
    if (context.isOverlay()) {
      this.placeAtVisibleCenter(context);
    }
    this.placeUnpositionedTiles(this.elementContexts);
    if (this.isGridLayout() && context.isOverlay()) {
      this.anchorToTileBelow(context as TextBoxContext, this.freeLayout.rectOf(context), this.renderedGridTileRects());
    }
  }

  /**
   * leaves the overlay unpositioned while the layer is not rendered
   */
  private placeAtVisibleCenter(context: ElementContext): void {
    const layer = this.isGridLayout() ? this.gridCellsRef : this.canvasPagesRef;
    const center = layer && visibleCenterOf(this.divContentRef.nativeElement, layer.nativeElement, this.layerMapping.widthUnits());
    if (center) {
      const layoutCenter = { x: this.layerMapping.layoutXOf(center.x), y: this.layerMapping.layoutYOf(center.y, this.layerScale()) };
      this.freeLayout.placeCentered(context, layoutCenter, this.elementContexts, !this.isGridLayout());
    }
  }

  /**
   * @param extent size in pixels the note needs for its text
   */
  shrinkNoteToText(context: TextBoxContext, extent: TextExtent): void {
    const scale = this.layerScale();
    if (context.isOverlay() && scale > 0) {
      const size = this.freeLayout.fitSizeOf(context, extent, scale);
      context.setSize(size.width, size.height);
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
    return Math.max(0, (this.divContentRef.nativeElement.getBoundingClientRect().top - cells.top) / this.gridCellsScale(cells));
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
    return this.renderedGridRects().rects.filter(r => !r.tile.isOverlay());
  }

  /**
   * @returns the rendered rects of the grid's tiles and overlays in page units, relative to the grid cells,
   * together with the scale of the page units
   */
  private renderedGridRects(): { scale: number, rects: TileRect<ElementContext>[] } {
    const cellsRect = this.gridCellsRef.nativeElement.getBoundingClientRect();
    const scale = this.gridCellsScale(cellsRect);
    const rects = this.elementContainerDivRefs.map((ref, i) => {
      const r = ref.nativeElement.parentElement.getBoundingClientRect();
      return {
        tile: this.elementContexts[i],
        rect: this.freeLayout.rectFromRendered(r.left - cellsRect.left, r.top - cellsRect.top, r.width, r.height, scale)
      };
    });
    return { scale, rects };
  }

  private gridCellsScale(cellsRect: DOMRect): number {
    return cellsRect.width / this.freeLayout.pageFormat.width;
  }

  /**
   * in grid layout, text boxes anchored to the removed tile stay where they are drawn
   */
  override removeElement(context: ElementContext): void {
    const anchored = this.textBoxesAnchoredTo(context);
    if (this.isGridLayout() && anchored.length) {
      const rects = this.renderedGridRects().rects;
      anchored.forEach(textBox => {
        const rect = rects.find(r => r.tile === textBox).rect;
        textBox.setPosition(rect.x, rect.y);
      });
    }
    this.tileSelection.remove(context);
    super.removeElement(context);
  }

  /**
   * a press on an unfocused title focuses it, the move ends editing there as a click elsewhere would
   */
  onGridMoveStarted(): void {
    blurActiveElement();
  }

  /**
   * the selected tiles are moved together when one of several selected tiles on the canvas is dragged
   */
  onFreeMoveStarted(context: ElementContext): void {
    this.onGridMoveStarted();
    const members = !this.isGridLayout() && this.tileSelection.isSelected(context) ? this.tileSelection.tiles() : [context];
    this.startCanvasInteraction(context, members);
    this.canvasInteraction.autoScroll = new DragAutoScroll(this.divContentRef.nativeElement);
  }

  readonly constrainFreeMove = (point: Point, _dragRef: DragRef, _dimensions: DOMRect, pickup: Point): Point => {
    const { context, scale, pagesRect, guides, group } = this.canvasInteraction;
    const livePagesRect = this.layerElement().getBoundingClientRect();
    const original = group.originalRectOf(context);
    const moved = {
      ...original,
      x: this.layerMapping.layoutXOf((point.x - pickup.x - livePagesRect.left) / scale),
      y: this.layerMapping.layoutYOf((point.y - pickup.y - livePagesRect.top) / scale, scale)
    };
    if (group.isGroup()) {
      const bounds = group.bounds();
      const groupSnap = guides.snapGroupMove({ ...bounds, x: bounds.x + moved.x - original.x, y: bounds.y + moved.y - original.y },
        group.originalRects());
      group.apply(this.separatedMembersOf(groupSnap.rects));
      this.canvasInteraction.snap = { rect: groupSnap.bounds, guides: groupSnap.guides };
    } else {
      const snap = guides.snapMove(moved);
      group.apply([snap.rect]);
      this.canvasInteraction.snap = snap;
      this.canvasInteraction.arrangement = this.arrangementOf(context, snap.rect, original, moved.x);
    }
    const rect = group.rectOf(context);
    return {
      x: pagesRect.left + this.layerMapping.layerXOf(rect.x) * scale,
      y: pagesRect.top + this.layerMapping.layerYOf(rect.y, scale) * scale
    };
  };

  /**
   * while overlapping is prevented, a tile moved alone is inserted into the row of tiles it is dropped on
   */
  private arrangementOf(context: ElementContext, snapped: Rect, original: Rect, pointerX: number): CanvasInteraction['arrangement'] {
    if (!this.isRowFlowing(context)) {
      return undefined;
    }
    const others = this.rowFlowOthersOf(context);
    const moved = { ...this.freeLayout.arrangedRectOf(context), x: snapped.x, y: snapped.y };
    const arrangement = this.rowInsertion.arrange(moved, original, others.map(c => this.freeLayout.arrangedRectOf(c)), pointerX);
    return arrangement && { target: arrangement.target, shifted: this.shiftedOf(others, arrangement.rects) };
  }

  /**
   * while overlapping is prevented, the tiles of a canvas row flow like text
   */
  private isRowFlowing(context: ElementContext): boolean {
    return !this.isGridLayout() && !this.canvasOverlapAllowed && !context.isOverlay();
  }

  private rowFlowOthersOf(context: ElementContext): ElementContext[] {
    return this.elementContexts.filter(c => c !== context && !c.isOverlay());
  }

  /**
   * @param rects the arranged rects of the others at their indexes
   * @returns the rects of the others whose position changes
   */
  private shiftedOf(others: ElementContext[], rects: Rect[]): Map<ElementContext, Rect> {
    const shifted = new Map<ElementContext, Rect>();
    others.forEach((c, i) => {
      if (rects[i].x !== c.x || rects[i].y !== c.y) {
        shifted.set(c, rects[i]);
      }
    });
    return shifted;
  }

  /**
   * members fitted into their pages one by one may cover each other, the lower ones then go below
   *
   * @param rects the snapped rects of the members at their indexes
   */
  private separatedMembersOf(rects: Rect[]): Rect[] {
    const paged = this.freeLayout.pageFormat.paged;
    return paged && !this.isGridLayout() && !this.canvasOverlapAllowed ? this.overlapResolver.separated(this.canvasInteraction.group.members, rects) : rects;
  }

  onFreeMoving(event: CdkDragMove): void {
    const { snap, scale, autoScroll, group, arrangement } = this.canvasInteraction;
    autoScroll.follow(event.event);
    if (arrangement) {
      this.showResizePreview(arrangement.target);
      this.canvasGuides = [];
    } else {
      this.resizePreview = undefined;
      this.canvasGuides = snap ? this.layerGuidesOf(group.members, snap, scale) : [];
    }
  }

  /**
   * @returns the CSS translation of a tile moved together with the dragged one or shifted to make room for it
   */
  shiftTranslateOf(context: ElementContext): string {
    const interaction = this.canvasInteraction;
    if (!interaction || interaction.groupResize) {
      return undefined;
    }
    const shifted = interaction.arrangement?.shifted.get(context);
    return shifted ? translateBetween(this.freeLayout.rectOf(context), shifted, this.layerMapping, interaction.scale)
      : interaction.group.translateOf(context, this.layerMapping, interaction.scale);
  }

  /**
   * @returns whether the tile glides to and from the spot it is shifted to while a tile is moved into a row
   */
  isRowShifting(context: ElementContext): boolean {
    const interaction = this.canvasInteraction;
    return !!interaction && !interaction.groupResize && !interaction.group.isGroup() && interaction.context !== context
      && !context.isOverlay() && !this.isGridLayout() && !this.canvasOverlapAllowed;
  }

  isGroupFollower(context: ElementContext): boolean {
    const interaction = this.canvasInteraction;
    return !interaction?.groupResize && !!interaction?.group.isFollower(context);
  }

  private layerGuidesOf(contexts: ElementContext[], snap: Snap, scale: number): Guide[] {
    return this.visibleGuidesOf(contexts, snap.guides).map(g => this.layerMapping.layerGuideOf(g, scale, snap.rect));
  }

  /**
   * the horizontal guides of a grown text box would mark its own size, not its drawn bottom
   */
  private visibleGuidesOf(contexts: ElementContext[], guides: Guide[]): Guide[] {
    return contexts.some(c => this.isGrown(c)) ? guides.filter(g => g.axis === 'x') : guides;
  }

  onFreeMoveEnded(context: ElementContext, event: CdkDragEnd): void {
    const { snap, group, arrangement } = this.canvasInteraction;
    if (arrangement) {
      this.applyArrangement(context, arrangement);
    } else if (snap) {
      group.members.forEach(member => {
        const rect = group.rectOf(member);
        member.setPosition(rect.x, rect.y);
      });
      this.anchorInGrid(context, snap.rect);
      this.renderChartsOnceCreated(group.membersWithChangedPage());
    }
    this.endCanvasInteraction();
    event.source.reset();
    this.bringAllToFront(group.members);
    if (!arrangement) {
      this.pushDownCoveredBy(group.members.filter(m => !m.isOverlay()));
    }
  }

  /**
   * the arrangement already pushed down the tiles covered
   *
   * @param ownSize the size the resized tile gets, the moved tile keeps its size
   */
  private applyArrangement(context: ElementContext, arrangement: CanvasInteraction['arrangement'], ownSize?: Size): void {
    const moved = [context, ...arrangement.shifted.keys()];
    const changedPage = this.freeLayout.contextsMovedToOtherPage(moved, () => {
      context.setPosition(arrangement.target.x, arrangement.target.y);
      if (ownSize) {
        context.setSize(ownSize.width, ownSize.height);
      }
      arrangement.shifted.forEach((rect, c) => c.setPosition(rect.x, rect.y));
    });
    this.renderChartsOnceCreated(changedPage);
    if (arrangement.shifted.size) {
      this.requestPersist();
    }
  }

  onFreeResizeStart(context: ElementContext): void {
    this.startCanvasInteraction(context, [context]);
  }

  onFreeResizing(context: ElementContext, resizeEvent: ResizeEvent): void {
    const snap = this.freeResizeSnapOf(context, resizeEvent);
    const grown = this.freeLayout.grownRect(snap.rect, context);
    const arrangement = this.resizeArrangementOf(context, grown);
    this.canvasInteraction.arrangement = arrangement;
    this.showResizePreview(arrangement?.target ?? grown);
    this.canvasGuides = !arrangement || this.isSameRect(arrangement.target, grown) ? this.layerGuidesOf([context], snap, this.canvasInteraction.scale) : [];
  }

  /**
   * a resized tile makes room in its row
   *
   * @param grown the resized rect as drawn
   */
  private resizeArrangementOf(context: ElementContext, grown: Rect): CanvasInteraction['arrangement'] {
    if (!this.isRowFlowing(context)) {
      return undefined;
    }
    const others = this.rowFlowOthersOf(context);
    const arrangement = this.rowRoom.makeRoom(grown, this.freeLayout.arrangedRectOf(context), others.map(c => this.freeLayout.arrangedRectOf(c)), 'resize');
    return { target: arrangement.target, shifted: this.shiftedOf(others, arrangement.rects) };
  }

  private isSameRect(a: Rect, b: Rect): boolean {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }

  private showResizePreview(drawn: Rect): void {
    const scale = this.canvasInteraction.scale;
    this.resizePreview = {
      left: this.layerMapping.layerXOf(drawn.x) * scale,
      top: this.layerMapping.layerYOf(drawn.y, scale) * scale,
      width: drawn.width * scale,
      height: drawn.height * scale
    };
  }

  onFreeResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    if (this.isResized(resizeEvent)) {
      const snap = this.freeResizeSnapOf(context, resizeEvent);
      const arrangement = this.resizeArrangementOf(context, this.freeLayout.grownRect(snap.rect, context));
      if (arrangement) {
        const target = arrangement.target;
        this.applyArrangement(context, arrangement, { width: target.width, height: snap.rect.height - (target.y - snap.rect.y) });
      } else {
        context.setPosition(snap.rect.x, snap.rect.y);
        context.setSize(snap.rect.width, snap.rect.height);
        this.anchorInGrid(context, snap.rect);
      }
      this.bringAllToFront([context]);
    }
    this.resizePreview = undefined;
    this.endCanvasInteraction();
  }

  private isResized(resizeEvent: ResizeEvent): boolean {
    return Object.values(resizeEvent.edges).some(delta => delta !== 0);
  }

  /**
   * the selected tiles are scaled with their selection box
   */
  onGroupResizeStart(): void {
    const members = this.tileSelection.tiles();
    const bounds = this.selectionBounds();
    this.startCanvasInteraction(members[0], members);
    const resize = new GroupResize(bounds.rectBounds, members.map(m => this.freeLayout.rectOf(m)), members.map(m => this.freeLayout.minSizeOf(m)));
    this.canvasInteraction.groupResize = { resize, bounds };
  }

  onGroupResizing(resizeEvent: ResizeEvent): void {
    const { groupResize, group, scale } = this.canvasInteraction;
    const snap = this.groupResizeSnapOf(resizeEvent);
    this.showResizePreview({ ...snap.rect, height: snap.rect.height + groupResize.bounds.growth });
    this.canvasGuides = this.layerGuidesOf(group.members, snap, scale);
  }

  onGroupResizeEnd(resizeEvent: ResizeEvent): void {
    const { groupResize, group } = this.canvasInteraction;
    if (this.isResized(resizeEvent)) {
      const rects = groupResize.resize.resize(this.groupResizeSnapOf(resizeEvent).rect);
      group.members.forEach((member, i) => {
        member.setPosition(rects[i].x, rects[i].y);
        member.setSize(rects[i].width, rects[i].height);
      });
      this.bringAllToFront(group.members);
      this.pushDownCoveredBy(group.members.filter(m => !m.isOverlay()));
    }
    this.resizePreview = undefined;
    this.endCanvasInteraction();
  }

  private freeResizeSnapOf(context: ElementContext, resizeEvent: ResizeEvent): Snap {
    const rect = this.resizedRectOf(this.freeLayout.rectOf(context), this.growthOf(context), resizeEvent);
    return this.canvasInteraction.guides.snapResize(rect, this.freeLayout.minSizeOf(context), this.movedEdgesOf(resizeEvent));
  }

  private groupResizeSnapOf(resizeEvent: ResizeEvent): Snap {
    const { resize, bounds } = this.canvasInteraction.groupResize;
    const rect = this.resizedRectOf(bounds.rectBounds, bounds.growth, resizeEvent);
    return this.canvasInteraction.guides.snapResize(rect, resize.minSize(), this.movedEdgesOf(resizeEvent));
  }

  /**
   * the resized rect is drawn, the height it is drawn larger by, as text boxes grow to show their whole content, is hence taken
   * off; the rect is measured in whole pixels, hence the sizes kept by a moved start edge or an unmoved axis are taken from the rect
   *
   * @param growth the height the rect is drawn larger by
   */
  private resizedRectOf(rect: Rect, growth: number, resizeEvent: ResizeEvent): Rect {
    const scale = this.canvasInteraction.scale;
    const moved = this.movedEdgesOf(resizeEvent);
    const left = this.edgeDelta(resizeEvent, 'left') / scale;
    const top = this.edgeDelta(resizeEvent, 'top') / scale;
    return {
      x: rect.x + left,
      y: rect.y + top,
      width: moved.left ? rect.width - left : moved.right ? resizeEvent.rectangle.width / scale : rect.width,
      height: moved.top ? rect.height - top : moved.bottom ? resizeEvent.rectangle.height / scale - growth : rect.height
    };
  }

  private movedEdgesOf(resizeEvent: ResizeEvent): MovedEdges {
    const edges = resizeEvent.edges;
    return {
      left: edges.left !== undefined,
      top: edges.top !== undefined,
      right: edges.right !== undefined,
      bottom: edges.bottom !== undefined
    };
  }

  private anchorInGrid(context: ElementContext, rect: Rect): void {
    if (this.isGridLayout()) {
      this.anchorToTileBelow(context as TextBoxContext, rect, this.canvasInteraction.anchorTiles);
    }
  }

  /**
   * in grid layout, the overlay's position is first taken from where it is drawn, as it follows its anchor tile
   *
   * @param members the tiles moved together, the context among them
   */
  private startCanvasInteraction(context: ElementContext, members: ElementContext[]): void {
    const layer = this.layerElement();
    const scale = this.layerScale();
    const threshold = FreeLayout.SNAP_THRESHOLD_PX / scale;
    let guides: SnapGuides;
    let anchorTiles: TileRect<ElementContext>[] = [];
    if (this.isGridLayout()) {
      const rects = this.renderedGridRects().rects;
      const rect = rects.find(r => r.tile === context).rect;
      context.setPosition(rect.x, rect.y);
      guides = new SnapGuides(rects.filter(r => r.tile !== context).map(r => r.rect), this.freeLayout.pageFormat, 0, threshold, false);
      anchorTiles = rects.filter(r => !r.tile.isOverlay());
    } else {
      const others = this.elementContexts
        .filter(c => !members.includes(c))
        .map(c => this.freeLayout.drawnRectOf(c));
      const pageFormat = this.freeLayout.pageFormat;
      guides = new SnapGuides(others, pageFormat, this.freeLayout.pageIndexes(this.elementContexts).length, threshold, pageFormat.paged);
    }
    this.canvasInteraction = {
      context,
      scale,
      pagesRect: layer.getBoundingClientRect(),
      guides,
      anchorTiles,
      group: new GroupDrag(context, members, members.map(m => this.freeLayout.rectOf(m)), this.freeLayout.pageFormat)
    };
  }

  /**
   * @returns the rendered layer, [[undefined]] while it is not rendered
   */
  private layerElement(): HTMLDivElement {
    return (this.isGridLayout() ? this.gridCellsRef : this.canvasPagesRef)?.nativeElement;
  }

  /**
   * @returns the pixels per page unit of the rendered layer, 0 while it is not rendered
   */
  private layerScale(): number {
    return this.layerMapping.scale();
  }

  private endCanvasInteraction(): void {
    this.canvasInteraction.autoScroll?.stop();
    this.canvasInteraction = undefined;
    this.canvasGuides = [];
    this.resizePreview = undefined;
  }

  /**
   * brings the selected tiles to the front when the context is among them, the context alone otherwise
   */
  bringToFront(context: ElementContext): void {
    this.editor.toFront(this.editor.targetsOf(context));
  }

  /**
   * keeps the stacking order among the given contexts
   */
  private bringAllToFront(contexts: ElementContext[]): void {
    this.editor.toFront(contexts);
  }

  /**
   * sends the selected tiles to the back when the context is among them, the context alone otherwise
   */
  sendToBack(context: ElementContext): void {
    this.editor.toBack(this.editor.targetsOf(context));
  }

  protected onPreRestoreView(view: View): void {
    this.route = view.route;
    this.canvasOverlapAllowed = view.canvasOverlapAllowed ?? true;
    this.freeLayout.pageFormat = isLegacyFlexView(view) ? PageFormat.UNPAGED : PageFormat.of(view.canvasPaging);
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
    view.canvasOverlapAllowed = this.canvasOverlapAllowed;
    const paging = this.freeLayout.pageFormat.paging;
    if (paging !== CanvasPaging.LANDSCAPE) {
      view.canvasPaging = paging;
    }
  }
}
