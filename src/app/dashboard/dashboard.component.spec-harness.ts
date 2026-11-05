import { CdkDragEnd, CdkDragMove, DragDropModule } from '@angular/cdk/drag-drop';
import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, NO_ERRORS_SCHEMA, Output } from '@angular/core';
import { ComponentFixture, flush, TestBed } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { provideRouter } from '@angular/router';
import { Edges, ResizeEvent } from 'angular-resizable-element';
import { CanvasPaging, Column, DataType, ElementContext, Query, Route, Scene, SummaryContext, TextBoxContext } from 'app/shared/model';
import { TabDef, View, ViewType } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { ModelToViewConverter } from 'app/shared/services/view-persistence';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { MatIconModuleMock, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { PageHeadingComponent } from 'app/shared/ui/print-heading/page-heading.component';
import { PrintHeadingComponent } from 'app/shared/ui/print-heading/print-heading.component';
import { PrintButtonComponent } from 'app/shared/ui/print-button/print-button.component';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { PagingTogglesComponent } from 'app/shared/ui/sheets/paging-toggles.component';
import { SheetComponent } from 'app/shared/ui/sheets/sheet.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';
import type { TextExtent } from 'app/text-box/text-fit';
import { of } from 'rxjs';
import type { Mock } from 'vitest';
import { page } from 'vitest/browser';
import { ClickWithoutDragDirective } from './click-without-drag.directive';
import { DashboardComponent } from './dashboard.component';
import { DetachFromDropListDirective } from './detach-from-drop-list.directive';
import { MarqueeDirective } from './marquee.directive';
import { ResizeHandlesComponent } from './resize-handles/resize-handles.component';

@Component({ selector: 'koia-main-toolbar', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class MainToolbarComponent { }

@Component({ selector: 'koia-chart-side-bar', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class ChartSideBarComponent { }

@Component({ selector: 'koia-graph-side-bar', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class GraphSideBarComponent { }

@Component({ selector: 'koia-summary-table-side-bar', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class SummaryTableSideBarComponent { }

@Component({ selector: 'koia-summary-table', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class SummaryTableComponent { }

@Component({ selector: 'koia-chart', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class ChartComponent { }

@Component({ selector: 'koia-graph', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class GraphComponent { }

@Component({
  selector: 'koia-text-box', template: '<p class="p_line" style="margin: 0; pointer-events: auto">line</p>',
  changeDetection: ChangeDetectionStrategy.Eager, standalone: false
})
export class TextBoxComponent {
  @Input() context: TextBoxContext;
  @Output() remove = new EventEmitter<void>();
  @Output() fitHeightChange = new EventEmitter<number>();
  @Output() textEdited = new EventEmitter<TextExtent>();
  @HostBinding('class.koia-text-box-active') active = false;
  startEditing = vi.fn();
}

@Component({ selector: 'koia-element-header', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
export class ElementHeaderComponent {
  @Input() headerDraggable: boolean;
}

/**
 * registers the viewport the rendered tiles are laid out in, to be called in the body of a describe
 */
export function useRenderedViewport(): void {
  beforeAll(() => page.viewport(1280, 800));
  afterAll(() => page.viewport(414, 896));
}

/**
 * the dashboard under test with its services, scene, entries and the helpers to drive it
 */
export class DashboardHarness {

  readonly PICKUP = { x: 10, y: 10 };
  readonly now = new Date().getTime();
  readonly scene: Scene;
  readonly entries: object[];
  readonly dbService = new DBService(null, null);
  readonly dialogService = new DialogService(null);
  readonly notificationService = new NotificationServiceMock();
  readonly exportService = new ExportService();
  readonly viewTabsService = { requestPersist: vi.fn(), register: vi.fn(), unregister: vi.fn(), updateColumnReferences: vi.fn() } as unknown as ViewTabsService;
  fixture: ComponentFixture<DashboardComponent>;
  component: DashboardComponent;
  getActiveSceneSpy: Mock;
  findEntriesSpy: Mock;

  constructor() {
    const columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS', indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 500, indexed: false },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    const now = this.now;
    this.scene = SceneFactory.createScene('1', columns);
    this.entries = [
      { ID: 1, Time: now - 1000, Level: 'INFO', Data: 'INFO line one', Host: 'server1', Path: '/opt/log/info.log', Amount: 10 },
      { ID: 2, Time: now - 2000, Level: 'INFO', Data: 'INFO line two', Host: 'server1', Path: '/opt/log/info.log', Amount: 20 },
      { ID: 3, Time: now - 3000, Level: 'INFO', Data: 'INFO line three', Host: 'server1', Path: '/opt/log/info.log', Amount: 30 },
      { ID: 4, Time: now - 4000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 40 },
      { ID: 5, Time: now - 5000, Level: 'WARN', Data: 'WARN line two', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 50 },
      { ID: 6, Time: now - 6000, Level: 'WARN', Data: 'WARN line three', Host: 'local drive', Path: 'C:/temp/log/warn.log', Amount: 60 },
      { ID: 7, Time: now - 7000, Level: 'ERROR', Data: 'ERROR line one', Host: 'server2', Path: '/var/log/error.log', Amount: 70 },
      { ID: 8, Time: now - 8000, Level: 'ERROR', Data: 'ERROR line two', Host: 'server2', Path: '/var/log/error.log', Amount: 80 },
      { ID: 9, Time: now - 9000, Level: 'ERROR', Data: 'ERROR line three', Host: 'server2', Path: '/var/log/error.log', Amount: 90 },
    ];
  }

  /**
   * creates the component, to be called within fake async
   */
  createComponent(): void {
    this.fixture = TestBed.createComponent(DashboardComponent);
    this.component = this.fixture.componentInstance;
    vi.spyOn(this.dialogService, 'showViewLauncherDialog').mockReturnValue(undefined);
    vi.spyOn(this.notificationService, 'showStatus').mockReturnValue(undefined);
    this.getActiveSceneSpy = vi.spyOn(this.dbService, 'getActiveScene').mockReturnValue(this.scene);
    this.findEntriesSpy = vi.spyOn(this.dbService, 'findEntriesWithComputedValues').mockReturnValue(of(this.entries.slice(0)));
  }

  init(tab?: TabDef): void {
    this.component.tab = tab;
    this.fixture.detectChanges();
    flush();
  }

  /**
   * @returns a move of a dragged pointer in the middle of the content, far from the edges that scroll it
   */
  moveEventInMiddle(): CdkDragMove {
    const rect = this.component.divContentRef.nativeElement.getBoundingClientRect();
    return { event: new MouseEvent('mousemove', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }) } as CdkDragMove;
  }

  dashboardTab(view?: View): TabDef {
    return { id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard 1', view };
  }

  viewOf(route: Route, contexts: ElementContext[], gridColumns = 4, gridCellRatio = '4:3'): View {
    const view = new ModelToViewConverter().convert(route, 'test', new Query(), contexts);
    view.gridColumns = gridColumns;
    view.gridCellRatio = gridCellRatio;
    return view;
  }

  resizeEvent(width: number, height: number, left = 0, top = 0, edges: Edges = { right: 0, bottom: 0 }): ResizeEvent {
    return {
      rectangle: { top, bottom: top + height, left, right: left + width, width, height },
      edges
    };
  }

  findColumn(name: string, context: ElementContext): Column {
    return context.columns.find(c => c.name === name);
  }

  addNoteContext(x: number, y: number, fitHeight: number): TextBoxContext {
    const note = new TextBoxContext(this.scene.columns);
    note.setPosition(x, y);
    note.z = 10;
    note.fitHeight = fitHeight;
    this.component.elementContexts = this.component.elementContexts.concat([note]);
    this.fixture.detectChanges();
    return note;
  }

  renderCanvasSummaries(rects: number[][], paging = CanvasPaging.LANDSCAPE): SummaryContext[] {
    this.component.showCanvas(paging);
    this.component.elementContexts = rects.map(([x, y, width, height], i) => {
      const context = new SummaryContext(this.scene.columns);
      context.setPosition(x, y);
      context.setSize(width, height);
      context.z = i + 1;
      return context;
    });
    this.fixture.detectChanges();
    return this.component.elementContexts as SummaryContext[];
  }

  canvasScale(): number {
    return this.component.canvasPagesRef.nativeElement.clientWidth / this.component.freeLayout.pageFormat.sheetWidth;
  }

  /**
   * @returns the x on the rendered sheets in page units
   */
  layerX(x: number): number {
    return this.component.freeLayout.layerXOf(x);
  }

  /**
   * @returns the y on the rendered sheets in page units, the sheets separated by the desk gutter
   */
  layerY(y: number): number {
    return this.component.freeLayout.layerYOf(y, PageFormat.DESK_GUTTER_PX / this.canvasScale());
  }

  pagesRect(): DOMRect {
    return this.component.canvasPagesRef.nativeElement.getBoundingClientRect();
  }

  constrainMoveTo(x: number, y: number, pages = this.pagesRect()): { x: number, y: number } {
    const scale = this.canvasScale();
    return this.component.constrainFreeMove({
      x: pages.left + this.layerX(x) * scale + this.PICKUP.x,
      y: pages.top + this.layerY(y) * scale + this.PICKUP.y
    }, null, null, this.PICKUP);
  }

  /**
   * presses and clicks the middle of the target, the click moved by the given pixels
   *
   * @param modifiers the keys held while clicking
   */
  clickTile(target: Element, dx = 0, modifiers: MouseEventInit = {}): void {
    const rect = target.getBoundingClientRect();
    const point = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2, ...modifiers };
    target.dispatchEvent(new PointerEvent('pointerdown', point));
    target.dispatchEvent(new MouseEvent('click', { ...point, clientX: point.clientX + dx }));
    this.fixture.detectChanges();
  }

  dragEnd(): CdkDragEnd {
    return { source: { reset: vi.fn() } } as unknown as CdkDragEnd;
  }

  requestPersistSpy(): Mock {
    return vi.spyOn(this.component as unknown as { requestPersist: () => void }, 'requestPersist');
  }
}

export function createDashboardHarness(): DashboardHarness {
  return new DashboardHarness();
}

/**
 * configures the testing module with stubs of the components within the dashboard, to be called within wait for async
 */
export function configureDashboardTestBed(harness: DashboardHarness): Promise<void> {
  return TestBed.configureTestingModule({
    schemas: [NO_ERRORS_SCHEMA],
    declarations: [
      DashboardComponent, MainToolbarComponent, ChartSideBarComponent, GraphSideBarComponent, SummaryTableSideBarComponent,
      SummaryTableComponent, ChartComponent, GraphComponent, TextBoxComponent, ElementHeaderComponent, ViewToolbarComponent, PrintButtonComponent,
      PrintHeadingComponent, PageHeadingComponent, DetachFromDropListDirective, ClickWithoutDragDirective, MarqueeDirective, ResizeHandlesComponent,
      PagingTogglesComponent, SheetComponent
    ],
    imports: [MatSidenavModule, MatMenuModule, MatButtonModule, MatIconModule, MatBottomSheetModule, CdkScrollableModule, DragDropModule],
    providers: [
      provideRouter([]),
      MatBottomSheet,
      { provide: DBService, useValue: harness.dbService },
      { provide: DialogService, useValue: harness.dialogService },
      { provide: ChartMarginService, useClass: ChartMarginService },
      { provide: NotificationService, useValue: harness.notificationService },
      { provide: ExportService, useValue: harness.exportService },
      { provide: ViewTabsService, useValue: harness.viewTabsService }
    ]
  })
    .overrideModule(MatIconModule, MatIconModuleMock.override())
    .compileComponents();
}
