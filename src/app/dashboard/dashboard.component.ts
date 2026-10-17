import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { BoundingRectangle, Edges, ResizeEvent } from 'angular-resizable-element';
import { ViewController } from 'app/shared/controller';
import { View, ViewElement } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { ElementContext, Route } from '../shared/model';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../shared/services';
import { FlexLayout } from './flex-layout';
import { GridLayout, GridSpans } from './grid-layout';

@Component({
  selector: 'koia-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  changeDetection: ChangeDetectionStrategy.Eager,
  standalone: false
})
export class DashboardComponent extends ViewController {

  readonly gridColumnChoices = [1, 2, 3, 4, 5];
  readonly gridCellRatioChoices = ['1:1', '3:2', '2:1', '2:3', '1:2'];
  readonly gridLayout = new GridLayout();
  readonly validateElementResize = FlexLayout.validateResize;
  gridResizePreview: { left: number, top: number, width: number, height: number };
  private gridResizeContentWidth: number;

  constructor(router: Router, bottomSheet: MatBottomSheet, dbService: DBService, dialogService: DialogService,
    viewPersistenceService: ViewPersistenceService, chartMarginService: ChartMarginService, notificationService: NotificationService,
    exportService: ExportService, viewTabsService: ViewTabsService) {
    super(Route.GRID, router, bottomSheet, dbService, dialogService, viewPersistenceService, chartMarginService, notificationService,
      exportService, viewTabsService);
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
        this.applyRenderedTileSizes(view.elements);
      } else {
        this.applyGridSpans(view.elements);
      }
      this.sidenav.close();
      this.selectedContext = undefined;
      this.selectedContextPosition = undefined;
      this.route = route;
      this.elementContexts = this.restoreElementContexts(view.elements);
      this.renderChartsOnceCreated(this.elementContexts);
      this.requestPersist();
    }
  }

  private applyRenderedTileSizes(elements: ViewElement[]): void {
    elements.forEach((element, i) => {
      const rect = this.elementContainerDivRefs.get(i)?.nativeElement.parentElement.getBoundingClientRect();
      if (rect?.width > 0 && rect.height > 0) {
        element.width = rect.width;
        element.height = rect.height;
      }
    });
  }

  private applyGridSpans(elements: ViewElement[]): void {
    const contentWidth = this.contentWidth();
    if (contentWidth > 0) {
      elements.forEach(element => {
        const spans = this.gridLayout.spansOf(element.width, element.height, contentWidth);
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
    this.gridLayout.setGridColumns(gridColumns, this.elementContexts);
    this.requestPersist();
  }

  setGridCellRatio(gridCellRatio: string): void {
    this.gridLayout.setGridCellRatio(gridCellRatio, this.elementContexts);
    this.requestPersist();
  }

  resizableEdgesOf(context: ElementContext): Edges {
    return FlexLayout.resizableEdges(this.isShowResizableMargin(context));
  }

  onResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    const rect = resizeEvent.rectangle;
    const containerDivRef = this.elementContainerDivRefs.get(this.elementContexts.indexOf(context));
    if (containerDivRef) {
      const style = containerDivRef.nativeElement.style;
      style.width = rect.width + 'px';
      style.height = rect.height + 'px';
    }
    context.setSize(rect.width, rect.height);
  }

  onGridResizeStart(): void {
    this.gridResizeContentWidth = this.contentWidth();
  }

  onGridResizing(resizeEvent: ResizeEvent): void {
    const rect = resizeEvent.rectangle;
    const spans = this.resizedGridSpansOf(rect);
    this.gridResizePreview = { left: rect.left, top: rect.top, ...this.gridLayout.tileSizeOf(spans, this.gridResizeContentWidth) };
  }

  onGridResizeEnd(context: ElementContext, resizeEvent: ResizeEvent): void {
    const spans = this.resizedGridSpansOf(resizeEvent.rectangle);
    context.gridColumnSpan = spans.columnSpan;
    context.gridRowSpan = spans.rowSpan;
    this.gridResizePreview = undefined;
  }

  private resizedGridSpansOf(rect: BoundingRectangle): GridSpans {
    const cw = this.gridResizeContentWidth;
    return this.gridLayout.coveredSpansOf(rect.width, rect.height, this.gridLayout.columnOf(rect.left, cw), cw);
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
