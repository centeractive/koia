import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router } from '@angular/router';
import { Edges, ResizeEvent } from 'angular-resizable-element';
import { ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { ViewController } from 'app/shared/controller';
import { View, ViewElement } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { ChartDataService, ChartMarginService } from 'app/shared/services/chart';
import { LanguageService } from 'app/shared/services/language';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { firstValueFrom } from 'rxjs';
import { ElementContext, Route } from '../shared/model';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from '../shared/services';
import { FlexLayout } from './flex-layout';
import { DashboardGenerator } from './generator/dashboard-generator';
import { MathRandomSource } from './generator/random-source';
import { GridLayout } from './grid-layout';

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
  readonly gridRoute = Route.GRID;
  readonly flexRoute = Route.FLEX;
  readonly gridLayout = new GridLayout();
  readonly validateElementResize = FlexLayout.validateResize;

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

  setLayout(route: Route): void {
    if (route !== this.route) {
      const view = this.toView('');
      if (route === Route.FLEX) {
        this.applyRenderedTileSizes(view.elements);
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
      currentContexts: this.elementContexts,
      currentGrid: { columns: this.gridLayout.gridColumns, cellRatio: this.gridLayout.gridCellRatio }
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
    const contentWidth = this.divContentRef?.nativeElement.clientWidth;
    if (contentWidth > 0) {
      elements.forEach(element => {
        const spans = this.gridLayout.spansOf(element.width, element.height, contentWidth);
        element.gridColumnSpan = spans.columnSpan;
        element.gridRowSpan = spans.rowSpan;
      });
    }
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
