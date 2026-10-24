import { CdkDrag, CdkDragDrop, CdkDragEnd, CdkDragMove, CdkDropList, DragDropModule } from '@angular/cdk/drag-drop';
import { CdkScrollableModule, ScrollDispatcher } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostBinding, Input, NO_ERRORS_SCHEMA, Output, QueryList } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { Edges, ResizeEvent } from 'angular-resizable-element';
import { ConfirmDialogComponent, ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import {
  Aggregation, AnchorOffset, CanvasPaging, Column, ComputeOperator, DataType, ElementContext, ExportFormat, Query, Route, Scene, SummaryContext, TextBoxContext, TimeUnit
} from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { TabDef, View, ViewType } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { ComputedColumnService } from 'app/shared/services/computed-column.service';
import { LanguageService } from 'app/shared/services/language';
import { ModelToViewConverter } from 'app/shared/services/view-persistence';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { MatIconModuleMock, savedViewOf, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import { claimClick } from 'app/shared/ui/claimed-click';
import type { SummaryTableComponent as RealSummaryTableComponent } from 'app/summary-table/summary-table.component';
import { Chart } from 'chart.js';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { page, userEvent } from 'vitest/browser';
import { DashboardComponent } from './dashboard.component';
import { ResizeHandlesComponent } from './resize-handles/resize-handles.component';
import { ClickWithoutDragDirective } from './click-without-drag.directive';
import { DetachFromDropListDirective } from './detach-from-drop-list.directive';
import { DragAutoScroll } from './drag-auto-scroll';
import { FreeLayout, Rect } from './free-layout';
import { DashboardGenerator, GeneratedDashboard } from './generator/dashboard-generator';
import { GridLayout } from './grid-layout';
import { PageFormat } from 'app/shared/ui/sheets/page-format';
import { Guide, SnapGuides } from './snap-guides';
import { PageHeadingComponent } from 'app/shared/ui/print-heading/page-heading.component';
import { PrintHeadingComponent } from 'app/shared/ui/print-heading/print-heading.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';
import { PrintButtonComponent } from 'app/shared/ui/print-button/print-button.component';
import { PagingTogglesComponent } from 'app/shared/ui/sheets/paging-toggles.component';
import { SheetComponent } from 'app/shared/ui/sheets/sheet.component';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import type { TextExtent } from 'app/text-box/text-fit';

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
class TextBoxComponent {
  @Input() context: TextBoxContext;
  @Output() remove = new EventEmitter<void>();
  @Output() fitHeightChange = new EventEmitter<number>();
  @Output() textEdited = new EventEmitter<TextExtent>();
  @HostBinding('class.koia-text-box-active') active = false;
  startEditing = vi.fn();
}

@Component({ selector: 'koia-element-header', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class ElementHeaderComponent {
  @Input() movable: boolean;
}

describe('DashboardComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: object[];
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  const dbService = new DBService(null, null);
  const dialogService = new DialogService(null);
  const notificationService = new NotificationServiceMock();
  const exportService = new ExportService();
  let viewTabsService: ViewTabsService;
  let getActiveSceneSpy: Mock;
  let findEntriesSpy: Mock;

  beforeAll(() => {
    now = new Date().getTime();
    const columns = [
      { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS', indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 500, indexed: false },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true }
    ];
    scene = SceneFactory.createScene('1', columns);
    entries = [
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
  });

  beforeEach(waitForAsync(() => {
    viewTabsService = { requestPersist: vi.fn(), register: vi.fn(), unregister: vi.fn(), renameColumn: vi.fn() } as unknown as ViewTabsService;
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [
        DashboardComponent, MainToolbarComponent, ChartSideBarComponent, GraphSideBarComponent, SummaryTableSideBarComponent,
        SummaryTableComponent, ChartComponent, GraphComponent, TextBoxComponent, ElementHeaderComponent, ViewToolbarComponent, PrintButtonComponent,
        PrintHeadingComponent, PageHeadingComponent, DetachFromDropListDirective, ClickWithoutDragDirective, ResizeHandlesComponent,
        PagingTogglesComponent, SheetComponent
      ],
      imports: [MatSidenavModule, MatMenuModule, MatButtonModule, MatIconModule, MatBottomSheetModule, CdkScrollableModule, DragDropModule],
      providers: [
        provideRouter([]),
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: ChartMarginService, useClass: ChartMarginService },
        { provide: NotificationService, useValue: notificationService },
        { provide: ExportService, useValue: exportService },
        { provide: ViewTabsService, useValue: viewTabsService }
      ]
    })
      .overrideModule(MatIconModule, MatIconModuleMock.override())
      .compileComponents();
  }));

  beforeEach(fakeAsync(() => {
    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    vi.spyOn(dialogService, 'showViewLauncherDialog').mockReturnValue(undefined);
    vi.spyOn(notificationService, 'showStatus').mockReturnValue(undefined);
    getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
    findEntriesSpy = vi.spyOn(dbService, 'findEntriesWithComputedValues').mockReturnValue(of(entries.slice(0)));
  }));

  function init(tab?: TabDef): void {
    component.tab = tab;
    fixture.detectChanges();
    flush();
  }

  /**
   * @returns a move of a dragged pointer in the middle of the content, far from the edges that scroll it
   */
  function moveEventInMiddle(): CdkDragMove {
    const rect = component.divContentRef.nativeElement.getBoundingClientRect();
    return { event: new MouseEvent('mousemove', { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }) } as CdkDragMove;
  }

  function dashboardTab(view?: View): TabDef {
    return { id: 'tab1', type: ViewType.DASHBOARD, title: 'Dashboard 1', view };
  }

  function viewOf(route: Route, contexts: ElementContext[], gridColumns = 4, gridCellRatio = '4:3'): View {
    const view = new ModelToViewConverter().convert(route, 'test', new Query(), contexts);
    view.gridColumns = gridColumns;
    view.gridCellRatio = gridCellRatio;
    return view;
  }

  describe('without tab', () => {

    beforeEach(fakeAsync(() => init()));

    it('should create in grid layout', () => {
      expect(component).toBeTruthy();
      expect(component.isGridLayout()).toBe(true);
      expect(component.layout()).toBe(Route.GRID);
    });

    it('#ngOnInit should navigate to scenes view when no scene is active', fakeAsync(() => {

      // given
      getActiveSceneSpy.mockReturnValue(null);
      const router = TestBed.inject(Router);
      vi.spyOn(router, 'navigateByUrl').mockReturnValue(undefined);

      // when
      component.ngOnInit();
      flush();

      // then
      expect(router.navigateByUrl).toHaveBeenCalledWith(Route.SCENES);
    }));

    it('should load initial entries', () => {
      expect(dbService.findEntriesWithComputedValues).toHaveBeenCalled();
      expect(component.entries).toEqual(entries);
    });

    it('should show view launcher when dashboard is empty', () => {
      expect(dialogService.showViewLauncherDialog).toHaveBeenCalledWith(component);
    });

    it('#addSummaryTable should add summary context', () => {

      // when
      component.addGraph();
      component.addSummaryTable();

      // then
      expect(component.elementContexts.length).toBe(2);
      const context = component.elementContexts[1];
      expect(component.isSummaryContext(context)).toBe(true);
      expect(context instanceof SummaryContext).toBe(true);
    });

    it('#addChart should add chart context', () => {

      // when
      component.addChart();

      // then
      expect(component.elementContexts.length).toBe(1);
      const context = component.elementContexts[0];
      expect(component.isChartContext(context)).toBe(true);
      expect(context instanceof ChartContext).toBe(true);
    });

    it('#addGraph should add graph context', () => {

      // when
      component.addGraph();

      // then
      expect(component.elementContexts.length).toBe(1);
      const context = component.elementContexts[0];
      expect(component.isGraphContext(context)).toBe(true);
      expect(context instanceof GraphContext).toBe(true);
    });

    it('#addNote should add text box context without opening side bar', () => {

      // when
      component.addNote();

      // then
      expect(component.elementContexts.length).toBe(1);
      expect(component.isTextBoxContext(component.elementContexts[0])).toBe(true);
      expect(component.selectedContext).toBeUndefined();
    });

    it('#click on add text box button should add text box context', () => {

      // given
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('#but_add_note');

      // when
      button.click();

      // then
      expect(component.elementContexts.length).toBe(1);
      expect(component.elementContexts[0] instanceof TextBoxContext).toBe(true);
    });

    it('add text tile and add note buttons should show their icons and follow add summary button', () => {

      // when
      const textTileButton: HTMLButtonElement = fixture.nativeElement.querySelector('#but_add_text_tile');
      const noteButton: HTMLButtonElement = fixture.nativeElement.querySelector('#but_add_note');

      // then
      expect(textTileButton.querySelector('mat-icon').textContent).toBe('text_fields');
      expect(noteButton.querySelector('mat-icon').textContent).toBe('sticky_note_2');
      expect(textTileButton.previousElementSibling.querySelector('mat-icon[svgicon="add_summary"]')).toBeTruthy();
      expect(noteButton.previousElementSibling).toBe(textTileButton);
    });

    it('#addTextTile should add text tile context without opening side bar', () => {

      // when
      const context = component.addTextTile();

      // then
      expect(component.elementContexts).toEqual([context]);
      expect(context.tiled).toBe(true);
      expect(component.selectedContext).toBeUndefined();
    });

    it('#click on add text tile button should add text tile context', () => {

      // given
      const button: HTMLButtonElement = fixture.nativeElement.querySelector('#but_add_text_tile');

      // when
      button.click();

      // then
      expect(component.elementContexts.length).toBe(1);
      expect((component.elementContexts[0] as TextBoxContext).tiled).toBe(true);
    });

    it('should render text tile in grid as frameless grid cell catching the pointer', () => {

      // given
      component.addGraph();
      const context = component.addTextTile();
      context.backgroundColor = '#ff0000';

      // when
      fixture.detectChanges();

      // then
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_grid .div_grid_cells > .div_text_tile');
      expect(fixture.debugElement.query(By.css('.div_text_tile > .div_element > koia-text-box')).componentInstance.context).toBe(context);
      expect(tile.classList).toContain('div_text_box_tile');
      expect(tile.classList).not.toContain('div_canvas_tile');
      expect(tile.classList).not.toContain('mat-elevation-z1');
      expect(tile.querySelector('koia-element-header')).toBeNull();
      expect(tile.style.backgroundColor).toBe('rgb(255, 0, 0)');
      expect(getComputedStyle(tile).position).toBe('relative');
      expect(getComputedStyle(tile).pointerEvents).toBe('auto');
      expect(getComputedStyle(tile).getPropertyValue('anchor-name')).toBe('--koia-tile-1');
      expect(getComputedStyle(tile).gridRowEnd).toBe('span 1');
    });

    it('should register drag of text tile with drop list of grid', () => {

      // given
      component.addGraph();
      component.addTextTile();

      // when
      fixture.detectChanges();

      // then
      const dropList = fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);
      const textTileDrag = fixture.debugElement.query(By.css('.div_text_tile')).injector.get(CdkDrag);
      expect(dropList.getSortedItems()).toContain(textTileDrag);
    });

    it('#drop should move text tile', () => {

      // given
      const graph = component.addGraph();
      const textTile = component.addTextTile();

      // when
      component.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<object>);

      // then
      expect(component.elementContexts).toEqual([textTile, graph]);
    });

    it('should render text tile in canvas as tile without overlay z-index', () => {

      // given
      component.setLayout(Route.FLEX);
      const context = component.addTextTile();

      // when
      fixture.detectChanges();

      // then
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_canvas .div_canvas_page_content > .div_text_tile');
      expect(tile.classList).toContain('div_canvas_tile');
      expect(tile.classList).toContain('div_text_box_tile');
      expect(getComputedStyle(tile).zIndex).toBe(String(context.z));
      expect(getComputedStyle(tile).pointerEvents).toBe('auto');
    });

    it('should render note in canvas without text tile class', () => {

      // given
      component.setLayout(Route.FLEX);
      component.addNote();

      // when
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelector('#div_canvas .div_text_box_tile').classList).not.toContain('div_text_tile');
    });

    it.each([
      { layout: Route.GRID, add: (): TextBoxContext => component.addTextTile() },
      { layout: Route.GRID, add: (): TextBoxContext => component.addNote() },
      { layout: Route.FLEX, add: (): TextBoxContext => component.addTextTile() },
      { layout: Route.FLEX, add: (): TextBoxContext => component.addNote() }
    ])('should render bordered text box with solid frame in $layout layout, kept while revealed by outline', ({ layout, add }) => {

      // given
      component.setLayout(layout);
      const context = add();
      context.bordered = true;

      // when
      fixture.detectChanges();

      // then
      const tile: HTMLElement = fixture.nativeElement.querySelector('.div_text_box_tile');
      expect(tile.classList).toContain('div_text_box_bordered');
      expect(getComputedStyle(tile, '::after').borderTopStyle).toBe('solid');
      tile.classList.add('resize-active');
      expect(getComputedStyle(tile, '::after').borderTopStyle).toBe('solid');
      expect(getComputedStyle(tile).outlineStyle).toBe('dashed');
    });

    it.each([Route.GRID, Route.FLEX])('should render border width and color of text box in %s layout', layout => {

      // given
      component.setLayout(layout);
      const context = component.addTextTile();
      context.borderWidth = 3;
      context.borderColor = '#ff0000';

      // when
      fixture.detectChanges();

      // then
      const frame = getComputedStyle(fixture.nativeElement.querySelector('.div_text_box_tile'), '::after');
      expect([frame.borderTopStyle, frame.borderTopWidth, frame.borderTopColor]).toEqual(['solid', '3px', 'rgb(255, 0, 0)']);
    });

    it('should render frame of added text tile in light border color', () => {

      // when
      component.addTextTile();
      fixture.detectChanges();

      // then
      const frame = getComputedStyle(fixture.nativeElement.querySelector('.div_text_box_tile'), '::after');
      expect([frame.borderTopStyle, frame.borderTopWidth, frame.borderTopColor]).toEqual(['solid', '1px', 'rgb(224, 224, 224)']);
    });

    it('should render added text tile as bordered', () => {

      // when
      component.addTextTile();
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelector('.div_text_box_tile').classList).toContain('div_text_box_bordered');
    });

    it('should render unbordered text box without bordered class', () => {

      // given
      component.addTextTile().bordered = false;

      // when
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelector('.div_text_box_tile').classList).not.toContain('div_text_box_bordered');
    });

    it.each([
      { layout: Route.GRID, add: (): TextBoxContext => component.addTextTile() },
      { layout: Route.GRID, add: (): TextBoxContext => component.addNote() },
      { layout: Route.FLEX, add: (): TextBoxContext => component.addTextTile() }
    ])('should set fit height in page units of layer when text box of $layout layout emits it', ({ layout, add }) => {

      // given
      component.setLayout(layout);
      const context = add();
      fixture.detectChanges();
      const layer: HTMLElement = fixture.nativeElement.querySelector(layout === Route.GRID ? '.div_grid_cells' : '.div_canvas_pages');
      const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

      // when
      textBox.fitHeightChange.emit(100);

      // then
      const layerWidth = layout === Route.GRID ? component.freeLayout.pageFormat.width : component.freeLayout.pageFormat.sheetWidth;
      expect(context.fitHeight).toBe(Math.ceil(100 / (layer.clientWidth / layerWidth)));
    });

    it('should set fit height in page units of portrait pages when text box emits it', () => {

      // given
      component.showCanvas(CanvasPaging.PORTRAIT);
      const context = component.addTextTile();
      fixture.detectChanges();
      const pages: HTMLElement = fixture.nativeElement.querySelector('.div_canvas_pages');
      const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

      // when
      textBox.fitHeightChange.emit(100);

      // then
      expect(context.fitHeight).toBe(Math.ceil(100 / (pages.clientWidth / PageFormat.PORTRAIT.sheetWidth)));
    });

    it('#onTextFitHeight should follow scale of layer', () => {

      // given
      const context = component.addTextTile();
      component.gridCellsRef = { nativeElement: { clientWidth: 700 } } as ElementRef<HTMLDivElement>;
      component.onTextFitHeight(context, 101);

      // when
      component.gridCellsRef = { nativeElement: { clientWidth: 1400 } } as ElementRef<HTMLDivElement>;
      component.onTextFitHeight(context, 101);

      // then
      expect(context.fitHeight).toBe(101);
    });

    it.each([
      { case: 'without width', gridCells: { nativeElement: { clientWidth: 0 } } as ElementRef<HTMLDivElement> },
      { case: 'not rendered', gridCells: undefined }
    ])('#onTextFitHeight should keep fit height while layer is $case', ({ gridCells }) => {

      // given
      const context = component.addTextTile();
      context.fitHeight = 50;
      component.gridCellsRef = gridCells;

      // when
      component.onTextFitHeight(context, 100);

      // then
      expect(context.fitHeight).toBe(50);
    });

    it.each([
      { case: 'without fit height', add: (): ElementContext => component.addTextTile(), fitHeight: undefined, clientWidth: 1400 },
      { case: 'of other element', add: (): ElementContext => component.addGraph(), fitHeight: 5000, clientWidth: 1400 },
      { case: 'while layer has no width', add: (): ElementContext => component.addTextTile(), fitHeight: 5000, clientWidth: 0 }
    ])('#gridCellStyleOf should return cell style of stored spans $case', ({ add, fitHeight, clientWidth }) => {

      // given
      const context = add();
      context.gridRowSpan = 2;
      (context as TextBoxContext).fitHeight = fitHeight;
      component.gridCellsRef = { nativeElement: { clientWidth } } as ElementRef<HTMLDivElement>;

      // when
      const style = component.gridCellStyleOf(context);

      // then
      expect(style).toEqual(component.gridLayout.cellStyle(context));
    });

    it('tile count and side bar position should include text tiles', () => {

      // given
      component.addTextTile();
      component.addNote();
      const graph = component.addGraph();

      // when
      component.configure(null, graph);

      // then
      expect(component.tileCount()).toBe(2);
      expect(component.selectedContextPosition).toBe(2);
    });

    it('grid tile should be movable when there is a text tile', () => {

      // given
      component.addGraph();
      component.addTextTile();

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.directive(ElementHeaderComponent)).componentInstance.movable).toBe(true);
    });

    it('should render text box in grid as detached frameless tile with background color', () => {

      // given
      const context = component.addNote();
      context.backgroundColor = '#ff0000';

      // when
      fixture.detectChanges();

      // then
      const textBox = fixture.debugElement.query(By.css('#div_grid .div_drop_list_detached > .div_text_box_tile > .div_element > koia-text-box'));
      expect(textBox.componentInstance.context).toBe(context);
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_grid .div_text_box_tile');
      expect(tile.classList).toContain('div_canvas_tile');
      expect(tile.classList).not.toContain('mat-elevation-z1');
      expect(tile.querySelector('koia-element-header')).toBeNull();
      expect(tile.style.backgroundColor).toBe('rgb(255, 0, 0)');
    });

    it('should render text box in canvas as frameless tile with background color', () => {

      // given
      component.setLayout(Route.FLEX);
      const context = component.addNote();
      context.backgroundColor = '#00ff00';

      // when
      fixture.detectChanges();

      // then
      const textBox = fixture.debugElement.query(By.css('#div_canvas .div_canvas_page_content > .div_text_box_tile > .div_element > koia-text-box'));
      expect(textBox.componentInstance.context).toBe(context);
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_canvas .div_text_box_tile');
      expect(tile.classList).toContain('div_canvas_tile');
      expect(tile.classList).not.toContain('mat-elevation-z1');
      expect(tile.querySelector('koia-element-header')).toBeNull();
      expect(tile.style.backgroundColor).toBe('rgb(0, 255, 0)');
    });

    it('should render added note translucent light yellow', () => {

      // when
      component.addNote();
      fixture.detectChanges();

      // then
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_grid .div_text_box_tile');
      expect(getComputedStyle(tile).backgroundColor).toBe('rgba(255, 249, 196, 0.8)');
    });

    it('should render text box without background color as transparent', () => {

      // given
      component.addNote().backgroundColor = undefined;

      // when
      fixture.detectChanges();

      // then
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_grid .div_text_box_tile');
      expect(tile.style.backgroundColor).toBe('');
      expect(getComputedStyle(tile).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    it.each([
      { layout: Route.GRID },
      { layout: Route.FLEX }
    ])('should remove text box when it emits remove in $layout layout', ({ layout }) => {

      // given
      component.setLayout(layout);
      component.addNote();
      fixture.detectChanges();
      const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

      // when
      textBox.remove.emit();

      // then
      expect(component.elementContexts).toEqual([]);
    });

    it('should render grid tile of other element with header and without text box class', () => {

      // given
      component.addGraph();

      // when
      fixture.detectChanges();

      // then
      const tile: HTMLElement = fixture.nativeElement.querySelector('#div_grid .div_grid_cells > .div_tile');
      expect(tile.classList).not.toContain('div_text_box_tile');
      expect(tile.querySelector('koia-element-header')).toBeTruthy();
      expect(tile.querySelector('koia-text-box')).toBeNull();
    });

    it('grid tile should be movable only when there is another tile, ignoring text boxes', () => {

      // given
      component.addGraph();
      component.addNote();

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.directive(ElementHeaderComponent)).componentInstance.movable).toBe(false);
      component.addGraph();
      fixture.detectChanges();
      expect(fixture.debugElement.query(By.directive(ElementHeaderComponent)).componentInstance.movable).toBe(true);
    });

    it('#anchorNameOf should return anchor name by element index', () => {

      // given
      component.addGraph();
      const context = component.addSummaryTable();

      // when
      const anchorName = component.anchorNameOf(context);

      // then
      expect(anchorName).toBe('--koia-tile-1');
    });

    it('grid tiles should be named as anchors', () => {

      // given
      component.addGraph();
      component.addNote();
      component.addSummaryTable();

      // when
      fixture.detectChanges();

      // then
      const tiles: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.div_grid_cells > .div_tile'));
      expect(tiles.map(t => getComputedStyle(t).getPropertyValue('anchor-name'))).toEqual(['--koia-tile-0', '--koia-tile-2']);
    });

    it('#gridCellsStyle should combine grid style and page unit', () => {

      // when
      const style = component.gridCellsStyle();

      // then
      expect(style).toEqual({ ...component.gridLayout.gridStyle(), ...component.freeLayout.canvasStyle() });
    });

    it('#onFilterChanged should assign new query to each element context', () => {

      // given
      const graphContext = component.addGraph();
      graphContext.groupByColumns = [findColumn('Level', graphContext)];
      const chartContext = component.addChart();
      chartContext.dataColumns = [findColumn('Level', chartContext)];
      const query = new Query();
      query.setFullTextFilter('abc');

      // when
      component.onFilterChanged(query);

      // then
      component.elementContexts.forEach(c => expect(c.query).toBe(query));
    });

    it('#onFilterChanged should re-fetch entries with new query', () => {

      // given
      const query = new Query();
      query.setFullTextFilter('123');

      // when
      component.onFilterChanged(query);

      // then
      expect(dbService.findEntriesWithComputedValues).toHaveBeenCalledWith(query, true);
    });

    it('#onFilterChanged should notify error and stop loading when error occurs', fakeAsync(() => {

      // given
      findEntriesSpy.mockReturnValue(throwError(() => 'server error'));
      vi.spyOn(component, 'notifyError').mockReturnValue(undefined);

      // when
      component.onFilterChanged(new Query());
      flush();

      // then
      expect(component.notifyError).toHaveBeenCalled();
      expect(component.loading).toBe(false);
    }));

    it('#configure should open side bar', () => {

      // given
      const context = component.addSummaryTable();
      vi.spyOn(component.sidenav, 'open').mockReturnValue(undefined);

      // when
      component.configure(new MouseEvent('click'), context);

      // then
      expect(component.sidenav.open).toHaveBeenCalled();
      expect(component.selectedContext).toBe(context);
    });

    it('#changeElementPosition should move selected element to new position', () => {

      // given
      component.addChart();
      component.addGraph();
      component.configure(new MouseEvent(''), component.elementContexts[0]);

      // when
      component.changeElementPosition(2);

      // then
      expect(component.elementContexts.length).toBe(2);
      expect(component.selectedContextPosition).toBe(2);
      expect(component.elementContexts.indexOf(component.selectedContext)).toBe(1);
    });

    it('#drop should move dropped element', () => {

      // given
      const graphContext = component.addGraph();
      const summaryContext = component.addSummaryTable();

      // when
      component.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<object>);

      // then
      expect(component.elementContexts).toEqual([summaryContext, graphContext]);
    });

    it('#removeElement should remove element', () => {

      // given
      component.addSummaryTable();
      component.addGraph();

      // when
      component.removeElement(component.elementContexts[0]);

      // then
      expect(component.elementContexts.length).toBe(1);
    });

    it('#onTitleChanged should change title of element', () => {

      // given
      const context = component.addGraph();

      // when
      component.onTitleChanged(context, 'My Graph');

      // then
      expect(context.title).toBe('My Graph');
    });

    it('#setGridColumns should change grid columns', () => {

      // when
      component.setGridColumns(2);

      // then
      expect(component.gridLayout.gridColumns).toBe(2);
    });

    it('#setGridColumns should narrow larger elements when user confirms', fakeAsync(() => {

      // given
      const context = component.addSummaryTable();
      context.gridColumnSpan = 3;
      mockConfirmDialog(0);

      // when
      component.setGridColumns(2);
      flush();

      // then
      const data: ConfirmDialogData = vi.mocked(dialogService.showConfirmDialog).mock.lastCall[0];
      expect(data.title).toBe(LanguageService.instant('dashboard.gridColumns'));
      expect(data.htmlContent).toBe('<p>' + LanguageService.instant('dashboard.confirmResize') + '</p>');
      expect(component.gridLayout.gridColumns).toBe(2);
      expect(context.gridColumnSpan).toBe(2);
    }));

    it('#setGridColumns should keep grid columns when user declines narrowing larger elements', fakeAsync(() => {

      // given
      const context = component.addSummaryTable();
      context.gridColumnSpan = 3;
      mockConfirmDialog(1);

      // when
      component.setGridColumns(2);
      flush();

      // then
      expect(component.gridLayout.gridColumns).toBe(3);
      expect(context.gridColumnSpan).toBe(3);
    }));

    it('#setGridColumns should not ask for confirmation when all elements fit', () => {

      // given
      const context = component.addSummaryTable();
      context.gridColumnSpan = 2;
      vi.spyOn(dialogService, 'showConfirmDialog');

      // when
      component.setGridColumns(2);

      // then
      expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
      expect(component.gridLayout.gridColumns).toBe(2);
      expect(context.gridColumnSpan).toBe(2);
    });

    it('#ngOnInit should define time units of new elements from fetched entries', () => {

      // when
      const context = component.addSummaryTable();

      // then
      expect(findColumn('Time', context).groupingTimeUnit).toBe(TimeUnit.MILLISECOND);
    });

    it('#ngOnInit should not modify time unit of scene columns', () => {

      // given
      const otherScene = SceneFactory.createScene('2', scene.columns.map(c => ({ ...c, groupingTimeUnit: undefined })));
      getActiveSceneSpy.mockReturnValue(otherScene);

      // when
      component.ngOnInit();

      // then
      expect(findColumn('Time', component.addSummaryTable()).groupingTimeUnit).toBe(TimeUnit.MILLISECOND);
      otherScene.columns.forEach(c => expect(c.groupingTimeUnit).toBeUndefined());
    });

    it('#ngAfterViewInit should select view when no element containers exist', () => {

      // given
      vi.mocked(dialogService.showViewLauncherDialog).mockClear();

      // when
      component.ngAfterViewInit();

      // then
      expect(dialogService.showViewLauncherDialog).toHaveBeenCalledExactlyOnceWith(component);
    });

    it('#addSummaryTable should scroll added element into view when dashboard started empty', fakeAsync(() => {

      // given
      const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockReturnValue(undefined);

      // when
      component.addSummaryTable();
      fixture.detectChanges();

      // then
      expect(scrollIntoViewSpy).toHaveBeenCalledExactlyOnceWith({ block: 'end' });
    }));

    it('#applyView should not scroll elements into view', fakeAsync(() => {

      // given
      const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockReturnValue(undefined);

      // when
      component.applyView(viewOf(Route.GRID, [new SummaryContext(scene.columns), new SummaryContext(scene.columns)]));
      fixture.detectChanges();
      flush();

      // then
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
    }));

    it('#setGridCellRatio should change grid cell ratio', () => {

      // when
      component.setGridCellRatio('4:5');

      // then
      expect(component.gridLayout.gridCellRatio).toBe('4:5');
    });

    it('#showsResizeHandles should be true for selected tile', () => {

      // given
      const graphContext = new GraphContext(scene.columns);
      component.tileSelection.select(graphContext);

      // when
      const shows = component.showsResizeHandles(graphContext);

      // then
      expect(shows).toBe(true);
    });

    it('#showsResizeHandles should be false for unselected tile', () => {

      // when
      const shows = component.showsResizeHandles(new GraphContext(scene.columns));

      // then
      expect(shows).toBe(false);
    });

    it('#showsResizeHandles should be false for selected chart showing its margin', () => {

      // given
      const chartContext = new ChartContext(scene.columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      component.tileSelection.select(chartContext);
      chartContext.toggleShowResizableMargin();

      // when
      const shows = component.showsResizeHandles(chartContext);

      // then
      expect(shows).toBe(false);
    });

    it('should render grid layout markup', () => {

      // given
      component.addGraph();

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('#div_grid'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#div_canvas'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.div_graph koia-graph'))).toBeTruthy();
    });

    it('should render canvas layout markup', () => {

      // given
      component.addGraph();
      component.setLayout(Route.FLEX);

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('#div_grid'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('#div_canvas > .div_canvas_pages .div_canvas_tile .div_graph koia-graph'))).toBeTruthy();
      const pages: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll('.div_canvas_page'));
      expect(pages.map(p => p.classList.contains('div_canvas_page_spare'))).toEqual([false, true]);
    });

    it('grid content should scroll below header', () => {

      // given
      const grid: HTMLElement = fixture.nativeElement.querySelector('#div_grid');

      // when
      (grid.firstElementChild as HTMLElement).style.height = '5000px';

      // then
      expectScrollingBelowHeader(grid);
    });

    it('canvas content should scroll below header', () => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const canvas: HTMLElement = fixture.nativeElement.querySelector('#div_canvas');

      // when
      (canvas.firstElementChild as HTMLElement).style.height = '5000px';

      // then
      expectScrollingBelowHeader(canvas);
    });

    it('grid content should be registered as scrollable', () => {

      // given
      const grid: HTMLElement = fixture.nativeElement.querySelector('#div_grid');

      // when
      const scrollables = TestBed.inject(ScrollDispatcher).getAncestorScrollContainers(grid.firstElementChild as HTMLElement);

      // then
      expect(scrollables.map(s => s.getElementRef().nativeElement)).toContain(grid);
    });

    it('canvas content should be registered as scrollable', () => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const canvas: HTMLElement = fixture.nativeElement.querySelector('#div_canvas');

      // when
      const scrollables = TestBed.inject(ScrollDispatcher).getAncestorScrollContainers(canvas.firstElementChild as HTMLElement);

      // then
      expect(scrollables.map(s => s.getElementRef().nativeElement)).toContain(canvas);
    });

    function expectScrollingBelowHeader(content: HTMLElement): void {
      const header: HTMLElement = fixture.nativeElement.querySelector('.div_header');
      const sidenavContent: HTMLElement = fixture.nativeElement.querySelector('mat-sidenav-content');
      expect(content.classList).toContain('div_content');
      expect(content.scrollHeight).toBeGreaterThan(content.clientHeight);
      expect(content.getBoundingClientRect().top).toBe(header.getBoundingClientRect().bottom);
      expect(sidenavContent.scrollHeight).toBe(sidenavContent.clientHeight);
    }

    it('should render grid tiles as white surface with thin frame instead of heavy shadow', () => {

      // given
      component.addGraph();

      // when
      fixture.detectChanges();

      // then
      expectWhiteThinFramedTiles('#div_grid .div_tile');
    });

    it('should render canvas tiles as white surface with thin frame instead of heavy shadow', () => {

      // given
      component.addGraph();
      component.setLayout(Route.FLEX);

      // when
      fixture.detectChanges();

      // then
      expectWhiteThinFramedTiles('.div_canvas_tile');
    });

    function expectWhiteThinFramedTiles(selector: string): void {
      const tiles: HTMLElement[] = Array.from(fixture.nativeElement.querySelectorAll(selector));
      expect(tiles.length).toBe(1);
      tiles.forEach(tile => {
        expect(tile.classList).toContain('div_tile');
        expect(tile.classList).toContain('mat-elevation-z1');
        expect(tile.classList).not.toContain('mat-elevation-z8');
        const frame = getComputedStyle(tile, '::after');
        expect(frame.borderTopWidth).toBe('1px');
        expect(frame.borderTopColor).toBe('rgb(224, 224, 224)');
        expect(frame.pointerEvents).toBe('none');
        expect(getComputedStyle(tile).backgroundColor).toBe('rgb(255, 255, 255)');
      });
    }

    it('should pass grid columns to side bar in flex layout', () => {

      // given
      component.setLayout(Route.FLEX);
      const context = component.addChart();

      // when
      component.configure(null, context);
      fixture.detectChanges();

      // then
      const sideBar = fixture.debugElement.query(By.css('koia-chart-side-bar'));
      expect(sideBar.properties['gridColumns']).toBe(component.gridLayout.gridColumns);
    });

    it('#setLayout should recreate element contexts for new layout', () => {

      // given
      const chartContext = component.addChart();
      chartContext.title = 'Test Chart';
      chartContext.dataColumns = [findColumn('Amount', chartContext)];
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      const previousContexts = component.elementContexts;

      // when
      component.setLayout(Route.FLEX);

      // then
      expect(component.isGridLayout()).toBe(false);
      expect(component.elementContexts[0]).not.toBe(previousContexts[0]);
      expect(unplacedElementsOf(component.elementContexts)).toEqual(elementsOf(previousContexts));
      expect(component.elementContexts.map(c => [c.x, c.y, c.z])).toEqual([[0, 10, 1], [610, 10, 2]]);
    });

    it('#setLayout should close side bar and clear selection', () => {

      // given
      const context = component.addGraph();
      component.configure(null, context);
      vi.spyOn(component.sidenav, 'close');

      // when
      component.setLayout(Route.FLEX);

      // then
      expect(component.sidenav.close).toHaveBeenCalled();
      expect(component.selectedContext).toBeUndefined();
      expect(component.selectedContextPosition).toBeUndefined();
    });

    it('#setLayout should keep sizes and spans when elements are not rendered', () => {

      // given
      const context = component.addSummaryTable();
      context.setSize(321, 234);
      context.gridColumnSpan = 2;
      context.gridRowSpan = 3;
      context.setPosition(20, 30);
      component.elementContainerDivRefs = new QueryList<ElementRef<HTMLDivElement>>();
      component.gridCellsRef = undefined;
      component.divContentRef = undefined;

      // when
      component.setLayout(Route.FLEX);
      const flexContext = component.elementContexts[0];
      component.divContentRef = undefined;
      component.setLayout(Route.GRID);

      // then
      const gridContext = component.elementContexts[0];
      [flexContext, gridContext].forEach(c => {
        expect([c.width, c.height]).toEqual([321, 234]);
        expect([c.gridColumnSpan, c.gridRowSpan]).toEqual([2, 3]);
        expect([c.x, c.y]).toEqual([20, 30]);
      });
    });

    it('#setLayout should not fire events on old contexts', () => {

      // given
      const chartContext = component.addChart();
      chartContext.dataColumns = [findColumn('Amount', chartContext)];
      const summaryContext = component.addSummaryTable();
      fixture.detectChanges();
      const oldContexts = [chartContext, summaryContext];
      oldContexts.forEach(c => {
        vi.spyOn(c, 'fireSizeChanged');
        vi.spyOn(c, 'fireStructureChanged');
      });

      // when
      component.setLayout(Route.FLEX);

      // then
      oldContexts.forEach(c => {
        expect(c.fireSizeChanged).not.toHaveBeenCalled();
        expect(c.fireStructureChanged).not.toHaveBeenCalled();
      });
    });

    it('#setLayout should fire structure change on recreated chart contexts after rendering', fakeAsync(() => {

      // given
      const chartContext = component.addChart();
      chartContext.dataColumns = [findColumn('Amount', chartContext)];
      component.addSummaryTable();

      // when
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const [newChartContext, newSummaryContext] = component.elementContexts;
      vi.spyOn(newChartContext, 'fireStructureChanged');
      vi.spyOn(newSummaryContext, 'fireStructureChanged');
      tick();

      // then
      expect(newChartContext.fireStructureChanged).toHaveBeenCalledTimes(1);
      expect(newSummaryContext.fireStructureChanged).not.toHaveBeenCalled();
    }));

    it('#setLayout should not fire structure change while entries are loading', fakeAsync(() => {

      // given
      const chartContext = component.addChart();
      chartContext.dataColumns = [findColumn('Amount', chartContext)];
      component.entries = undefined;

      // when
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const newChartContext = component.elementContexts[0];
      vi.spyOn(newChartContext, 'fireStructureChanged');
      tick();

      // then
      expect(newChartContext.fireStructureChanged).not.toHaveBeenCalled();
    }));

    it('#setLayout should not fire structure change for chart without data column', fakeAsync(() => {

      // given
      component.addChart();

      // when
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const newChartContext = component.elementContexts[0];
      vi.spyOn(newChartContext, 'fireStructureChanged');
      tick();

      // then
      expect(newChartContext.fireStructureChanged).not.toHaveBeenCalled();
    }));

    it('#setLayout should fire structure change for row count chart without data column', fakeAsync(() => {

      // given
      const chartContext = component.addChart();
      chartContext.chartType = ChartType.LINE.type;
      chartContext.aggregations = [Aggregation.ROW_COUNT];

      // when
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const newChartContext = component.elementContexts[0];
      vi.spyOn(newChartContext, 'fireStructureChanged');
      tick();

      // then
      expect(newChartContext.fireStructureChanged).toHaveBeenCalledTimes(1);
    }));

    describe('with rendered tiles', () => {

      beforeAll(() => page.viewport(1280, 800));

      afterAll(() => page.viewport(414, 896));

      function renderHalfWidthSummaries(): void {
        renderGridSummaries(4, [[2, 1], [2, 1]]);
      }

      function renderGridSummaries(gridColumns: number, spans: number[][], gridCellRatio = '1:1'): void {
        component.gridLayout.gridColumns = gridColumns;
        component.gridLayout.gridCellRatio = gridCellRatio;
        component.elementContexts = spans.map(([columnSpan, rowSpan]) => {
          const context = new SummaryContext(scene.columns);
          context.gridColumnSpan = columnSpan;
          context.gridRowSpan = rowSpan;
          return context;
        });
        fixture.detectChanges();
      }

      it('#grid tiles of different column spans should share bottom edge in same row', () => {

        // when
        renderGridSummaries(4, [[2, 1], [1, 1]]);

        // then
        const [wideTile, narrowTile] = rectsOf('#div_grid .div_tile');
        expect(wideTile.top).toBeCloseTo(narrowTile.top, 0);
        expect(wideTile.bottom).toBeCloseTo(narrowTile.bottom, 0);
      });

      it('#grid tile spanning two rows should end at bottom of second row', () => {

        // when
        renderGridSummaries(2, [[1, 2], [1, 1], [1, 1]]);

        // then
        const [tallTile, upperTile, lowerTile] = rectsOf('#div_grid .div_tile');
        expect(upperTile.top).toBeCloseTo(tallTile.top, 0);
        expect(lowerTile.top).toBeGreaterThan(upperTile.bottom);
        expect(lowerTile.bottom).toBeCloseTo(tallTile.bottom, 0);
      });

      function rectsOf(selector: string): DOMRect[] {
        return Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll(selector)).map(e => e.getBoundingClientRect());
      }

      function expectSameRects(actual: DOMRect[], expected: DOMRect[]): void {
        expect(actual.length).toBe(expected.length);
        actual.forEach((rect, i) => {
          expect(rect.left).toBeCloseTo(expected[i].left, 0);
          expect(rect.top).toBeCloseTo(expected[i].top, 0);
          expect(rect.width).toBeCloseTo(expected[i].width, 0);
          expect(rect.height).toBeCloseTo(expected[i].height, 0);
        });
      }

      it('#showCanvas without pages should keep rendered tile rects', () => {

        // given
        renderGridSummaries(3, [[1, 2], [1, 1], [1, 1], [2, 1]], '2:1');
        const gridRects = rectsOf('#div_grid .div_tile');

        // when
        component.showCanvas(CanvasPaging.NONE);
        fixture.detectChanges();

        // then
        expectSameRects(rectsOf('.div_canvas_tile'), gridRects);
      });

      /**
       * @returns the rects of the tiles in page units relative to the given layer origin
       */
      function pageUnitRectsOf(selector: string, origin: Element, scale: number): DOMRect[] {
        const originRect = origin.getBoundingClientRect();
        return rectsOf(selector).map(r => new DOMRect((r.left - originRect.left) / scale, (r.top - originRect.top) / scale, r.width / scale,
          r.height / scale));
      }

      it('#setLayout to free canvas should keep tile rects of grid in page units below sheet header and top padding', () => {

        // given
        renderGridSummaries(3, [[1, 2], [1, 1], [1, 1], [2, 1]], '2:1');
        const cells = component.gridCellsRef.nativeElement;
        const gridRects = pageUnitRectsOf('#div_grid .div_tile', cells, cells.clientWidth / PageFormat.LANDSCAPE.width);

        // when
        component.setLayout(Route.FLEX);
        fixture.detectChanges();

        // then
        const firstPageContent = fixture.nativeElement.querySelector('.div_canvas_page_content');
        expectSameRects(pageUnitRectsOf('.div_canvas_tile', firstPageContent, canvasScale()),
          gridRects.map(r => new DOMRect(r.x, r.y + PageFormat.TOP_PADDING, r.width, r.height)));
      });

      it('#setLayout to free canvas should push tiles crossing page to next page', () => {

        // given
        renderGridSummaries(3, [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]);

        // when
        component.setLayout(Route.FLEX);

        // then
        const tops = component.elementContexts.map(c => c.y);
        expect(tops.slice(0, 3)).toEqual([10, 10, 10]);
        expect(tops[3] + component.elementContexts[3].height).toBeLessThanOrEqual(PageFormat.LANDSCAPE.height);
        expect(tops[6]).toBe(PageFormat.LANDSCAPE.height + PageFormat.TOP_PADDING);
      });

      it('#setLayout to free canvas should place tile with zero-sized rect below converted tiles', () => {

        // given
        renderHalfWidthSummaries();
        const tile = component.elementContainerDivRefs.get(0).nativeElement.parentElement;
        vi.spyOn(tile, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 0));

        // when
        component.setLayout(Route.FLEX);

        // then
        const [unrendered, converted] = component.elementContexts;
        expect([unrendered.x, unrendered.y]).toEqual([0, converted.y + converted.height + 10]);
      });

      it.each([CanvasPaging.LANDSCAPE, CanvasPaging.NONE])('#setLayout to grid should derive spans from size on %s canvas', paging => {

        // given
        component.gridLayout.gridColumns = 4;
        component.gridLayout.gridCellRatio = '1:1';
        renderCanvasSummaries([[0, 0, 690, 340], [0, 350, 1390, 340]], paging);

        // when
        component.setLayout(Route.GRID);

        // then
        expect(component.elementContexts.map(c => [c.gridColumnSpan, c.gridRowSpan])).toEqual([[2, 1], [4, 1]]);
      });

      it('#setLayout to grid should order tiles by reading order', () => {

        // given
        const [right, left, below] = renderCanvasSummaries([[700, 0, 300, 300], [0, 0, 300, 300], [0, 500, 300, 300]]);
        [right.title, left.title, below.title] = ['right', 'left', 'below'];

        // when
        component.setLayout(Route.GRID);

        // then
        expect(component.elementContexts.map(c => c.title)).toEqual(['left', 'right', 'below']);
      });

      it('#setLayout to grid should keep spans when canvas is not rendered', () => {

        // given
        renderGridSummaries(4, [[2, 3]]);
        component.setLayout(Route.FLEX);

        // when
        component.setLayout(Route.GRID);

        // then
        expect([component.elementContexts[0].gridColumnSpan, component.elementContexts[0].gridRowSpan]).toEqual([2, 3]);
      });

      it('should render tile on page of its top', () => {

        // when
        renderCanvasSummaries([[0, 0, 600, 400], [0, 960, 600, 400]]);

        // then
        const secondPage: HTMLElement = fixture.nativeElement.querySelectorAll('.div_canvas_page_content')[1];
        const tileRect = secondPage.querySelector('.div_canvas_tile').getBoundingClientRect();
        expect(tileRect.top - secondPage.getBoundingClientRect().top).toBeCloseTo(10 * canvasScale(), 0);
      });

      it('canvas tiles should be absolutely positioned', () => {

        // when
        renderCanvasSummaries([[100, 50, 600, 400]]);

        // then
        const [tileRect] = rectsOf('.div_canvas_tile');
        expect(getComputedStyle(fixture.nativeElement.querySelector('.div_canvas_tile')).position).toBe('absolute');
        expect(tileRect.left - pagesRect().left).toBeCloseTo(layerX(100) * canvasScale(), 0);
        expect(tileRect.top - pagesRect().top).toBeCloseTo(layerY(50) * canvasScale(), 0);
        expect(tileRect.width).toBeCloseTo(600 * canvasScale(), 0);
      });

      it('should render canvas guides', () => {

        // given
        renderCanvasSummaries([[0, 0, 600, 400]]);
        component.canvasGuides = [{ axis: 'x', position: 700 }, { axis: 'y', position: 400 }];

        // when
        fixture.detectChanges();

        // then
        const [vertical, horizontal] = rectsOf('.div_canvas_pages > .div_canvas_guide');
        expect(vertical.left - pagesRect().left).toBeCloseTo(700 * canvasScale(), 0);
        expect(vertical.height).toBeCloseTo(pagesRect().height, 0);
        expect(horizontal.top - pagesRect().top).toBeCloseTo(400 * canvasScale(), 0);
        expect(horizontal.width).toBeCloseTo(pagesRect().width, 0);
      });

      it('should render resize preview on canvas', () => {

        // given
        renderCanvasSummaries([[0, 0, 600, 400]]);
        component.resizePreview = { left: 10, top: 20, width: 100, height: 50 };

        // when
        fixture.detectChanges();

        // then
        const [previewRect] = rectsOf('.div_canvas_pages > .div_resize_preview');
        expect(previewRect.left - pagesRect().left).toBeCloseTo(10, 0);
        expect(previewRect.top - pagesRect().top).toBeCloseTo(20, 0);
        expect([previewRect.width, previewRect.height]).toEqual([100, 50]);
      });

      describe('canvas pages', () => {

        function canvas(): HTMLElement {
          return fixture.nativeElement.querySelector('#div_canvas');
        }

        function canvasContentWidth(): number {
          return canvas().clientWidth - 2 * PageFormat.DESK_GUTTER_PX;
        }

        function sheets(): HTMLElement[] {
          return Array.from(fixture.nativeElement.querySelectorAll('.div_canvas_page'));
        }

        it('portrait pages should be centred at the scale of landscape pages', () => {

          // when
          renderCanvasSummaries([[0, 0, 600, 400]], CanvasPaging.PORTRAIT);

          // then
          const canvasLeft = canvas().getBoundingClientRect().left + PageFormat.DESK_GUTTER_PX;
          const pages = pagesRect();
          expect(pages.width).toBeCloseTo(canvasContentWidth() * PageFormat.PORTRAIT.sheetWidth / PageFormat.LANDSCAPE.sheetWidth, 0);
          expect(pages.left - canvasLeft).toBeCloseTo((canvasContentWidth() - pages.width) / 2, 0);
          expect(canvasScale()).toBeCloseTo(canvasContentWidth() / PageFormat.LANDSCAPE.sheetWidth, 2);
        });

        it('portrait sheet should consist of header, page content and footer in page units within paper margins', () => {

          // when
          renderCanvasSummaries([[0, 0, 600, 400]], CanvasPaging.PORTRAIT);

          // then
          const sheet = sheets()[0];
          const [header, content, footer] = Array.from(sheet.children).map(c => c.getBoundingClientRect());
          const scale = canvasScale();
          expect(header.height).toBeCloseTo(PageFormat.SHEET_HEADER * scale, 0);
          expect(Math.abs(content.height - 1400 * scale)).toBeLessThan(1);
          expect(footer.height).toBeCloseTo(PageFormat.SHEET_FOOTER * scale, 0);
          expect(Math.abs(sheet.getBoundingClientRect().height - PageFormat.PORTRAIT.sheetHeight * scale)).toBeLessThan(1);
          expect(header.left - sheet.getBoundingClientRect().left).toBeCloseTo(PageFormat.PORTRAIT.marginX * scale, 0);
          expect(header.top - sheet.getBoundingClientRect().top).toBeCloseTo(PageFormat.PORTRAIT.marginY * scale, 0);
        });

        it('sheets should lie on desk within gutter', () => {

          // when
          renderCanvasSummaries([[0, 0, 600, 400]]);

          // then
          const style = getComputedStyle(canvas());
          expect(canvas().classList).toContain('div_canvas_desk');
          expect(style.paddingTop).toBe(PageFormat.DESK_GUTTER_PX + 'px');
          expect(style.paddingLeft).toBe(PageFormat.DESK_GUTTER_PX + 'px');
          expect(style.backgroundColor).toBe('rgb(217, 220, 225)');
        });

        it.each([
          { layout: 'grid', show: (): void => component.snapToGrid(), selector: '#div_grid' },
          { layout: 'free canvas', show: (): void => component.showCanvas(CanvasPaging.NONE), selector: '#div_canvas' }
        ])('$layout should keep content padding without desk', ({ show, selector }) => {

          // when
          show();
          fixture.detectChanges();

          // then
          const content: HTMLElement = fixture.nativeElement.querySelector(selector);
          expect(content.classList).not.toContain('div_canvas_desk');
          expect(getComputedStyle(content).paddingTop).toBe(GridLayout.PADDING_PX + 'px');
        });

        it('sheets should be separated by desk gutter', () => {

          // when
          renderCanvasSummaries([[0, 0, 600, 400], [0, 960, 600, 400]]);

          // then
          const [first, second] = sheets().map(s => s.getBoundingClientRect());
          expect(second.top - first.bottom).toBeCloseTo(PageFormat.DESK_GUTTER_PX, 0);
        });

        it('sheets should show heading and page number, the spare sheet neither', () => {

          // given
          component.tab = dashboardTab();

          // when
          renderCanvasSummaries([[0, 0, 600, 400], [0, 960, 600, 400]]);

          // then
          const [first, second, spare] = sheets();
          expect(first.querySelector('.div_canvas_sheet_header img')).toBeTruthy();
          expect(first.querySelector('.div_canvas_sheet_header .span_print_title').textContent).toBe('Dashboard 1');
          expect(first.querySelector('.div_canvas_sheet_header .span_print_details').textContent).toContain('Scene: Scene 1');
          expect(first.querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('Page 1 of 2');
          expect(second.querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('Page 2 of 2');
          expect(spare.querySelector('.div_canvas_sheet_header').children.length).toBe(0);
          expect(spare.querySelector('.div_canvas_sheet_footer').textContent.trim()).toBe('');
        });

        it('sheets should be drawn as paper, the spare sheet faded', () => {

          // when
          renderCanvasSummaries([[0, 0, 600, 400]]);

          // then
          const [sheet, spare] = sheets();
          expect(sheet.classList).toContain('div_canvas_sheet');
          expect(getComputedStyle(sheet).boxShadow).not.toBe('none');
          expect(getComputedStyle(sheet).opacity).toBe('1');
          expect(getComputedStyle(spare).opacity).toBe('0.5');
        });

        it('free canvas should show one page as high as its tiles, without sheet, heading or footer', () => {

          // when
          renderCanvasSummaries([[0, 0, 600, 400], [0, 900, 600, 400]], CanvasPaging.NONE);

          // then
          const [page, spare] = sheets();
          expect(page.querySelector('.div_canvas_page_content').getBoundingClientRect().height).toBeCloseTo(1300 * canvasScale(), 0);
          expect(page.querySelectorAll('.div_canvas_page_content > .div_canvas_tile').length).toBe(2);
          expect(sheets().some(s => s.classList.contains('div_canvas_sheet'))).toBe(false);
          expect(fixture.nativeElement.querySelector('.div_canvas_sheet_header, .div_canvas_sheet_footer')).toBeNull();
          expect(getComputedStyle(spare).opacity).toBe('1');
        });

        it.each([
          { layout: 'grid', show: (): void => component.snapToGrid(), sheets: undefined, inSheets: false },
          { layout: 'free canvas', show: (): void => component.showCanvas(CanvasPaging.NONE), sheets: undefined, inSheets: false },
          { layout: 'landscape pages', show: (): void => component.showCanvas(CanvasPaging.LANDSCAPE), sheets: CanvasPaging.LANDSCAPE, inSheets: true },
          { layout: 'portrait pages', show: (): void => component.showCanvas(CanvasPaging.PORTRAIT), sheets: CanvasPaging.PORTRAIT, inSheets: true }
        ])('print heading of $layout should print sheets $sheets and in sheets $inSheets', ({ show, sheets, inSheets }) => {

          // when
          show();
          fixture.detectChanges();

          // then
          const heading = fixture.debugElement.query(By.directive(PrintHeadingComponent));
          expect((heading.componentInstance as PrintHeadingComponent).printSheets).toBe(sheets);
          expect(heading.nativeElement.classList.contains('koia-print-heading-in-sheets')).toBe(inSheets);
        });

        it('#onPrintStart should show print time on sheets', () => {

          // given
          renderCanvasSummaries([[0, 0, 600, 400]]);

          // when
          component.onPrintStart(new Date(2026, 9, 16, 13, 25, 26));

          // then
          expect(sheets()[0].querySelector('.span_print_details').textContent).toContain('Oct 16, 2026');
        });

        it('print heading should pass print time to sheets when printing starts', () => {

          // given
          renderCanvasSummaries([[0, 0, 600, 400]]);
          const printedAt = new Date(2026, 9, 16, 13, 25, 26);

          // when
          fixture.debugElement.query(By.directive(PrintHeadingComponent)).componentInstance.printStart.emit(printedAt);

          // then
          expect(component.printedAt).toBe(printedAt);
        });

        it('#constrainFreeMove should map pointer on second sheet to page and back', () => {

          // given
          const [moved] = renderCanvasSummaries([[0, 0, 600, 400], [700, 960, 600, 400]]);
          component.onFreeMoveStarted(moved);

          // when
          const point = constrainMoveTo(0, 1100);
          component.onFreeMoveEnded(moved, dragEnd());

          // then
          expect(point.y).toBeCloseTo(pagesRect().top + layerY(1100) * canvasScale(), 5);
          expect(moved.y).toBe(1100);
        });

        it('#onFreeMoving should show guides on second sheet below its header', () => {

          // given
          const [moved] = renderCanvasSummaries([[0, 0, 600, 400], [0, 960, 600, 400]]);
          component.onFreeMoveStarted(moved);
          constrainMoveTo(603, 963);

          // when
          component.onFreeMoving(moveEventInMiddle());

          // then
          expect(component.canvasGuides).toEqual([{ axis: 'x', position: layerX(600) }, { axis: 'y', position: layerY(960) }]);
        });

        it('#onFreeResizing should preview size on second sheet below its header', () => {

          // given
          const [resized] = renderCanvasSummaries([[0, 960, 600, 400]]);
          component.onFreeResizeStart(resized);
          const scale = canvasScale();

          // when
          component.onFreeResizing(resized, resizeEvent(697 * scale, 397 * scale));

          // then
          expect(component.resizePreview.top).toBeCloseTo(layerY(960) * scale, 5);
        });

        it('#onFreeResizeEnd by top edge on second sheet should stay within its page', () => {

          // given
          const [resized] = renderCanvasSummaries([[0, 1000, 600, 400]]);
          component.onFreeResizeStart(resized);
          const scale = canvasScale();

          // when
          component.onFreeResizeEnd(resized, resizeEvent(600 * scale, 500 * scale, 0, 0, { top: -100 * scale }));

          // then
          expect([resized.y, resized.height]).toEqual([950, 450]);
        });

        it('#onFreeMoveEnded should leave tile across former page boundary on free canvas', () => {

          // given
          const [moved] = renderCanvasSummaries([[0, 0, 600, 400]], CanvasPaging.NONE);
          component.onFreeMoveStarted(moved);
          constrainMoveTo(0, 803);

          // when
          component.onFreeMoveEnded(moved, dragEnd());

          // then
          expect(moved.y).toBe(800);
        });

        it('#showCanvas with portrait pages should pack grid tiles into portrait page width', () => {

          // given
          renderGridSummaries(2, [[1, 1], [1, 1]]);

          // when
          component.showCanvas(CanvasPaging.PORTRAIT);

          // then
          const [first, second] = component.elementContexts;
          expect(component.elementContexts.every(c => c.x + c.width <= 950)).toBe(true);
          expect(second.y).toBeGreaterThanOrEqual(first.y + first.height);
        });

        it('#showCanvas should keep tile sizes switching from landscape to portrait and back', () => {

          // given
          renderCanvasSummaries([[0, 0, 600, 400], [610, 0, 600, 400]]);
          component.showCanvas(CanvasPaging.PORTRAIT);

          // when
          component.showCanvas(CanvasPaging.LANDSCAPE);

          // then
          expect(component.elementContexts.map(c => [c.x, c.y, c.width, c.height])).toEqual([[0, 10, 600, 400], [0, 420, 600, 400]]);
        });

        it('#showCanvas without pages should keep positions of paged tiles', () => {

          // given
          renderCanvasSummaries([[100, 960, 600, 400]], CanvasPaging.PORTRAIT);

          // when
          component.showCanvas(CanvasPaging.NONE);

          // then
          expect(component.elementContexts.map(c => [c.x, c.y])).toEqual([[100, 960]]);
        });

        it('#showCanvas should keep tiles without persisting when showing the shown pages', () => {

          // given
          const contexts = renderCanvasSummaries([[0, 0, 600, 400]], CanvasPaging.PORTRAIT);
          const persist = requestPersistSpy();

          // when
          component.showCanvas(CanvasPaging.PORTRAIT);

          // then
          expect(component.elementContexts).toEqual(contexts);
          expect(component.elementContexts[0]).toBe(contexts[0]);
          expect(persist).not.toHaveBeenCalled();
        });
      });

      it('guides and resize preview should be stacked above tiles', () => {

        // given
        renderCanvasSummaries([[0, 0, 600, 400]]);
        component.canvasGuides = [{ axis: 'x', position: 700 }];
        component.resizePreview = { left: 10, top: 20, width: 100, height: 50 };

        // when
        fixture.detectChanges();

        // then
        expect(getComputedStyle(fixture.nativeElement.querySelector('.div_canvas_guide')).zIndex).toBe('100001');
        expect(getComputedStyle(fixture.nativeElement.querySelector('.div_resize_preview')).zIndex).toBe('100001');
      });

      it('grid and canvas content should reserve scrollbar gutter', () => {

        // given
        const gridGutter = getComputedStyle(fixture.nativeElement.querySelector('#div_grid')).scrollbarGutter;

        // when
        component.setLayout(Route.FLEX);
        fixture.detectChanges();

        // then
        expect(gridGutter).toBe('stable');
        expect(getComputedStyle(fixture.nativeElement.querySelector('#div_canvas')).scrollbarGutter).toBe('stable');
      });

      function contentWidth(): number {
        return component.divContentRef.nativeElement.clientWidth;
      }

      function renderGridSummariesForResize(spans: number[][]): number {
        renderGridSummaries(4, spans);
        component.onGridResizeStart();
        return contentWidth() / 4;
      }

      function expectPreview(expected: { left: number, top: number, width: number, height: number }): void {
        const preview = component.resizePreview;
        expect(preview.left).toBeCloseTo(expected.left, 0);
        expect(preview.top).toBeCloseTo(expected.top, 0);
        expect(preview.width).toBeCloseTo(expected.width, 0);
        expect(preview.height).toBeCloseTo(expected.height, 0);
      }

      it('#onGridResizing should keep content width of resize start', () => {

        // given
        const pitch = renderGridSummariesForResize([[3, 1]]);
        component.divContentRef = { nativeElement: { clientWidth: contentWidth() - 17 } } as ElementRef<HTMLDivElement>;

        // when
        component.onGridResizing(component.elementContexts[0], resizeEvent(3 * pitch - 10, pitch - 10));

        // then
        expect(component.resizePreview.width).toBeCloseTo(3 * pitch - 10, 0);
      });

      it('#onGridResizing should preview cells whose middle the edge reaches', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);

        // when
        component.onGridResizing(component.elementContexts[0], resizeEvent(1.5 * pitch - 4, 1.5 * pitch - 4));

        // then
        expectPreview({ left: 0, top: 0, width: 2 * pitch - 10, height: 2 * pitch - 10 });
      });

      it('#onGridResizing should preview shrunk tile as soon as edge passes back before middle of its last cell', () => {

        // given
        const pitch = renderGridSummariesForResize([[2, 2]]);

        // when
        component.onGridResizing(component.elementContexts[0], resizeEvent(1.5 * pitch - 6, 1.5 * pitch - 6));

        // then
        expectPreview({ left: 0, top: 0, width: pitch - 10, height: pitch - 10 });
      });

      it('#onGridResizing should limit preview to grid columns', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1], [1, 1], [1, 1], [1, 1]]);

        // when
        component.onGridResizing(component.elementContexts[0], resizeEvent(2 * pitch - 10, pitch - 10, 3 * pitch));

        // then
        expect(component.resizePreview.width).toBeCloseTo(pitch - 10, 0);
      });

      it('should render grid resize preview', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);
        component.onGridResizing(component.elementContexts[0], resizeEvent(1.5 * pitch - 4, 1.5 * pitch - 4));

        // when
        fixture.detectChanges();

        // then
        const cellsRect: DOMRect = fixture.nativeElement.querySelector('.div_grid_cells').getBoundingClientRect();
        const [previewRect] = rectsOf('.div_grid_cells > .div_resize_preview');
        expect(previewRect.left - cellsRect.left).toBeCloseTo(0, 0);
        expect(previewRect.top - cellsRect.top).toBeCloseTo(0, 0);
        expect(previewRect.width).toBeCloseTo(2 * pitch - 10, 0);
        expect(previewRect.height).toBeCloseTo(2 * pitch - 10, 0);
      });

      it('#onGridResizeEnd should snap tile to cells whose middle the edges reach', () => {

        // given
        renderGridSummariesForResize([[1, 1], [1, 1]]);
        const cw = contentWidth();
        component.onGridResizing(component.elementContexts[0], resizeEvent(cw / 2, cw / 2));
        const context = component.elementContexts[0];

        // when
        component.onGridResizeEnd(context, resizeEvent(cw / 2 - 10 + 7, cw / 2 - 10 - 6));
        fixture.detectChanges();

        // then
        expect([context.gridColumnSpan, context.gridRowSpan]).toEqual([2, 2]);
        const tileRect = rectsOf('#div_grid .div_tile')[0];
        expect(tileRect.width).toBeCloseTo(cw / 2 - 10, 0);
        expect(tileRect.height).toBeCloseTo(cw / 2 - 10, 0);
        expect(component.resizePreview).toBeUndefined();
      });

      it('#onGridResizeEnd should limit column span to grid columns', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1], [1, 1], [1, 1], [1, 1]]);
        const context = component.elementContexts[3];

        // when
        component.onGridResizeEnd(context, resizeEvent(3 * pitch, pitch - 10, 3 * pitch));

        // then
        expect(context.gridColumnSpan).toBe(1);
      });

      it('#onGridResizing by left edge should preview widened tile at its origin', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);

        // when
        component.onGridResizing(component.elementContexts[0], resizeEvent(2 * pitch - 10, pitch - 10, -pitch, 0, { left: -pitch }));

        // then
        expectPreview({ left: 0, top: 0, width: 2 * pitch - 10, height: pitch - 10 });
      });

      it('#onGridResizeEnd by left edge should widen column span', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);
        const context = component.elementContexts[0];

        // when
        component.onGridResizeEnd(context, resizeEvent(2 * pitch - 10, pitch - 10, -pitch, 0, { left: -pitch }));

        // then
        expect([context.gridColumnSpan, context.gridRowSpan]).toEqual([2, 1]);
      });

      it('#onGridResizeEnd by top edge should heighten row span', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);
        const context = component.elementContexts[0];

        // when
        component.onGridResizeEnd(context, resizeEvent(pitch - 10, 2 * pitch - 10, 0, -pitch, { top: -pitch }));

        // then
        expect([context.gridColumnSpan, context.gridRowSpan]).toEqual([1, 2]);
      });

      it('#onGridResizeEnd by left edge should limit column span to columns right of tile column', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1], [1, 1], [1, 1], [1, 1]]);
        const context = component.elementContexts[3];

        // when
        component.onGridResizeEnd(context, resizeEvent(2 * pitch - 10, pitch - 10, 2 * pitch, 0, { left: -pitch }));

        // then
        expect(context.gridColumnSpan).toBe(1);
      });

      function renderCanvasSummaries(rects: number[][], paging = CanvasPaging.LANDSCAPE): SummaryContext[] {
        component.showCanvas(paging);
        component.elementContexts = rects.map(([x, y, width, height], i) => {
          const context = new SummaryContext(scene.columns);
          context.setPosition(x, y);
          context.setSize(width, height);
          context.z = i + 1;
          return context;
        });
        fixture.detectChanges();
        return component.elementContexts as SummaryContext[];
      }

      function canvasScale(): number {
        return component.canvasPagesRef.nativeElement.clientWidth / component.freeLayout.pageFormat.sheetWidth;
      }

      /**
       * @returns the x on the rendered sheets in page units
       */
      function layerX(x: number): number {
        return component.freeLayout.layerXOf(x);
      }

      /**
       * @returns the y on the rendered sheets in page units, the sheets separated by the desk gutter
       */
      function layerY(y: number): number {
        return component.freeLayout.layerYOf(y, PageFormat.DESK_GUTTER_PX / canvasScale());
      }

      function pagesRect(): DOMRect {
        return component.canvasPagesRef.nativeElement.getBoundingClientRect();
      }

      const PICKUP = { x: 10, y: 10 };

      function constrainMoveTo(x: number, y: number, pages = pagesRect()): { x: number, y: number } {
        const scale = canvasScale();
        return component.constrainFreeMove({ x: pages.left + layerX(x) * scale + PICKUP.x, y: pages.top + layerY(y) * scale + PICKUP.y }, null, null,
          PICKUP);
      }

      function dragEnd(): CdkDragEnd {
        return { source: { reset: vi.fn() } } as unknown as CdkDragEnd;
      }

      function requestPersistSpy(): Mock {
        return vi.spyOn(component as unknown as { requestPersist: () => void }, 'requestPersist');
      }

      it('#constrainFreeMove should snap tile to aligned position', () => {

        // given
        const [, moved] = renderCanvasSummaries([[0, 0, 600, 400], [0, 410, 600, 400]]);
        component.onFreeMoveStarted(moved);

        // when
        const point = constrainMoveTo(603, 3);

        // then
        expect(point.x).toBeCloseTo(pagesRect().left + layerX(600) * canvasScale(), 5);
        expect(point.y).toBeCloseTo(pagesRect().top + layerY(0) * canvasScale(), 5);
      });

      it('#constrainFreeMove should follow scrolled canvas', () => {

        // given
        const [, moved] = renderCanvasSummaries([[0, 0, 600, 400], [0, 410, 600, 400]]);
        const startRect = pagesRect();
        component.onFreeMoveStarted(moved);
        const scrolledRect = new DOMRect(startRect.left, startRect.top - 100, startRect.width, startRect.height);
        vi.spyOn(component.canvasPagesRef.nativeElement, 'getBoundingClientRect').mockReturnValue(scrolledRect);

        // when
        const point = constrainMoveTo(603, 3, scrolledRect);

        // then
        expect(point.x).toBeCloseTo(startRect.left + layerX(600) * canvasScale(), 5);
        expect(point.y).toBeCloseTo(startRect.top + layerY(0) * canvasScale(), 5);
      });

      it('#onFreeMoving should show guides of snap', () => {

        // given
        const [, moved] = renderCanvasSummaries([[0, 0, 600, 400], [0, 410, 600, 300]]);
        component.onFreeMoveStarted(moved);
        constrainMoveTo(603, 3);

        // when
        component.onFreeMoving(moveEventInMiddle());

        // then
        expect(component.canvasGuides).toEqual([{ axis: 'x', position: layerX(600) }, { axis: 'y', position: layerY(0) }]);
      });

      it('#onFreeMoving should show no guides before first move', () => {

        // given
        const [moved] = renderCanvasSummaries([[0, 0, 600, 400]]);
        component.onFreeMoveStarted(moved);

        // when
        component.onFreeMoving(moveEventInMiddle());

        // then
        expect(component.canvasGuides).toEqual([]);
      });

      it('#onFreeMoveEnded should set position, bring tile to front and reset drag', () => {

        // given
        const [moved, other] = renderCanvasSummaries([[0, 410, 600, 400], [0, 0, 600, 400]]);
        component.onFreeMoveStarted(moved);
        constrainMoveTo(603, 3);
        component.onFreeMoving(moveEventInMiddle());
        const event = dragEnd();

        // when
        component.onFreeMoveEnded(moved, event);

        // then
        expect([moved.x, moved.y]).toEqual([600, 0]);
        expect(moved.z).toBeGreaterThan(other.z);
        expect(event.source.reset).toHaveBeenCalled();
        expect(component.canvasGuides).toEqual([]);
      });

      it('#onFreeMoveEnded should keep position without move', () => {

        // given
        const [moved] = renderCanvasSummaries([[100, 200, 600, 400]]);
        component.onFreeMoveStarted(moved);
        const event = dragEnd();

        // when
        component.onFreeMoveEnded(moved, event);

        // then
        expect([moved.x, moved.y]).toEqual([100, 200]);
        expect(event.source.reset).toHaveBeenCalled();
      });

      it('#onFreeMoveEnded should re-render chart moved to other page', fakeAsync(() => {

        // given
        component.setLayout(Route.FLEX);
        const chartContext = component.addChart();
        chartContext.dataColumns = [findColumn('Amount', chartContext)];
        fixture.detectChanges();
        component.onFreeMoveStarted(chartContext);
        constrainMoveTo(0, PageFormat.LANDSCAPE.height + 2);
        vi.spyOn(chartContext, 'fireStructureChanged');

        // when
        component.onFreeMoveEnded(chartContext, dragEnd());
        tick();

        // then
        expect(chartContext.y).toBe(PageFormat.LANDSCAPE.height);
        expect(chartContext.fireStructureChanged).toHaveBeenCalledTimes(1);
      }));

      it('#onFreeMoveEnded should not re-render chart moved within page', fakeAsync(() => {

        // given
        component.setLayout(Route.FLEX);
        const chartContext = component.addChart();
        chartContext.dataColumns = [findColumn('Amount', chartContext)];
        fixture.detectChanges();
        component.onFreeMoveStarted(chartContext);
        constrainMoveTo(0, 103);
        vi.spyOn(chartContext, 'fireStructureChanged');

        // when
        component.onFreeMoveEnded(chartContext, dragEnd());
        tick();

        // then
        expect(chartContext.y).toBe(100);
        expect(chartContext.fireStructureChanged).not.toHaveBeenCalled();
      }));

      it('#onFreeResizing should preview snapped size', () => {

        // given
        const [resized] = renderCanvasSummaries([[0, 0, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizing(resized, resizeEvent(697 * scale, 397 * scale));

        // then
        expect(component.resizePreview.left).toBeCloseTo(layerX(0) * scale, 5);
        expect(component.resizePreview.top).toBeCloseTo(layerY(0) * scale, 5);
        expect(component.resizePreview.width).toBeCloseTo(700 * scale, 5);
        expect(component.resizePreview.height).toBeCloseTo(400 * scale, 5);
        expect(component.canvasGuides).toEqual([{ axis: 'x', position: layerX(700) }]);
      });

      it('#onFreeMoving should let content follow pointer of moved tile', () => {

        // given
        const [moved] = renderCanvasSummaries([[0, 0, 600, 400]]);
        const follow = vi.spyOn(DragAutoScroll.prototype, 'follow');
        component.onFreeMoveStarted(moved);
        const move = moveEventInMiddle();

        // when
        component.onFreeMoving(move);

        // then
        expect(follow).toHaveBeenCalledWith(move.event);
        expect(follow.mock.contexts[0]['scroller']).toBe(component.divContentRef.nativeElement);
      });

      it('#onFreeMoveEnded should stop scrolling content', () => {

        // given
        const [moved] = renderCanvasSummaries([[0, 0, 600, 400]]);
        const stop = vi.spyOn(DragAutoScroll.prototype, 'stop');
        component.onFreeMoveStarted(moved);

        // when
        component.onFreeMoveEnded(moved, dragEnd());

        // then
        expect(stop).toHaveBeenCalledTimes(1);
      });

      it('#onFreeResizeEnd should end resizing without scrolling content', () => {

        // given
        const [resized] = renderCanvasSummaries([[0, 0, 600, 400]]);
        const stop = vi.spyOn(DragAutoScroll.prototype, 'stop');
        component.onFreeResizeStart(resized);

        // when
        component.onFreeResizeEnd(resized, { ...resizeEvent(600, 400), edges: { right: 0, bottom: 0 } });

        // then
        expect(stop).not.toHaveBeenCalled();
      });

      it('#onFreeResizeEnd should set snapped size and bring tile to front', () => {

        // given
        const [resized, other] = renderCanvasSummaries([[0, 0, 600, 400], [0, 410, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();
        component.onFreeResizing(resized, resizeEvent(697 * scale, 397 * scale));

        // when
        component.onFreeResizeEnd(resized, { ...resizeEvent(697 * scale, 397 * scale), edges: { right: 97, bottom: -3 } });

        // then
        expect([resized.width, resized.height]).toEqual([700, 400]);
        expect(resized.z).toBeGreaterThan(other.z);
        expect(component.resizePreview).toBeUndefined();
        expect(component.canvasGuides).toEqual([]);
      });

      it('#onFreeResizeEnd should keep size without resize', () => {

        // given
        const [resized] = renderCanvasSummaries([[0, 0, 447, 333]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizeEnd(resized, { ...resizeEvent(447 * scale, 333 * scale), edges: { right: 0, bottom: 0 } });

        // then
        expect([resized.width, resized.height]).toEqual([447, 333]);
        expect(component.resizePreview).toBeUndefined();
      });

      it('#onFreeResizeEnd by left edge should move left edge and keep right edge', () => {

        // given
        const [resized] = renderCanvasSummaries([[100, 0, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizeEnd(resized, resizeEvent(497 * scale, 400 * scale, 0, 0, { left: 103 * scale }));

        // then
        expect([resized.x, resized.y, resized.width, resized.height]).toEqual([200, 0, 500, 400]);
      });

      it('#onFreeResizeEnd by top edge should move top edge and keep bottom edge', () => {

        // given
        const [resized] = renderCanvasSummaries([[0, 100, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizeEnd(resized, resizeEvent(600 * scale, 303 * scale, 0, 0, { top: 97 * scale }));

        // then
        expect([resized.x, resized.y, resized.width, resized.height]).toEqual([0, 200, 600, 300]);
      });

      it('#onFreeResizing by top left corner should preview moved corner', () => {

        // given
        const [resized] = renderCanvasSummaries([[100, 100, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizing(resized, resizeEvent(650 * scale, 450 * scale, 0, 0, { left: -50 * scale, top: -50 * scale }));

        // then
        expect(component.resizePreview.left).toBeCloseTo(layerX(50) * scale, 5);
        expect(component.resizePreview.top).toBeCloseTo(layerY(50) * scale, 5);
        expect(component.resizePreview.width).toBeCloseTo(650 * scale, 5);
        expect(component.resizePreview.height).toBeCloseTo(450 * scale, 5);
      });

      it('#onFreeResizeEnd by top edge should keep model width despite rounded rectangle', () => {

        // given
        const [resized] = renderCanvasSummaries([[0, 100, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizeEnd(resized, resizeEvent(600 * scale + 0.4, 300 * scale, 0, 0, { top: 100 * scale }));

        // then
        expect([resized.y, resized.width, resized.height]).toEqual([200, 600, 300]);
      });

      it('#onFreeResizeEnd by left edge should keep right edge despite rounded rectangle', () => {

        // given
        const [resized] = renderCanvasSummaries([[100, 0, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();

        // when
        component.onFreeResizeEnd(resized, resizeEvent(500 * scale - 0.4, 400 * scale, 0, 0, { left: 100 * scale }));

        // then
        expect([resized.x, resized.x + resized.width]).toEqual([200, 700]);
      });

      it('#bringToFront should rank tile first and request persisting', () => {

        // given
        const [back, front] = renderCanvasSummaries([[0, 0, 600, 400], [100, 100, 600, 400]]);
        const persistSpy = requestPersistSpy();

        // when
        component.bringToFront(back);

        // then
        expect([back.z, front.z]).toEqual([2, 1]);
        expect(persistSpy).toHaveBeenCalled();
      });

      it('#sendToBack should rank tile last and request persisting', () => {

        // given
        const [back, front] = renderCanvasSummaries([[0, 0, 600, 400], [100, 100, 600, 400]]);
        const persistSpy = requestPersistSpy();

        // when
        component.sendToBack(front);

        // then
        expect([back.z, front.z]).toEqual([2, 1]);
        expect(persistSpy).toHaveBeenCalled();
      });

      describe('text box', () => {

        function cells(): HTMLElement {
          return component.gridCellsRef.nativeElement;
        }

        function gridScale(): number {
          return cells().clientWidth / PageFormat.LANDSCAPE.width;
        }

        function addTextBoxContext(x: number, y: number, anchor?: ElementContext, offset?: AnchorOffset): TextBoxContext {
          const context = new TextBoxContext(scene.columns);
          context.setPosition(x, y);
          context.z = 1;
          context.setAnchor(anchor, offset);
          component.elementContexts = component.elementContexts.concat([context]);
          fixture.detectChanges();
          return context;
        }

        function textBoxTile(): HTMLElement {
          return fixture.nativeElement.querySelector('.div_text_box_tile');
        }

        function gridTiles(): HTMLElement[] {
          return Array.from(fixture.nativeElement.querySelectorAll('.div_grid_cells > .div_tile'));
        }

        function pageUnitRectOf(element: HTMLElement): Rect {
          const rect = element.getBoundingClientRect();
          const cellsRect = cells().getBoundingClientRect();
          return component.freeLayout.rectFromRendered(rect.left - cellsRect.left, rect.top - cellsRect.top, rect.width, rect.height,
            gridScale());
        }

        function expectAnchoredAt(tile: HTMLElement, offset: AnchorOffset): void {
          const tileRect = tile.getBoundingClientRect();
          const boxRect = textBoxTile().getBoundingClientRect();
          expect(boxRect.left).toBeCloseTo(tileRect.left + offset.x * tileRect.width, 0);
          expect(boxRect.top).toBeCloseTo(tileRect.top + offset.y * tileRect.height, 0);
        }

        function expectAtFallback(context: TextBoxContext): void {
          const cellsRect = cells().getBoundingClientRect();
          const boxRect = textBoxTile().getBoundingClientRect();
          expect(boxRect.left - cellsRect.left).toBeCloseTo(context.x * gridScale(), 0);
          expect(boxRect.top - cellsRect.top).toBeCloseTo(context.y * gridScale(), 0);
        }

        function gridMoveTo(x: number, y: number): void {
          const cellsRect = cells().getBoundingClientRect();
          component.constrainFreeMove({ x: cellsRect.left + x * gridScale() + PICKUP.x, y: cellsRect.top + y * gridScale() + PICKUP.y },
            null, null, PICKUP);
        }

        function expectCloseTo(actual: number, expected: number): void {
          expect(Math.abs(actual - expected)).toBeLessThan(1);
        }

        it('should be absolutely positioned in grid above tiles without taking a grid cell', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const textBox = addTextBoxContext(100, 50);
          component.elementContexts = [textBox, ...component.elementContexts.slice(0, 2)];

          // when
          fixture.detectChanges();

          // then
          const tile = textBoxTile();
          expect(getComputedStyle(tile).position).toBe('absolute');
          expect(getComputedStyle(tile).zIndex).toBe(String(FreeLayout.OVERLAY_Z_OFFSET + 1));
          expect(tile.classList).not.toContain('div_anchored');
          expect(gridTiles()[0].getBoundingClientRect().left).toBeCloseTo(cells().getBoundingClientRect().left, 0);
          expect(gridTiles()[0].getBoundingClientRect().top).toBeCloseTo(cells().getBoundingClientRect().top, 0);
          expectAtFallback(textBox);
        });

        it('should not register drag of text box with drop list of grid', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);

          // when
          addTextBoxContext(100, 50);

          // then
          const dropList = fixture.debugElement.query(By.directive(CdkDropList)).injector.get(CdkDropList);
          const textBoxDrag = fixture.debugElement.query(By.css('.div_text_box_tile')).injector.get(CdkDrag);
          expect(dropList.getSortedItems().length).toBe(2);
          expect(dropList.getSortedItems()).not.toContain(textBoxDrag);
          expect(textBoxDrag.dropContainer).toBeNull();
        });

        it('should follow its anchor tile when tiles are reordered or grid columns changed', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1], [1, 1]]);
          const anchor = component.elementContexts[1];
          const offset = { x: 0.25, y: 0.5 };
          addTextBoxContext(0, 0, anchor, offset);
          expect(textBoxTile().classList).toContain('div_anchored');
          expectAnchoredAt(gridTiles()[1], offset);

          // when
          component.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<object>);
          fixture.detectChanges();

          // then
          expectAnchoredAt(gridTiles()[0], offset);

          // when
          component.setGridColumns(2);
          fixture.detectChanges();

          // then
          expectAnchoredAt(gridTiles()[0], offset);
        });

        it('should follow placeholder of its anchor tile while the tile is dragged', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1], [1, 1]]);
          const offset = { x: 0.5, y: 0.25 };
          addTextBoxContext(0, 0, component.elementContexts[1], offset);
          const tile = gridTiles()[1];
          const tileRect = tile.getBoundingClientRect();
          const pointer = { bubbles: true, button: 0, buttons: 1, detail: 1, clientX: tileRect.left + 20, clientY: tileRect.top + 20 };

          // when
          tile.dispatchEvent(new MouseEvent('mousedown', pointer));
          document.dispatchEvent(new MouseEvent('mousemove', { ...pointer, clientX: pointer.clientX + 40 }));
          fixture.detectChanges();

          // then
          const placeholder: HTMLElement = cells().querySelector('.div_tile.cdk-drag-placeholder');
          expect(placeholder).toBeTruthy();
          expect(cells().contains(tile)).toBe(false);
          expectAnchoredAt(placeholder, offset);
          document.dispatchEvent(new MouseEvent('mouseup', { ...pointer, clientX: pointer.clientX + 40 }));
        });

        it('should be placed at fallback position when its anchor is no tile of the grid', () => {

          // given
          renderGridSummaries(3, [[1, 1]]);

          // when
          const textBox = addTextBoxContext(200, 300, new SummaryContext([]), { x: 0.5, y: 0.5 });

          // then
          expect(textBoxTile().classList).toContain('div_anchored');
          expectAtFallback(textBox);
        });

        it('should hide frame and resize handles and let pointer pass unless revealed', () => {

          // when
          addTextBoxContext(0, 0);

          // then
          const tile = textBoxTile();
          expect(getComputedStyle(tile).pointerEvents).toBe('none');
          expect(getComputedStyle(tile, '::after').borderTopStyle).toBe('none');
          expect(getComputedStyle(tile).outlineStyle).toBe('none');
          expect(getComputedStyle(tile.querySelector('.div_resize_handle')).visibility).toBe('hidden');
        });

        it('should render squares only resize handles', () => {

          // when
          addTextBoxContext(0, 0);

          // then
          expect(textBoxTile().querySelector('koia-resize-handles').classList).toContain('koia-squares-only');
          expect(textBoxTile().querySelectorAll('.div_resize_handle').length).toBe(8);
        });

        it.each([
          {
            cause: 'text box is active',
            reveal: (): void => { fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance.active = true; }
          },
          { cause: 'it is resized', reveal: (): void => textBoxTile().classList.add('resize-active') },
          { cause: 'it is dragged', reveal: (): void => textBoxTile().classList.add('cdk-drag-dragging') }
        ])('should show frame and resize handles and catch pointer when $cause', ({ reveal }) => {

          // given
          addTextBoxContext(0, 0);

          // when
          reveal();
          fixture.detectChanges();

          // then
          expectRevealed(textBoxTile());
        });

        function expectRevealed(tile: HTMLElement): void {
          expect(getComputedStyle(tile).pointerEvents).toBe('auto');
          expect(getComputedStyle(tile).outlineStyle).toBe('dashed');
          expect(getComputedStyle(tile).outlineWidth).toBe('1px');
          expect(getComputedStyle(tile.querySelector('.div_resize_handle')).visibility).toBe('visible');
        }

        it('should show frame and catch pointer while text line is hovered', async () => {

          // given
          addTextBoxContext(0, 0);

          // when
          await userEvent.hover(textBoxTile().querySelector('.p_line'));

          // then
          expect(getComputedStyle(textBoxTile()).pointerEvents).toBe('auto');
          expect(getComputedStyle(textBoxTile()).outlineStyle).toBe('dashed');
          await userEvent.unhover(textBoxTile().querySelector('.p_line'));
        });

        it('resize handles should stay hidden while text box is only hovered', async () => {

          // given
          addTextBoxContext(0, 0);

          // when
          await userEvent.hover(textBoxTile().querySelector('.p_line'));

          // then
          expect(getComputedStyle(textBoxTile().querySelector('.div_resize_handle')).visibility).toBe('hidden');
          await userEvent.unhover(textBoxTile().querySelector('.p_line'));
        });

        it('should render guides in grid', () => {

          // given
          renderGridSummaries(3, [[1, 1]]);
          component.canvasGuides = [{ axis: 'x', position: 700 }, { axis: 'y', position: 400 }];

          // when
          fixture.detectChanges();

          // then
          const cellsRect = cells().getBoundingClientRect();
          const [vertical, horizontal] = rectsOf('.div_grid_cells > .div_canvas_guide');
          expect(vertical.left - cellsRect.left).toBeCloseTo(700 * gridScale(), 0);
          expect(horizontal.top - cellsRect.top).toBeCloseTo(400 * gridScale(), 0);
        });

        it('#onFreeResizing in grid should preview from drawn rect of anchored text box', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const textBox = addTextBoxContext(0, 0, component.elementContexts[1], { x: 0.5, y: 0.5 });
          component.drop({ previousIndex: 1, currentIndex: 0 } as CdkDragDrop<object>);
          fixture.detectChanges();
          const drawn = textBoxTile().getBoundingClientRect();
          const cellsRect = cells().getBoundingClientRect();
          component.onFreeResizeStart(textBox);

          // when
          component.onFreeResizing(textBox, resizeEvent(drawn.width, drawn.height));

          // then
          expectCloseTo(component.resizePreview.left, drawn.left - cellsRect.left);
          expectCloseTo(component.resizePreview.top, drawn.top - cellsRect.top);
          expect([textBox.x, textBox.y]).toEqual([pageUnitRectOf(textBoxTile()).x, pageUnitRectOf(textBoxTile()).y]);
        });

        it('#onFreeMoving in grid should show guides of rendered tiles', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const textBox = addTextBoxContext(0, 600);
          const tileRect = pageUnitRectOf(gridTiles()[1]);
          component.onFreeMoveStarted(textBox);
          gridMoveTo(tileRect.x + 2, 603);

          // when
          component.onFreeMoving(moveEventInMiddle());

          // then
          expect(component.canvasGuides.map(g => g.axis)).toEqual(['x']);
          expectCloseTo(component.canvasGuides[0].position, tileRect.x);
        });

        it('#onFreeMoveEnded in grid should anchor text box to tile below its top left corner', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1], [1, 1]]);
          const textBox = addTextBoxContext(0, 0, component.elementContexts[0], { x: 0, y: 0 });
          const tile = component.elementContexts[1];
          const tileRect = pageUnitRectOf(gridTiles()[1]);
          component.onFreeMoveStarted(textBox);
          gridMoveTo(tileRect.x + 0.3 * tileRect.width, 0.4 * tileRect.height);

          // when
          component.onFreeMoveEnded(textBox, dragEnd());

          // then
          expect(textBox.anchor).toBe(tile);
          expect(textBox.x).toBeGreaterThan(tileRect.x);
          expect(textBox.anchorOffset.x).toBeCloseTo((textBox.x - tileRect.x) / tileRect.width, 5);
          expect(textBox.anchorOffset.y).toBeCloseTo((textBox.y - tileRect.y) / tileRect.height, 5);
          expect(component.canvasGuides).toEqual([]);
        });

        it('#onFreeMoveEnded in grid should unanchor text box moved off tiles', () => {

          // given
          renderGridSummaries(3, [[1, 1]]);
          const textBox = addTextBoxContext(0, 0, component.elementContexts[0], { x: 0, y: 0 });
          component.onFreeMoveStarted(textBox);
          gridMoveTo(1000, 50);

          // when
          component.onFreeMoveEnded(textBox, dragEnd());

          // then
          expect([textBox.x, textBox.y]).toEqual([1000, 50]);
          expect(textBox.anchor).toBeUndefined();
        });

        it('#onFreeResizeEnd in grid should set size and keep anchor at drawn position', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const anchor = component.elementContexts[1];
          const textBox = addTextBoxContext(0, 0, anchor, { x: 0.5, y: 0.5 });
          component.onFreeResizeStart(textBox);
          const scale = gridScale();

          // when
          component.onFreeResizeEnd(textBox, { ...resizeEvent(200 * scale, 100 * scale), edges: { right: 1, bottom: 1 } });

          // then
          expect(Math.abs(textBox.width - 200)).toBeLessThanOrEqual(FreeLayout.STEP);
          expect(Math.abs(textBox.height - 100)).toBeLessThanOrEqual(FreeLayout.STEP);
          expect(textBox.anchor).toBe(anchor);
          expect(textBox.anchorOffset.x).toBeCloseTo(0.5, 1);
          expect(textBox.anchorOffset.y).toBeCloseTo(0.5, 1);
        });

        it('#onFreeResizeEnd by left edge in grid should re-anchor note', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const anchor = component.elementContexts[1];
          const textBox = addTextBoxContext(0, 0, anchor, { x: 0.5, y: 0.5 });
          component.onFreeResizeStart(textBox);
          const right = textBox.x + component.freeLayout.rectOf(textBox).width;
          const scale = gridScale();

          // when
          component.onFreeResizeEnd(textBox, resizeEvent(400 * scale, 150 * scale, 0, 0, { left: -100 * scale }));

          // then
          expect(textBox.x + textBox.width).toBe(right);
          expect(textBox.anchor).toBe(anchor);
          expect(textBox.anchorOffset.x).toBeLessThan(0.4);
          expect(textBox.anchorOffset.y).toBeCloseTo(0.5, 1);
        });

        it('#onFreeResizeEnd should limit text box to its minimum size', () => {

          // given
          const textBox = addTextBoxContext(0, 0);
          component.onFreeResizeStart(textBox);
          const scale = gridScale();

          // when
          component.onFreeResizeEnd(textBox, { ...resizeEvent(10 * scale, 10 * scale), edges: { right: -1, bottom: -1 } });

          // then
          expect([textBox.width, textBox.height]).toEqual([TextBoxContext.MIN_WIDTH, TextBoxContext.MIN_HEIGHT]);
        });

        it('#removeElement in grid should keep text box anchored to removed tile where it is drawn', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const removed = component.elementContexts[1];
          const textBox = addTextBoxContext(0, 0, removed, { x: 0.5, y: 0.5 });
          const drawn = pageUnitRectOf(textBoxTile());

          // when
          component.removeElement(removed);

          // then
          expect([textBox.x, textBox.y]).toEqual([drawn.x, drawn.y]);
          expect(textBox.anchor).toBeUndefined();
          expect(component.elementContexts).not.toContain(removed);
        });

        it('#removeElement in grid should not measure without text box anchored to removed tile', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          const kept = component.elementContexts[0];
          const textBox = addTextBoxContext(0, 0, kept, { x: 0.5, y: 0.5 });
          const measureSpy = vi.spyOn(cells(), 'getBoundingClientRect');

          // when
          component.removeElement(component.elementContexts[1]);

          // then
          expect(measureSpy).not.toHaveBeenCalled();
          expect([textBox.x, textBox.y, textBox.anchor]).toEqual([0, 0, kept]);
        });

        it('#removeElement in free layout should unanchor text box anchored to removed tile without moving it', () => {

          // given
          const [removed] = renderCanvasSummaries([[0, 0, 600, 400]]);
          const textBox = new TextBoxContext(scene.columns);
          textBox.setPosition(100, 100);
          textBox.setAnchor(removed, { x: 0.5, y: 0.5 });
          component.elementContexts = component.elementContexts.concat([textBox]);

          // when
          component.removeElement(removed);

          // then
          expect([textBox.x, textBox.y, textBox.anchor]).toEqual([100, 100, undefined]);
        });

        it('#setLayout to free canvas should keep offset of text box to its anchor tile', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          addTextBoxContext(0, 0, component.elementContexts[1], { x: 0.25, y: 0.5 });

          // when
          component.setLayout(Route.FLEX);

          // then
          const [, anchor, textBox] = component.elementContexts as [SummaryContext, SummaryContext, TextBoxContext];
          expect(textBox.x).toBe(Math.round(anchor.x + 0.25 * anchor.width));
          expect(textBox.y).toBe(Math.round(anchor.y + 0.5 * anchor.height));
          expect(textBox.z).toBe(3);
          expect(textBox.anchor).toBe(anchor);
        });

        it('#setLayout to free canvas should move text box into page of its anchor tile', () => {

          // given
          renderGridSummaries(1, [[1, 1]]);
          addTextBoxContext(0, 0, component.elementContexts[0], { x: 0.9, y: 0.95 });

          // when
          component.setLayout(Route.FLEX);

          // then
          const textBox = component.elementContexts[1];
          expect([textBox.x, textBox.y]).toEqual([PageFormat.LANDSCAPE.width - 300, PageFormat.LANDSCAPE.height - 150]);
        });

        it('#setLayout to free canvas should keep drawn rect of unanchored text box within its page', () => {

          // given
          renderGridSummaries(3, [[1, 1]]);
          addTextBoxContext(1000, 900);

          // when
          component.setLayout(Route.FLEX);

          // then
          const textBox = component.elementContexts[1];
          expect([textBox.x, textBox.y]).toEqual([1000, PageFormat.LANDSCAPE.height - 150]);
        });

        it('#setLayout to free canvas should keep drawn rect of text box anchored to unrendered tile', () => {

          // given
          renderGridSummaries(3, [[1, 1], [1, 1]]);
          addTextBoxContext(0, 0, component.elementContexts[1], { x: 0.5, y: 0.5 });
          const drawn = pageUnitRectOf(textBoxTile());
          vi.spyOn(gridTiles()[1], 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 0, 0));

          // when
          component.setLayout(Route.FLEX);

          // then
          const textBox = component.elementContexts[2];
          expect([textBox.x, textBox.y]).toEqual([drawn.x, drawn.y]);
        });

        it('#setLayout to grid should anchor text boxes to tile below their top left corner in sorted order', () => {

          // given
          const [right, left] = renderCanvasSummaries([[700, 0, 600, 400], [0, 0, 600, 400]]);
          [right.title, left.title] = ['right', 'left'];
          const onTile = new TextBoxContext(scene.columns);
          onTile.setPosition(750, 100);
          onTile.title = 'on tile';
          const offTile = new TextBoxContext(scene.columns);
          offTile.setPosition(100, 500);
          offTile.title = 'off tile';
          component.elementContexts = [right, onTile, left, offTile];

          // when
          component.setLayout(Route.GRID);

          // then
          const contexts = component.elementContexts;
          expect(contexts.map(c => c.title)).toEqual(['left', 'right', 'on tile', 'off tile']);
          const [, restoredRight, restoredOnTile, restoredOffTile] = contexts as TextBoxContext[];
          expect(restoredOnTile.anchor).toBe(restoredRight);
          expect(restoredOnTile.anchorOffset.x).toBeCloseTo(50 / 600, 5);
          expect(restoredOnTile.anchorOffset.y).toBeCloseTo(100 / 400, 5);
          expect([restoredOnTile.x, restoredOnTile.y]).toEqual([750, 100]);
          expect(restoredOffTile.anchor).toBeUndefined();
        });

        /**
         * @returns the position in page units of a note of default size centred in the visible part of the layer
         */
        function visiblyCenteredPositionIn(layer: HTMLElement): number[] {
          const content = component.divContentRef.nativeElement;
          const contentRect = content.getBoundingClientRect();
          const layerRect = layer.getBoundingClientRect();
          const grid = component.isGridLayout();
          const { width, sheetWidth } = component.freeLayout.pageFormat;
          const scale = layerRect.width / (grid ? width : sheetWidth);
          const x = (contentRect.left + content.clientLeft + content.clientWidth / 2 - layerRect.left) / scale;
          const y = (contentRect.top + content.clientTop + content.clientHeight / 2 - layerRect.top) / scale;
          const layout = grid ? { x, y } : {
            x: component.freeLayout.layoutXOf(x),
            y: component.freeLayout.layoutYOf(y, PageFormat.DESK_GUTTER_PX / scale)
          };
          return [Math.round(layout.x - TextBoxContext.TEXT_BOX_WIDTH / 2), Math.round(layout.y - TextBoxContext.TEXT_BOX_HEIGHT / 2)];
        }

        it('#addNote in grid should centre note in visible grid and anchor it to tile below', () => {

          // given
          renderGridSummaries(3, Array.from({ length: 9 }, () => [1, 1]));
          const content = component.divContentRef.nativeElement;
          const rowPitch = gridTiles()[3].getBoundingClientRect().top - gridTiles()[0].getBoundingClientRect().top;
          content.scrollTop = 1.5 * rowPitch;
          const expected = visiblyCenteredPositionIn(cells());

          // when
          const textBox = component.addNote();

          // then
          expect([textBox.x, textBox.y]).toEqual(expected);
          expect(textBox.anchor).toBeInstanceOf(SummaryContext);
          const anchorRect = pageUnitRectOf(gridTiles()[component.elementContexts.indexOf(textBox.anchor)]);
          expect(textBox.x).toBeGreaterThanOrEqual(anchorRect.x - 1);
          expect(textBox.x).toBeLessThan(anchorRect.x + anchorRect.width + 1);
          expect(textBox.y).toBeGreaterThanOrEqual(anchorRect.y - 1);
          expect(textBox.y).toBeLessThan(anchorRect.y + anchorRect.height + 1);
        });

        it('#addNote in empty grid should centre first note and cascade second one, both unanchored', () => {

          // given
          const [x, y] = visiblyCenteredPositionIn(cells());

          // when
          const first = component.addNote();
          const second = component.addNote();

          // then
          expect([[first.x, first.y], [second.x, second.y]]).toEqual([[x, y], [x + FreeLayout.OVERLAY_CASCADE, y + FreeLayout.OVERLAY_CASCADE]]);
          expect([first.z, second.z]).toEqual([1, 2]);
          expect([first.anchor, second.anchor]).toEqual([undefined, undefined]);
        });

        it('#addNote in free layout should centre note in visible canvas within its page', () => {

          // given
          renderCanvasSummaries([[0, 0, 600, 400]]);
          const expected = visiblyCenteredPositionIn(component.canvasPagesRef.nativeElement);

          // when
          const textBox = component.addNote();

          // then
          expect([textBox.x, textBox.y]).toEqual(expected);
          expect(textBox.y + textBox.height).toBeLessThanOrEqual(PageFormat.LANDSCAPE.height);
          expect(textBox.z).toBe(2);
        });

        it('#addNote on portrait pages should centre note in visible portrait sheet below its heading', () => {

          // given
          renderCanvasSummaries([[0, 0, 600, 400]], CanvasPaging.PORTRAIT);
          const expected = visiblyCenteredPositionIn(component.canvasPagesRef.nativeElement);

          // when
          const textBox = component.addNote();

          // then
          expect([textBox.x, textBox.y]).toEqual(expected);
          expect(textBox.x + textBox.width).toBeLessThanOrEqual(PageFormat.PORTRAIT.width);
        });

        it('#addNote should cascade note from top while grid has no width', () => {

          // given
          vi.spyOn(cells(), 'getBoundingClientRect').mockReturnValue(new DOMRect());

          // when
          const textBox = component.addNote();

          // then
          expect([textBox.x, textBox.y]).toEqual([0, 0]);
        });

        it('#addNote should place note below tiles while canvas is not rendered', () => {

          // given
          component.setLayout(Route.FLEX);

          // when
          const textBox = component.addNote();

          // then
          expect(component.canvasPagesRef).toBeUndefined();
          expect([textBox.x, textBox.y]).toEqual([0, 10]);
        });

        it('#shrinkNoteToText should size note to text extent in page units of layer', () => {

          // given
          const note = addTextBoxContext(0, 0);

          // when
          component.shrinkNoteToText(note, { width: 200, height: 50 });

          // then
          expect([note.width, note.height]).toEqual([Math.ceil(200 / gridScale()), Math.ceil(50 / gridScale())]);
        });

        it('#shrinkNoteToText should ignore text tile', () => {

          // given
          const textTile = addTextTileContext(1);

          // when
          component.shrinkNoteToText(textTile, { width: 100, height: 50 });

          // then
          expect([textTile.width, textTile.height]).toEqual([TextBoxContext.TEXT_BOX_WIDTH, TextBoxContext.TEXT_BOX_HEIGHT]);
        });

        it('#shrinkNoteToText should ignore note while layer is not rendered', () => {

          // given
          const note = addTextBoxContext(0, 0);
          component.gridCellsRef = undefined;

          // when
          component.shrinkNoteToText(note, { width: 100, height: 50 });

          // then
          expect([note.width, note.height]).toEqual([TextBoxContext.TEXT_BOX_WIDTH, TextBoxContext.TEXT_BOX_HEIGHT]);
        });

        it('should shrink note when its text box emits text edited', () => {

          // given
          const note = addTextBoxContext(0, 0);
          const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;

          // when
          textBox.textEdited.emit({ width: 200, height: 50 });

          // then
          expect(note.width).toBe(Math.ceil(200 / gridScale()));
        });

        it.each([
          { layout: 'grid note', add: (): void => { addTextBoxContext(0, 0); } },
          { layout: 'grid text tile', add: (): void => { addTextTileContext(1); } },
          {
            layout: 'canvas note',
            add: (): void => {
              renderCanvasSummaries([]);
              component.addNote();
              fixture.detectChanges();
            }
          }
        ])('should show move button of $layout only while its zone is hovered', async ({ add }) => {

          // given
          add();
          const zone: HTMLElement = textBoxTile().querySelector('.div_element > .div_move_zone');
          const button: HTMLElement = zone.querySelector('.but_text_box_move');
          expect(getComputedStyle(zone).pointerEvents).toBe('auto');
          expect(getComputedStyle(button).visibility).toBe('hidden');

          // when
          await userEvent.hover(zone);

          // then
          expect(getComputedStyle(button).visibility).toBe('visible');
          await userEvent.unhover(zone);
        });

        it('should start moving note when its move button is dragged', () => {

          // given
          addTextBoxContext(0, 0);
          const moveStartedSpy = vi.spyOn(component, 'onFreeMoveStarted');
          const buttonRect = textBoxTile().querySelector('.but_text_box_move').getBoundingClientRect();
          const pointer = { bubbles: true, button: 0, buttons: 1, detail: 1, clientX: buttonRect.left + 5, clientY: buttonRect.top + 5 };

          // when
          textBoxTile().querySelector('.but_text_box_move').dispatchEvent(new MouseEvent('mousedown', pointer));
          document.dispatchEvent(new MouseEvent('mousemove', { ...pointer, clientX: pointer.clientX + 20 }));
          fixture.detectChanges();

          // then
          expect(moveStartedSpy).toHaveBeenCalled();
          document.dispatchEvent(new MouseEvent('mouseup', { ...pointer, clientX: pointer.clientX + 20 }));
        });

        it('should start editing note when its move zone is clicked without dragging', () => {

          // given
          addTextBoxContext(0, 0);
          const textBox = fixture.debugElement.query(By.directive(TextBoxComponent)).componentInstance as TextBoxComponent;
          const zone = textBoxTile().querySelector('.div_move_zone');

          // when
          zone.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }));
          zone.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 100, clientY: 100 }));

          // then
          expect(textBox.startEditing).toHaveBeenCalled();
        });

        it.each(['top_right', 'bottom_right'])('should keep %s resize handle above move zone of small note', name => {

          // given
          const note = addTextBoxContext(0, 0);
          note.setSize(300, TextBoxContext.MIN_HEIGHT);
          textBoxTile().classList.add('resize-active');
          fixture.detectChanges();

          // when
          const handleRect = textBoxTile().querySelector('.div_resize_handle_' + name).getBoundingClientRect();
          const hit = document.elementFromPoint(handleRect.left + handleRect.width / 2, handleRect.top + handleRect.height / 2);

          // then
          expect(hit.classList).toContain('div_resize_handle');
        });

        it('press on a text box tile should clear selection of other tile', () => {

          // given
          renderGridSummaries(3, [[1, 1]]);
          addTextBoxContext(500, 0);
          component.tileSelection.select(component.elementContexts[0]);

          // when
          textBoxTile().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

          // then
          expect(component.tileSelection.isSelected(component.elementContexts[0])).toBe(false);
        });

        it('click on a text box tile should not select it', () => {

          // given
          const textBox = addTextBoxContext(0, 0);

          // when
          textBoxTile().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
          textBoxTile().dispatchEvent(new MouseEvent('click', { bubbles: true }));

          // then
          expect(component.tileSelection.isSelected(textBox)).toBe(false);
        });

        it('#applyView of grid view while grid is not rendered should place text box at grid top', () => {

          // given
          component.setLayout(Route.FLEX);
          fixture.detectChanges();
          const textBox = new TextBoxContext(scene.columns);
          textBox.title = 'Notes';

          // when
          component.applyView(viewOf(Route.GRID, [textBox]));

          // then
          expect([component.elementContexts[0].x, component.elementContexts[0].y]).toEqual([0, 0]);
        });

        function addTextTileContext(rowSpan: number, fitHeight?: number): TextBoxContext {
          const context = new TextBoxContext(scene.columns, true);
          context.gridRowSpan = rowSpan;
          context.fitHeight = fitHeight;
          component.elementContexts = component.elementContexts.concat([context]);
          fixture.detectChanges();
          return context;
        }

        function textTile(): HTMLElement {
          return fixture.nativeElement.querySelector('.div_text_tile');
        }

        /**
         * @returns the height in page units needing the given number of rows plus a little more
         */
        function fitHeightBeyondRows(rows: number): number {
          return Math.ceil((component.gridLayout.tileSizeOf({ columnSpan: 1, rowSpan: rows }, contentWidth()).height + 5) / gridScale());
        }

        it('should anchor note added onto text tile below visible centre', () => {

          // given
          component.elementContexts = [];
          const tile = addTextTileContext(3);
          tile.gridColumnSpan = component.gridLayout.gridColumns;
          fixture.detectChanges();

          // when
          const note = component.addNote();

          // then
          expect(note.anchor).toBe(tile);
        });

        it('grid text tile should grow by rows needed by its fit height', () => {

          // given
          renderGridSummaries(1, [[1, 1], [1, 1]], '2:1');
          const fitHeight = fitHeightBeyondRows(2);

          // when
          addTextTileContext(1, fitHeight);

          // then
          expect(getComputedStyle(textTile()).gridRowEnd).toBe('span 3');
          expect(textTile().getBoundingClientRect().height).toBeGreaterThan(fitHeight * gridScale());
        });

        it('grid text tile should keep its row span when larger than needed by its fit height', () => {

          // given
          renderGridSummaries(1, [[1, 1], [1, 1]], '2:1');

          // when
          addTextTileContext(3, fitHeightBeyondRows(1));

          // then
          expect(getComputedStyle(textTile()).gridRowEnd).toBe('span 3');
        });

        it('#onGridResizing should preview grown rows of text tile', () => {

          // given
          renderGridSummaries(1, [[1, 1], [1, 1]], '2:1');
          const context = addTextTileContext(1, fitHeightBeyondRows(2));
          const drawn = textTile().getBoundingClientRect();
          component.onGridResizeStart();

          // when
          component.onGridResizing(context, resizeEvent(drawn.width, drawn.height + 1));

          // then
          expectCloseTo(component.resizePreview.height, drawn.height);
        });

        it.each([
          { case: 'by a pixel', extraRows: 0, rowSpan: 1 },
          { case: 'by a row', extraRows: 1, rowSpan: 2 }
        ])('#onGridResizeEnd should store row span without grown rows when drawn text tile is enlarged $case', ({ extraRows, rowSpan }) => {

          // given
          renderGridSummaries(1, [[1, 1], [1, 1]], '2:1');
          const context = addTextTileContext(1, fitHeightBeyondRows(2));
          const rowPitch = gridTiles()[1].getBoundingClientRect().top - gridTiles()[0].getBoundingClientRect().top;
          const drawn = textTile().getBoundingClientRect();
          component.onGridResizeStart();

          // when
          component.onGridResizeEnd(context, resizeEvent(drawn.width, drawn.height + 1 + extraRows * rowPitch));

          // then
          expect(context.gridRowSpan).toBe(rowSpan);
        });

        it('#setLayout to free canvas should keep own height of grown note', () => {

          // given
          renderGridSummaries(3, [[1, 1]]);
          const note = addTextBoxContext(0, 0);
          note.fitHeight = 400;
          fixture.detectChanges();

          // when
          component.setLayout(Route.FLEX);

          // then
          expect(component.elementContexts[1].height).toBe(TextBoxContext.TEXT_BOX_HEIGHT);
        });

        it('#setLayout to free canvas should keep height of own rows of grown text tile', () => {

          // given
          renderGridSummaries(1, [[1, 1]], '2:1');
          addTextTileContext(1, fitHeightBeyondRows(2));

          // when
          component.setLayout(Route.FLEX);

          // then
          const [summary, tile] = component.elementContexts;
          expect(Math.abs(tile.height - summary.height)).toBeLessThanOrEqual(1);
        });

        it('#setLayout to free canvas should limit height of grown text tile to page below top padding', () => {

          // given
          renderGridSummaries(1, [[1, 1]], '1:2');
          addTextTileContext(4, fitHeightBeyondRows(4));

          // when
          component.setLayout(Route.FLEX);

          // then
          expect(component.elementContexts[1].height).toBe(PageFormat.LANDSCAPE.height - PageFormat.TOP_PADDING);
        });

        it('#setLayout to free canvas should keep offset of note to drawn rect of grown text tile', () => {

          // given
          renderGridSummaries(4, [[1, 1]], '2:1');
          const tile = addTextTileContext(1, fitHeightBeyondRows(2));
          addTextBoxContext(0, 0, tile, { x: 0.5, y: 0.5 });
          const drawn = pageUnitRectOf(textTile());

          // when
          component.setLayout(Route.FLEX);

          // then
          const [, restoredTile, note] = component.elementContexts;
          expect(note.y).toBe(Math.round(restoredTile.y + 0.5 * drawn.height));
        });
      });

      describe('grown note in free layout', () => {

        function addNoteContext(x: number, y: number, fitHeight: number): TextBoxContext {
          const note = new TextBoxContext(scene.columns);
          note.setPosition(x, y);
          note.z = 10;
          note.fitHeight = fitHeight;
          component.elementContexts = component.elementContexts.concat([note]);
          fixture.detectChanges();
          return note;
        }

        it('should be drawn at its fit height', () => {

          // given
          renderCanvasSummaries([]);

          // when
          addNoteContext(100, 100, 400);

          // then
          const tile: HTMLElement = fixture.nativeElement.querySelector('.div_text_box_tile');
          expect(tile.getBoundingClientRect().height).toBeCloseTo(400 * canvasScale(), 0);
        });

        it('#onFreeResizing should preview grown height', () => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, 400);
          component.onFreeResizeStart(note);
          const scale = canvasScale();

          // when
          component.onFreeResizing(note, resizeEvent(300 * scale, 401 * scale));

          // then
          expect(Math.abs(component.resizePreview.height - 400 * scale)).toBeLessThan(1);
        });

        it('#onFreeResizeEnd should store own height when drawn note is enlarged by a pixel', () => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, 400);
          component.onFreeResizeStart(note);
          const scale = canvasScale();

          // when
          component.onFreeResizeEnd(note, { ...resizeEvent(300 * scale, 400 * scale + 1), edges: { right: 0, bottom: 1 } });

          // then
          expect(note.height).toBe(TextBoxContext.TEXT_BOX_HEIGHT);
        });

        it('#onFreeResizeEnd by top edge of grown note should shrink own height and keep text height', () => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, 400);
          component.onFreeResizeStart(note);
          const scale = canvasScale();

          // when
          component.onFreeResizeEnd(note, resizeEvent(300 * scale, 380 * scale, 0, 0, { top: 20 * scale }));

          // then
          expect([note.y, note.height]).toEqual([120, TextBoxContext.TEXT_BOX_HEIGHT - 20]);
          expect(component.freeLayout.drawnRectOf(note).height).toBe(400);
        });

        it('#onFreeResizeEnd by right edge of a note fitting its text should keep it ungrown', () => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, TextBoxContext.TEXT_BOX_HEIGHT);
          component.onFreeResizeStart(note);
          const scale = canvasScale();

          // when
          component.onFreeResizeEnd(note, resizeEvent(350 * scale, TextBoxContext.TEXT_BOX_HEIGHT * scale - 0.4, 0, 0, { right: 50 * scale }));

          // then
          expect([note.width, note.height]).toEqual([350, TextBoxContext.TEXT_BOX_HEIGHT]);
          expect(component.freeLayout.drawnRectOf(note).height).toBe(TextBoxContext.TEXT_BOX_HEIGHT);
        });

        it.each([
          { case: 'grown', fitHeight: 400, axes: ['x'] },
          { case: 'not grown', fitHeight: undefined, axes: ['x', 'y'] }
        ])('#onFreeResizing should show guides of axes $axes when note is $case', ({ fitHeight, axes }) => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, fitHeight);
          component.onFreeResizeStart(note);
          const guides: Guide[] = [{ axis: 'x', position: 400 }, { axis: 'y', position: 250 }];
          vi.spyOn(SnapGuides.prototype, 'snapResize').mockReturnValue({ rect: component.freeLayout.rectOf(note), guides });

          // when
          component.onFreeResizing(note, resizeEvent(300, 150));

          // then
          expect(component.canvasGuides.map(g => g.axis)).toEqual(axes);
        });

        it.each([
          { case: 'grown', fitHeight: 400, axes: ['x'] },
          { case: 'not grown', fitHeight: undefined, axes: ['x', 'y'] }
        ])('#onFreeMoving should show guides of axes $axes when note is $case', ({ fitHeight, axes }) => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, fitHeight);
          component.onFreeMoveStarted(note);
          const guides: Guide[] = [{ axis: 'x', position: 400 }, { axis: 'y', position: 250 }];
          vi.spyOn(SnapGuides.prototype, 'snapMove').mockReturnValue({ rect: component.freeLayout.rectOf(note), guides });
          constrainMoveTo(100, 100);

          // when
          component.onFreeMoving(moveEventInMiddle());

          // then
          expect(component.canvasGuides.map(g => g.axis)).toEqual(axes);
        });

        it('#constrainFreeMove should keep note taller than a page on its page', () => {

          // given
          renderCanvasSummaries([]);
          const note = addNoteContext(100, 100, 1200);
          component.onFreeMoveStarted(note);
          constrainMoveTo(100, 120);

          // when
          component.onFreeMoveEnded(note, dragEnd());

          // then
          expect(note.y).toBeGreaterThanOrEqual(0);
          expect(component.freeLayout.pageOf(note)).toBe(0);
        });

        it('should show guide at drawn bottom of grown note when moving a tile', () => {

          // given
          const [summary] = renderCanvasSummaries([[0, 600, 600, 200]]);
          addNoteContext(700, 0, 300);
          component.onFreeMoveStarted(summary);
          constrainMoveTo(0, 102);

          // when
          component.onFreeMoving(moveEventInMiddle());

          // then
          expect(component.canvasGuides).toContainEqual({ axis: 'y', position: layerY(300) });
        });

        it('#setLayout to grid should anchor note on grown part of text tile', () => {

          // given
          renderCanvasSummaries([]);
          const tile = new TextBoxContext(scene.columns, true);
          tile.setPosition(0, 0);
          tile.setSize(600, 200);
          tile.fitHeight = 400;
          component.elementContexts = [tile];
          const note = addNoteContext(100, 300, undefined);

          // when
          component.setLayout(Route.GRID);

          // then
          const [restoredTile, restoredNote] = component.elementContexts as TextBoxContext[];
          expect(restoredNote.anchor).toBe(restoredTile);
          expect(note.anchor).toBeUndefined();
        });
      });
    });

    it('#applyView should place tiles of legacy flex view in rows on free canvas', () => {

      // given
      component.addSummaryTable();
      component.addSummaryTable();
      const view = viewOf(Route.FLEX, component.elementContexts);

      // when
      component.applyView(view);

      // then
      expect(component.elementContexts.map(c => [c.x, c.y])).toEqual([[0, 0], [610, 0]]);
      expect(component.freeLayout.pageFormat).toBe(PageFormat.UNPAGED);
    });

    it('#applyView should size legacy flex tiles without size by default', () => {

      // given
      component.addSummaryTable();
      const view = viewOf(Route.FLEX, component.elementContexts);
      view.elements[0].width = null;
      view.elements[0].height = null;

      // when
      component.applyView(view);

      // then
      expect([component.elementContexts[0].width, component.elementContexts[0].height]).toEqual([600, 400]);
    });

    it('#addChart should place new tile below canvas tiles', () => {

      // given
      component.setLayout(Route.FLEX);
      component.addChart();

      // when
      const context = component.addChart();

      // then
      expect([context.x, context.y]).toEqual([0, 420]);
    });

    it('#addChart should not place new tile in grid layout', () => {

      // when
      const context = component.addChart();

      // then
      expect(context.x).toBeUndefined();
    });

    it('#setLayout should keep element contexts when layout is unchanged', () => {

      // given
      component.addGraph();
      const contexts = component.elementContexts;

      // when
      component.setLayout(Route.GRID);

      // then
      expect(component.elementContexts).toBe(contexts);
    });

    function snapToGridButton(): HTMLButtonElement {
      return fixture.nativeElement.querySelector('#but_snap_to_grid');
    }

    it('snap to grid button should be active in grid layout', () => {
      expect(snapToGridButton().classList).toContain('koia-toggle-active');
    });

    it('snap to grid button should show snap grid icon', () => {
      expect(snapToGridButton().querySelector('mat-icon').getAttribute('svgicon')).toBe('snap_grid');
    });

    const LAYOUT_BUTTON_IDS = ['but_snap_to_grid', 'but_free_canvas', 'but_landscape_pages', 'but_portrait_pages'];

    function layoutButton(id: string): HTMLButtonElement {
      return fixture.nativeElement.querySelector('#' + id);
    }

    function activeLayoutButtons(): string[] {
      return LAYOUT_BUTTON_IDS.filter(id => layoutButton(id).classList.contains('koia-toggle-active'));
    }

    it('layout buttons should follow separator and precede print button and separator in front of add buttons', () => {

      // when
      const [grid, canvas, landscape, portrait] = LAYOUT_BUTTON_IDS.map(layoutButton);

      // then
      expect(grid.previousElementSibling.classList).toContain('koia-toolbar-separator');
      expect(canvas.previousElementSibling).toBe(grid);
      const toggles = canvas.nextElementSibling;
      expect(toggles.tagName).toBe('KOIA-PAGING-TOGGLES');
      expect(Array.from(toggles.children)).toEqual([landscape, portrait, toggles.querySelector('koia-print-button'),
        toggles.querySelector('.koia-toolbar-separator')]);
      expect(toggles.querySelector('koia-print-button #but_print')).not.toBeNull();
      expect(toggles.querySelector('#but_monitor_view')).toBeNull();
      expect(toggles.nextElementSibling.querySelector('mat-icon[svgicon="add_chart"]')).toBeTruthy();
    });

    it('layout buttons should lead canvas toolbar without separator', () => {

      // given
      component.showCanvas(CanvasPaging.NONE);

      // when
      fixture.detectChanges();

      // then
      expect(layoutButton('but_snap_to_grid').previousElementSibling).toBeNull();
    });

    it('canvas buttons should show free canvas, landscape and portrait icons', () => {

      // when
      const icons = LAYOUT_BUTTON_IDS.slice(1).map(id => layoutButton(id).querySelector('mat-icon'));

      // then
      expect(icons[0].getAttribute('svgicon')).toBe('flex_view');
      expect(icons.slice(1).map(icon => icon.textContent)).toEqual(['crop_landscape', 'crop_portrait']);
    });

    it.each([
      { id: 'but_free_canvas', paging: CanvasPaging.NONE },
      { id: 'but_landscape_pages', paging: CanvasPaging.LANDSCAPE },
      { id: 'but_portrait_pages', paging: CanvasPaging.PORTRAIT }
    ])('$id should switch to canvas and be the only active layout button', ({ id, paging }) => {

      // when
      layoutButton(id).click();
      fixture.detectChanges();

      // then
      expect(component.isGridLayout()).toBe(false);
      expect(component.freeLayout.pageFormat).toBe(PageFormat.of(paging));
      expect(activeLayoutButtons()).toEqual([id]);
    });

    it('snap to grid button should be the only active layout button in grid layout', () => {

      // when
      const active = activeLayoutButtons();

      // then
      expect(active).toEqual(['but_snap_to_grid']);
    });

    it('snap to grid button should keep grid layout without persisting when clicked again', () => {

      // given
      const contexts = component.elementContexts;
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      snapToGridButton().click();

      // then
      expect(component.isGridLayout()).toBe(true);
      expect(component.elementContexts).toBe(contexts);
      expect(viewTabsService.requestPersist).not.toHaveBeenCalled();
    });

    it('snap to grid button should switch back to grid layout', () => {

      // given
      component.showCanvas(CanvasPaging.PORTRAIT);
      fixture.detectChanges();

      // when
      snapToGridButton().click();
      fixture.detectChanges();

      // then
      expect(component.isGridLayout()).toBe(true);
      expect(component.freeLayout.pageFormat).toBe(PageFormat.LANDSCAPE);
      expect(activeLayoutButtons()).toEqual(['but_snap_to_grid']);
    });

    it('more menu should offer grid settings but no layout menu', fakeAsync(() => {

      // when
      fixture.debugElement.query(By.css('.but_view_more')).nativeElement.click();
      fixture.detectChanges();
      flush();

      // then
      expect(document.querySelector('#menuItemGridColumns')).toBeTruthy();
      expect(document.querySelector('#menuItemLayout')).toBeNull();
    }));

    describe('tile selection', () => {

      function summaryTile(): HTMLElement {
        return fixture.nativeElement.querySelector('.div_tile');
      }

      function handlesOf(tile: HTMLElement): HTMLElement[] {
        return Array.from(tile.querySelectorAll('.div_resize_handle'));
      }

      function clickTile(target: Element, dx = 0): void {
        const rect = target.getBoundingClientRect();
        const point = { bubbles: true, clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 };
        target.dispatchEvent(new PointerEvent('pointerdown', point));
        target.dispatchEvent(new MouseEvent('click', { ...point, clientX: point.clientX + dx }));
        fixture.detectChanges();
      }

      function addSelectedSummary(layout = Route.GRID): SummaryContext {
        component.addSummaryTable();
        component.setLayout(layout);
        fixture.detectChanges();
        clickTile(summaryTile().querySelector('.div_element'));
        return component.elementContexts[0] as SummaryContext;
      }

      it('should render no resize handles on unselected tile', () => {

        // given
        component.addSummaryTable();

        // when
        fixture.detectChanges();

        // then
        expect(handlesOf(summaryTile())).toEqual([]);
        expect(summaryTile().classList).not.toContain('div_tile_selected');
      });

      it.each([Route.GRID, Route.FLEX])('click without drag on empty tile area should select tile in %s layout', layout => {

        // given
        component.addSummaryTable();
        component.setLayout(layout);
        fixture.detectChanges();

        // when
        clickTile(summaryTile().querySelector('.div_element'));

        // then
        expect(component.tileSelection.isSelected(component.elementContexts[0])).toBe(true);
        expect(handlesOf(summaryTile()).length).toBe(8);
        expect(summaryTile().querySelector('koia-resize-handles').classList).not.toContain('koia-squares-only');
      });

      it('selected tile should be outlined and raised below notes', () => {

        // given
        addSelectedSummary(Route.FLEX);
        component.addNote();
        fixture.detectChanges();

        // when
        const style = getComputedStyle(summaryTile());

        // then
        expect(style.outlineStyle).toBe('solid');
        expect(style.zIndex).toBe('9999');
        const noteZ = Number(getComputedStyle(fixture.nativeElement.querySelector('.div_text_box_tile')).zIndex);
        expect(noteZ).toBeGreaterThan(9999);
      });

      it('click on control of selected tile should clear selection', () => {

        // given
        const context = addSelectedSummary();
        const button = document.createElement('button');
        summaryTile().querySelector('.div_element').appendChild(button);

        // when
        clickTile(button);

        // then
        expect(component.tileSelection.isSelected(context)).toBe(false);
        expect(handlesOf(summaryTile())).toEqual([]);
      });

      it('claimed click on selected tile should clear selection', () => {

        // given
        const context = addSelectedSummary();
        const element = summaryTile().querySelector('.div_element');
        element.addEventListener('click', event => claimClick(event));

        // when
        clickTile(element);

        // then
        expect(component.tileSelection.isSelected(context)).toBe(false);
      });

      it('click on resize handle should keep selection', () => {

        // given
        const context = addSelectedSummary();

        // when
        clickTile(summaryTile().querySelector('.div_resize_handle_bottom_right'));

        // then
        expect(component.tileSelection.isSelected(context)).toBe(true);
      });

      it('click after drag should keep previous selection', () => {

        // given
        const context = addSelectedSummary();
        const button = document.createElement('button');
        summaryTile().querySelector('.div_element').appendChild(button);

        // when
        clickTile(button, 10);

        // then
        expect(component.tileSelection.isSelected(context)).toBe(true);
      });

      it('press outside of selected tile should clear selection and render it', () => {

        // given
        const context = addSelectedSummary();

        // when
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

        // then
        expect(component.tileSelection.isSelected(context)).toBe(false);
        expect(handlesOf(summaryTile())).toEqual([]);
      });

      it('press on selected tile should keep selection', () => {

        // given
        const context = addSelectedSummary();

        // when
        summaryTile().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

        // then
        expect(component.tileSelection.isSelected(context)).toBe(true);
      });

      it('escape should clear selection and render it', () => {

        // given
        const context = addSelectedSummary();

        // when
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        // then
        expect(component.tileSelection.isSelected(context)).toBe(false);
        expect(handlesOf(summaryTile())).toEqual([]);
      });

      it('other key should keep selection', () => {

        // given
        const context = addSelectedSummary();

        // when
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

        // then
        expect(component.tileSelection.isSelected(context)).toBe(true);
      });

      it('press outside without selection should not render', () => {

        // given
        component.addSummaryTable();
        fixture.detectChanges();
        const detectChanges = vi.spyOn(component['cdr'], 'detectChanges');

        // when
        document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));

        // then
        expect(detectChanges).not.toHaveBeenCalled();
      });

      it('destroyed dashboard should stop listening to document', () => {

        // given
        addSelectedSummary();
        const clear = vi.spyOn(component.tileSelection, 'clear');
        fixture.destroy();

        // when
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

        // then
        expect(clear).not.toHaveBeenCalled();
      });

      it('selected chart tile showing margin should hide resize handles', () => {

        // given
        const chartContext = component.addChart();
        fixture.detectChanges();
        component.tileSelection.select(chartContext);

        // when
        chartContext.toggleShowResizableMargin();
        fixture.detectChanges();

        // then
        expect(handlesOf(summaryTile())).toEqual([]);
      });

      it.each([
        { layout: Route.GRID, type: 'mousedown' },
        { layout: Route.GRID, type: 'touchstart' },
        { layout: Route.FLEX, type: 'mousedown' },
        { layout: Route.FLEX, type: 'touchstart' }
      ])('resize handle should not propagate $type to tile in $layout layout', ({ layout, type }) => {

        // given
        addSelectedSummary(layout);
        const tileListener = vi.fn();
        summaryTile().addEventListener(type, tileListener);

        // when
        summaryTile().querySelector('.div_resize_handle_bottom_right').dispatchEvent(new Event(type, { bubbles: true }));

        // then
        expect(tileListener).not.toHaveBeenCalled();
      });
    });

    it('#applyView should load grid view', () => {

      // given
      const chartContext = component.addChart();
      chartContext.title = 'Test Chart';
      chartContext.dataColumns = [findColumn('Amount', chartContext)];
      chartContext.splitColumns = [findColumn('Path', chartContext)];
      const graphContext = component.addGraph();
      graphContext.title = 'Test Graph';
      const timeColumn = findColumn('Time', graphContext);
      timeColumn.groupingTimeUnit = TimeUnit.HOUR;
      graphContext.groupByColumns = [timeColumn, findColumn('Level', graphContext)];
      const view = viewOf(Route.GRID, component.elementContexts);
      const elementContexts = component.elementContexts;
      component.gridLayout.gridColumns = 5;
      component.elementContexts = [];

      // when
      component.applyView(view);

      // then
      expect(component.isGridLayout()).toBe(true);
      expect(component.gridLayout.gridColumns).toBe(4);
      expect(component.gridLayout.gridCellRatio).toBe('4:3');
      expect(elementsOf(component.elementContexts)).toEqual(elementsOf(elementContexts));
    });

    it('#applyView should switch to flex layout and keep grid settings of legacy flex view', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      const view = viewOf(Route.FLEX, component.elementContexts, null, null);
      component.gridLayout.gridColumns = 2;
      component.gridLayout.gridCellRatio = '2:1';

      // when
      component.applyView(view);

      // then
      expect(component.isGridLayout()).toBe(false);
      expect(component.gridLayout.gridColumns).toBe(2);
      expect(component.gridLayout.gridCellRatio).toBe('2:1');
    });

    it('#applyView should restore summary context column hierarchy', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      summaryContext.groupByColumns = [findColumn('Path', summaryContext), findColumn('Time', summaryContext), findColumn('Amount', summaryContext)];
      const view = viewOf(Route.FLEX, component.elementContexts);
      component.elementContexts = [];

      // when
      component.applyView(view);

      // then
      expect(component.elementContexts.length).toBe(1);
      expect(component.elementContexts[0].groupByColumns.map(c => c.name)).toEqual(['Path', 'Time', 'Amount']);
    });

    it('#applyView should restore and fetch query of view', () => {

      // given
      const query = new Query();
      query.setFullTextFilter('abc');
      const view = new ModelToViewConverter().convert(Route.GRID, 'test', query, []);

      // when
      component.applyView(view);

      // then
      expect(component.restoredQuery.getFullTextFilter()).toBe('abc');
      expect(dbService.findEntriesWithComputedValues).toHaveBeenLastCalledWith(component.restoredQuery, true);
    });

    it('#applyView should not modify loaded view when elements are changed', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      const view = viewOf(Route.GRID, component.elementContexts);
      const viewJson = JSON.stringify(view);
      component.applyView(view);

      // when
      component.elementContexts[0].title = 'changed';
      component.elementContexts[0].gridColumnSpan = 3;

      // then
      expect(JSON.stringify(view)).toBe(viewJson);
    });

    function printButton(): HTMLButtonElement {
      return fixture.debugElement.query(By.css('#but_print')).nativeElement;
    }

    it('#click on print button should print window on pages', () => {

      // given
      component.showCanvas(CanvasPaging.LANDSCAPE);
      component.addGraph();
      fixture.detectChanges();
      vi.spyOn(window, 'print').mockReturnValue(undefined);

      // when
      printButton().click();

      // then
      expect(window.print).toHaveBeenCalled();
    });

    it.each([
      { layout: 'grid', show: (): void => component.snapToGrid() },
      { layout: 'free canvas', show: (): void => component.showCanvas(CanvasPaging.NONE) }
    ])('print button should be disabled in $layout', ({ show }) => {

      // given
      show();
      component.addGraph();

      // when
      fixture.detectChanges();

      // then
      expect(printButton().disabled).toBe(true);
    });

    it.each([CanvasPaging.LANDSCAPE, CanvasPaging.PORTRAIT])('print button should be enabled on %s pages', paging => {

      // given
      component.showCanvas(paging);
      component.addGraph();

      // when
      fixture.detectChanges();

      // then
      expect(printButton().disabled).toBe(false);
    });

    it('print button should be disabled on pages without elements', () => {

      // given
      component.showCanvas(CanvasPaging.LANDSCAPE);
      component.elementContexts = [];

      // when
      fixture.detectChanges();

      // then
      expect(printButton().disabled).toBe(true);
    });

    it('more button should be hidden when grid layout is not shown', () => {

      // given
      component.setLayout(Route.FLEX);

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('.but_view_more'))).toBeNull();
    });

    it('#saveAs should export image', () => {

      // given
      const chartContext = component.addChart();
      chartContext.title = 'Test';
      chartContext.chart = { toBase64Image: () => 'base64Image...' } as Chart;
      vi.spyOn(exportService, 'exportImage').mockReturnValue(undefined);

      // when
      component.saveAs(chartContext, ExportFormat.PNG);

      // then
      expect(exportService.exportImage).toHaveBeenCalledWith('base64Image...', ExportFormat.PNG, 'Test');
    });

    it('#saveAs should export data when summary context is provided', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.title = 'Test';
      const exportData = [{ Level: 'INFO', Count: 3 }];
      const summaryTableComponent = { context: summaryContext, createExportData: () => exportData };
      component.sumTableComponents.reset([summaryTableComponent as unknown as RealSummaryTableComponent]);
      vi.spyOn(exportService, 'exportData').mockReturnValue(undefined);

      // when
      component.saveAs(summaryContext, ExportFormat.EXCEL);

      // then
      const indexedColumns = scene.columns
        .filter(c => c.indexed)
        .map(c => c.dataType === DataType.TIME ? { ...c, groupingTimeUnit: TimeUnit.MILLISECOND } : c);
      expect(exportService.exportData).toHaveBeenCalledWith(exportData, indexedColumns, ExportFormat.EXCEL, 'Test');
      expect(vi.mocked(exportService.exportData).mock.lastCall[1][0]).not.toBe(scene.columns[0]);
    });

    it('#saveAs should not export when graph context is provided', () => {

      // given
      const graphContext = component.addGraph();
      vi.spyOn(exportService, 'exportImage').mockReturnValue(undefined);
      vi.spyOn(exportService, 'exportData').mockReturnValue(undefined);

      // when
      component.saveAs(graphContext, ExportFormat.PNG);

      // then
      expect(exportService.exportImage).not.toHaveBeenCalled();
      expect(exportService.exportData).not.toHaveBeenCalled();
    });

    it('#generateDashboard should replace empty dashboard with generated elements without confirmation', fakeAsync(() => {

      // given
      const result = generatedDashboard();
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(result);
      vi.spyOn(dialogService, 'showConfirmDialog');

      // when
      component.generateDashboard();
      flush();

      // then
      expect(dialogService.showConfirmDialog).not.toHaveBeenCalled();
      expectElementContexts(result.elementContexts);
    }));

    it('#generateDashboard should lay out generated grid in landscape page units', fakeAsync(() => {

      // given
      component.showCanvas(CanvasPaging.PORTRAIT);
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());

      // when
      component.generateDashboard();
      flush();

      // then
      expect(component.isGridLayout()).toBe(true);
      expect(component.freeLayout.pageFormat).toBe(PageFormat.LANDSCAPE);
    }));

    it('#generateDashboard should apply grid of generated dashboard', fakeAsync(() => {

      // given
      component.gridLayout.gridColumns = 5;
      component.addSummaryTable().gridColumnSpan = 5;
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard(3));
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flush();

      // then
      expect(component.gridLayout.gridColumns).toBe(3);
      expect(component.gridLayout.gridCellRatio).toBe('1:1');
    }));

    it('#generateDashboard should pass current elements and grid to generator', fakeAsync(() => {

      // given
      const context = component.addSummaryTable();
      component.gridLayout.gridColumns = 4;
      component.gridLayout.gridCellRatio = '3:2';
      const generateSpy = vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flush();

      // then
      const request = generateSpy.mock.lastCall[0];
      expect(request.entries).toBe(component.entries);
      expect(request.currentContexts).toEqual([context]);
      expect(request.currentGrid).toEqual({ columns: 4, cellRatio: '3:2' });
      expect(request.columns().map(c => c.name)).toEqual(scene.columns.filter(c => c.indexed).map(c => c.name));
      expect(request.columns()[0]).not.toBe(request.columns()[0]);
    }));

    it('#generateDashboard should pass current elements without text boxes to generator', fakeAsync(() => {

      // given
      const context = component.addSummaryTable();
      component.addNote();
      const generateSpy = vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flush();

      // then
      expect(generateSpy.mock.lastCall[0].currentContexts).toEqual([context]);
    }));

    it('#generateDashboard should replace text tiles and notes by generated elements', fakeAsync(() => {

      // given
      component.addTextTile();
      component.addNote();
      const result = generatedDashboard();
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(result);
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flush();

      // then
      expectElementContexts(result.elementContexts);
    }));

    it('#generateDashboard should pass grid scroller width without scrollbar to generator', fakeAsync(() => {

      // given
      const scroller = component.divContentRef.nativeElement;
      scroller.style.boxSizing = 'border-box';
      scroller.style.width = '640px';
      const generateSpy = vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());

      // when
      component.generateDashboard();
      flush();

      // then
      expect(generateSpy.mock.lastCall[0].containerWidth).toBe(640 - DomMetrics.scrollbarWidth());
    }));

    it('#generateDashboard should pass canvas scroller width without scrollbar to generator', fakeAsync(() => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const scroller = component.divContentRef.nativeElement;
      scroller.style.boxSizing = 'border-box';
      scroller.style.width = '700px';
      const generateSpy = vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());

      // when
      component.generateDashboard();
      flush();

      // then
      expect(generateSpy.mock.lastCall[0].containerWidth).toBe(700 - DomMetrics.scrollbarWidth());
    }));

    it('#generateDashboard should ask for confirmation when dashboard has elements', fakeAsync(() => {

      // given
      component.addSummaryTable();
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());
      mockConfirmDialog(1);

      // when
      component.generateDashboard();
      flush();

      // then
      const data: ConfirmDialogData = vi.mocked(dialogService.showConfirmDialog).mock.lastCall[0];
      expect(data.title).toBe('Regenerate Dashboard');
      expect(data.htmlContent).toBe('<p>All elements of this dashboard will be replaced by newly generated ones. Continue?</p>');
      expect(data.buttonNames).toEqual(ConfirmDialogData.YES_NO);
    }));

    it('#generateDashboard should replace elements when regeneration is confirmed', fakeAsync(() => {

      // given
      component.addSummaryTable();
      const result = generatedDashboard();
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(result);
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flush();

      // then
      expectElementContexts(result.elementContexts);
    }));

    it('#generateDashboard should keep elements when regeneration is declined', fakeAsync(() => {

      // given
      const context = component.addSummaryTable();
      const generateSpy = vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());
      mockConfirmDialog(1);

      // when
      component.generateDashboard();
      flush();

      // then
      expect(generateSpy).not.toHaveBeenCalled();
      expectElementContexts([context]);
    }));

    it('#generateDashboard should warn and keep elements when nothing can be generated', fakeAsync(() => {

      // given
      const context = component.addSummaryTable();
      component.gridLayout.gridColumns = 4;
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(undefined);
      mockConfirmDialog(0);
      vi.spyOn(component, 'notifyWarning').mockReturnValue(undefined);

      // when
      component.generateDashboard();
      flush();

      // then
      expect(component.notifyWarning).toHaveBeenCalledWith('The data contains no columns suitable for generating a dashboard');
      expectElementContexts([context]);
      expect(component.gridLayout.gridColumns).toBe(4);
    }));

    it('#generateDashboard should close side bar and clear selection', fakeAsync(() => {

      // given
      const context = component.addGraph();
      component.configure(null, context);
      vi.spyOn(component.sidenav, 'close');
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flush();

      // then
      expect(component.sidenav.close).toHaveBeenCalled();
      expect(component.selectedContext).toBeUndefined();
      expect(component.selectedContextPosition).toBeUndefined();
    }));

    it('#generateDashboard should switch flex layout to grid layout', fakeAsync(() => {

      // given
      component.setLayout(Route.FLEX);
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());

      // when
      component.generateDashboard();
      fixture.detectChanges();
      flush();

      // then
      expect(component.isGridLayout()).toBe(true);
      expect(fixture.debugElement.query(By.css('#div_grid'))).toBeTruthy();
    }));

    it('#generateDashboard should fire structure change on generated chart contexts after rendering', fakeAsync(() => {

      // given
      const result = generatedDashboard();
      const [chartContext, summaryContext] = result.elementContexts;
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(result);

      // when
      component.generateDashboard();
      fixture.detectChanges();
      vi.spyOn(chartContext, 'fireStructureChanged');
      vi.spyOn(summaryContext, 'fireStructureChanged');
      tick();

      // then
      expect(chartContext.fireStructureChanged).toHaveBeenCalledTimes(1);
      expect(summaryContext.fireStructureChanged).not.toHaveBeenCalled();
    }));

    it('#click on regenerate button should generate dashboard', () => {

      // given
      vi.spyOn(component, 'generateDashboard').mockReturnValue(undefined);
      fixture.detectChanges();

      // when
      fixture.debugElement.query(By.css('#but_regenerate_dashboard')).nativeElement.click();

      // then
      expect(component.generateDashboard).toHaveBeenCalled();
    });

    it('regenerate button should be disabled while entries are loading', () => {

      // given
      component.loading = true;

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('#but_regenerate_dashboard')).nativeElement.disabled).toBe(true);
    });

    it('should not request persisting when not shown in a tab', () => {

      // when
      component.addGraph();
      component.setGridColumns(2);

      // then
      expect(viewTabsService.requestPersist).not.toHaveBeenCalled();
      expect(viewTabsService.register).not.toHaveBeenCalled();
    });

    it('#ngOnDestroy should not unregister when not shown in a tab', () => {

      // when
      fixture.destroy();

      // then
      expect(viewTabsService.unregister).not.toHaveBeenCalled();
    });
  });

  describe('with tab', () => {

    it('#ngOnInit should register as content provider of tab', fakeAsync(() => {

      // when
      init(dashboardTab());

      // then
      expect(viewTabsService.register).toHaveBeenCalledWith('tab1', component);
      expect(dialogService.showViewLauncherDialog).toHaveBeenCalled();
    }));

    it('should show print heading with tab title and scene name', fakeAsync(() => {

      // when
      init(dashboardTab());

      // then
      const heading: HTMLElement = fixture.nativeElement.querySelector('.div_header > koia-print-heading');
      expect(heading.querySelector('.span_print_title').textContent).toBe('Dashboard 1');
      expect(heading.querySelector('.span_print_details').textContent).toContain('Scene: Scene 1');
    }));

    it('#ngOnInit should restore view of tab without showing view launcher', fakeAsync(() => {

      // given
      const summaryContext = new SummaryContext(scene.columns.filter(c => c.indexed));
      summaryContext.title = 'Restored';
      const view = viewOf(Route.FLEX, [summaryContext], 2, '2:1');

      // when
      init(dashboardTab(view));

      // then
      expect(component.isGridLayout()).toBe(false);
      expect(component.gridLayout.gridColumns).toBe(2);
      expect(component.elementContexts.map(c => c.title)).toEqual(['Restored']);
      expect(dialogService.showViewLauncherDialog).not.toHaveBeenCalled();
    }));

    it('#ngOnInit should not modify view of tab when elements are changed', fakeAsync(() => {

      // given
      const summaryContext = new SummaryContext(scene.columns.filter(c => c.indexed));
      const view = viewOf(Route.GRID, [summaryContext]);
      const viewJson = JSON.stringify(view);
      init(dashboardTab(view));

      // when
      component.elementContexts[0].title = 'changed';

      // then
      expect(JSON.stringify(view)).toBe(viewJson);
    }));

    it('#addChart should scroll added element into view when dashboard started with elements', fakeAsync(() => {

      // given
      init(dashboardTab(viewOf(Route.GRID, [new SummaryContext(scene.columns)])));
      const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockReturnValue(undefined);

      // when
      component.addChart();
      fixture.detectChanges();

      // then
      expect(scrollIntoViewSpy).toHaveBeenCalledExactlyOnceWith({ block: 'end' });
    }));

    it('#ngOnDestroy should unregister and stop requesting persisting', fakeAsync(() => {

      // given
      init(dashboardTab());
      const context = component.addSummaryTable();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      fixture.destroy();
      context.title = 'after destroy';
      context.fireLookChanged();
      flush();

      // then
      expect(viewTabsService.unregister).toHaveBeenCalledWith('tab1', component);
      expect(viewTabsService.requestPersist).not.toHaveBeenCalled();
    }));

    it('#tabContent should provide current view with fixed modified time', fakeAsync(() => {

      // given
      init(dashboardTab());
      component.addSummaryTable();
      component.setLayout(Route.FLEX);

      // when
      const content = component.tabContent();

      // then
      expect(content.view.route).toBe(Route.FLEX);
      expect(content.view.name).toBe('Dashboard 1');
      expect(content.view.modifiedTime).toBe(0);
      expect(content.view.elements.length).toBe(1);
    }));

    it('#tabContent should provide grid settings of current layout', fakeAsync(() => {

      // given
      init(dashboardTab());
      component.setGridColumns(2);
      component.setGridCellRatio('2:1');
      component.setLayout(Route.FLEX);

      // when
      const content = component.tabContent();

      // then
      expect(content.view.route).toBe(Route.FLEX);
      expect(content.view.gridColumns).toBe(2);
      expect(content.view.gridCellRatio).toBe('2:1');
    }));

    it.each([CanvasPaging.NONE, CanvasPaging.PORTRAIT])('#tabContent should save canvas paging %s', paging => fakeAsync(() => {

      // given
      init(dashboardTab());
      component.addSummaryTable();
      component.showCanvas(paging);

      // when
      const content = component.tabContent();

      // then
      expect(content.view.canvasPaging).toBe(paging);
    })());

    it.each([
      { layout: 'grid', show: (): void => component.snapToGrid() },
      { layout: 'landscape pages', show: (): void => component.showCanvas(CanvasPaging.LANDSCAPE) }
    ])('#tabContent should not save canvas paging of $layout', ({ show }) => fakeAsync(() => {

      // given
      init(dashboardTab());
      component.addSummaryTable();
      show();

      // when
      const content = component.tabContent();

      // then
      expect(content.view).not.toHaveProperty('canvasPaging');
    })());

    it.each([
      { paging: CanvasPaging.NONE, format: PageFormat.UNPAGED },
      { paging: CanvasPaging.PORTRAIT, format: PageFormat.PORTRAIT },
      { paging: undefined, format: PageFormat.LANDSCAPE }
    ])('#ngOnInit should restore canvas paging $paging of tab view with positioned tiles', ({ paging, format }) => fakeAsync(() => {

      // given
      const context = new SummaryContext(scene.columns);
      context.setPosition(0, 10);
      const view = viewOf(Route.FLEX, [context]);
      view.canvasPaging = paging;

      // when
      init(dashboardTab(view));

      // then
      expect(component.freeLayout.pageFormat).toBe(format);
    })());

    it('#snapToGrid should request persisting when leaving canvas', fakeAsync(() => {

      // given
      init(dashboardTab());
      component.addGraph();
      component.showCanvas(CanvasPaging.PORTRAIT);
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      component.snapToGrid();

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));

    it.each([
      { change: 'addChart', apply: (c: DashboardComponent) => c.addChart() },
      { change: 'addGraph', apply: (c: DashboardComponent) => c.addGraph() },
      { change: 'addSummaryTable', apply: (c: DashboardComponent) => c.addSummaryTable() },
      { change: 'drop', apply: (c: DashboardComponent) => c.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<object>) },
      { change: 'changeElementPosition', apply: (c: DashboardComponent) => c.changeElementPosition(2) },
      { change: 'onTitleChanged', apply: (c: DashboardComponent) => c.onTitleChanged(c.elementContexts[0], 'x') },
      { change: 'onFilterChanged', apply: (c: DashboardComponent) => c.onFilterChanged(new Query()) },
      { change: 'setGridColumns', apply: (c: DashboardComponent) => c.setGridColumns(2) },
      { change: 'setGridCellRatio', apply: (c: DashboardComponent) => c.setGridCellRatio('2:1') },
      { change: 'setLayout', apply: (c: DashboardComponent) => c.setLayout(Route.FLEX) },
      { change: 'showCanvas', apply: (c: DashboardComponent) => c.showCanvas(CanvasPaging.PORTRAIT) },
      { change: 'removeElement', apply: (c: DashboardComponent) => c.removeElement(c.elementContexts[0]) }
    ])('#$change should request persisting', ({ apply }) => fakeAsync(() => {

      // given
      init(dashboardTab());
      component.addGraph();
      component.addSummaryTable();
      component.configure(null, component.elementContexts[0]);
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      apply(component);

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    })());

    it('should request persisting when element context changes', fakeAsync(() => {

      // given
      init(dashboardTab());
      const context = component.addSummaryTable();
      flush();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      context.gridColumnSpan = 2;
      flush();

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));

    it('should request persisting when side bar is closed', fakeAsync(() => {

      // given
      init(dashboardTab());
      component.addSummaryTable();
      fixture.detectChanges();
      flush();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      component.sidenav.close();
      fixture.detectChanges();
      flush();

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));

    it('#generateDashboard should scroll generated dashboard to top', fakeAsync(() => {

      // given
      init(dashboardTab(viewOf(Route.GRID, [new SummaryContext(scene.columns)])));
      const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockReturnValue(undefined);
      const grid: HTMLElement = fixture.nativeElement.querySelector('#div_grid');
      const scrollToSpy = vi.spyOn(grid, 'scrollTo').mockReturnValue(undefined);
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(generatedDashboard());
      mockConfirmDialog(0);

      // when
      component.generateDashboard();
      flushMicrotasks();
      fixture.detectChanges();
      flush();

      // then
      expect(scrollIntoViewSpy).not.toHaveBeenCalled();
      expect(scrollToSpy).toHaveBeenCalledExactlyOnceWith({ top: 0 });
    }));

    it('#generateDashboard should bind query and entries and request persisting', fakeAsync(() => {

      // given
      init(dashboardTab());
      const query = new Query();
      query.setFullTextFilter('abc');
      component.onFilterChanged(query);
      const result = generatedDashboard();
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(result);
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      component.generateDashboard();
      flush();

      // then
      result.elementContexts.forEach(c => {
        expect(c.query).toBe(query);
        expect(c.entries).toBe(component.entries);
      });
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));

    it('#generateDashboard should persist changes of generated elements', fakeAsync(() => {

      // given
      init(dashboardTab());
      const result = generatedDashboard();
      vi.spyOn(DashboardGenerator.prototype, 'generate').mockReturnValue(result);
      component.generateDashboard();
      flush();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      result.elementContexts[1].gridColumnSpan = 2;
      flush();

      // then
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));
  });

  describe('computed columns', () => {

    let computedScene: Scene;
    let computedEntries: object[];
    let computedColumnService: ComputedColumnService;

    beforeEach(() => {
      computedScene = SceneFactory.createScene('3', [
        { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
        { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
        { name: 'Count', dataType: DataType.NUMBER, width: 50, indexed: true }
      ]);
      computedEntries = [
        { Level: 'INFO', Amount: 10, Count: 4 },
        { Level: 'WARN', Amount: 20, Count: 0 }
      ];
      getActiveSceneSpy.mockReturnValue(computedScene);
      findEntriesSpy.mockReturnValue(of(computedEntries));
      vi.spyOn(dbService, 'updateScene').mockImplementation(s => Promise.resolve(s));
      computedColumnService = TestBed.inject(ComputedColumnService);
    });

    function computedColumn(name: string, operator: ComputeOperator): Column {
      return {
        name, dataType: DataType.NUMBER, width: 70, indexed: false,
        computation: { leftColumn: 'Amount', operator, rightColumn: 'Count' }
      };
    }

    function addChartOf(columnName: string): ChartContext {
      const context = component.addChart();
      context.dataColumns = [findColumn(columnName, context)];
      return context;
    }

    it('#addChart should offer a computed column', fakeAsync(() => {

      // given
      computedScene.columns.push(computedColumn('Diff', ComputeOperator.SUBTRACT));
      init();

      // when
      const context = component.addChart();

      // then
      expect(context.columns.map(c => c.name)).toEqual(['Level', 'Amount', 'Count', 'Diff']);
    }));

    it('#onComputedColumnsChanged should update element columns and recompute entries in memory when column was saved', fakeAsync(() => {

      // given
      init(dashboardTab());
      const context = component.addChart();
      findEntriesSpy.mockClear();
      vi.mocked(viewTabsService.requestPersist).mockClear();

      // when
      computedColumnService.save(computedColumn('Diff', ComputeOperator.SUBTRACT));
      flush();

      // then
      expect(findColumn('Diff', context).computation.operator).toBe(ComputeOperator.SUBTRACT);
      expect(component.entries).toEqual([
        { Level: 'INFO', Amount: 10, Count: 4, Diff: 6 },
        { Level: 'WARN', Amount: 20, Count: 0, Diff: 20 }
      ]);
      expect(context.entries).toBe(component.entries);
      expect(findEntriesSpy).not.toHaveBeenCalled();
      expect(viewTabsService.requestPersist).toHaveBeenCalled();
    }));

    it('#onComputedColumnsChanged should update element columns while entries are still loading', fakeAsync(() => {

      // given
      findEntriesSpy.mockReturnValue(new Observable<object[]>());
      init();
      const context = component.addChart();

      // when
      computedColumnService.save(computedColumn('Diff', ComputeOperator.SUBTRACT));
      flush();

      // then
      expect(component.entries).toBeUndefined();
      expect(context.columns.map(c => c.name)).toEqual(['Level', 'Amount', 'Count', 'Diff']);
    }));

    it('#onComputedColumnsChanged should replace values and remove undefined ones when formula was edited', fakeAsync(() => {

      // given
      computedScene.columns.push(computedColumn('Ratio', ComputeOperator.SUBTRACT));
      init();
      computedEntries.forEach(e => e['Ratio'] = e['Amount'] - e['Count']);
      const context = addChartOf('Ratio');

      // when
      computedColumnService.save(computedColumn('Ratio', ComputeOperator.DIVIDE));
      flush();

      // then
      expect(component.entries).toEqual([
        { Level: 'INFO', Amount: 10, Count: 4, Ratio: 2.5 },
        { Level: 'WARN', Amount: 20, Count: 0 }
      ]);
      expect(context.dataColumns[0].computation.operator).toBe(ComputeOperator.DIVIDE);
    }));

    it('#onComputedColumnsChanged should rename data column of element when column was renamed', fakeAsync(() => {

      // given
      computedScene.columns.push(computedColumn('Diff', ComputeOperator.SUBTRACT));
      init();
      const context = addChartOf('Diff');

      // when
      computedColumnService.save(computedColumn('Delta', ComputeOperator.SUBTRACT), 'Diff');
      flush();

      // then
      expect(context.dataColumns.map(c => c.name)).toEqual(['Delta']);
      expect(context.columns.map(c => c.name)).toEqual(['Level', 'Amount', 'Count', 'Delta']);
      expect(viewTabsService.renameColumn).toHaveBeenCalledWith('Diff', 'Delta');
    }));

    it('#applyView should restore renamed column of saved view when column was renamed', fakeAsync(() => {

      // given
      computedScene.columns.push(computedColumn('Diff', ComputeOperator.SUBTRACT));
      init();
      const view = viewOf(Route.GRID, [addChartOf('Diff')]);
      computedScene.config.savedViews = [savedViewOf('all', [{ id: 'tab9', type: ViewType.DASHBOARD, title: 'Diff', view }])];
      component.elementContexts = [];
      computedColumnService.save(computedColumn('Delta', ComputeOperator.SUBTRACT), 'Diff');
      flush();

      // when
      component.applyView(computedScene.config.savedViews[0].tabs[0].view);

      // then
      expect(component.elementContexts[0].dataColumns.map(c => c.name)).toEqual(['Delta']);
    }));

    it('#onComputedColumnsChanged should remove data column of element when column was removed', fakeAsync(() => {

      // given
      computedScene.columns.push(computedColumn('Diff', ComputeOperator.SUBTRACT));
      init();
      const context = addChartOf('Diff');

      // when
      computedColumnService.remove('Diff');
      flush();

      // then
      expect(context.dataColumns).toEqual([]);
      expect(context.columns.map(c => c.name)).toEqual(['Level', 'Amount', 'Count']);
    }));

    it('#onComputedColumnsChanged should be ignored after destroy', fakeAsync(() => {

      // given
      init();
      const context = component.addChart();
      fixture.destroy();

      // when
      computedColumnService.save(computedColumn('Diff', ComputeOperator.SUBTRACT));
      flush();

      // then
      expect(context.columns.map(c => c.name)).toEqual(['Level', 'Amount', 'Count']);
    }));
  });

  function elementsOf(contexts: ElementContext[]): unknown {
    return JSON.parse(JSON.stringify(new ModelToViewConverter().convert(Route.GRID, '', new Query(), contexts).elements));
  }

  function unplacedElementsOf(contexts: ElementContext[]): unknown {
    return (elementsOf(contexts) as Record<string, unknown>[]).map(element => {
      const unplaced = { ...element };
      ['x', 'y', 'z'].forEach(key => delete unplaced[key]);
      return unplaced;
    });
  }

  function resizeEvent(width: number, height: number, left = 0, top = 0, edges: Edges = { right: 0, bottom: 0 }): ResizeEvent {
    return {
      rectangle: { top, bottom: top + height, left, right: left + width, width, height },
      edges
    };
  }

  function findColumn(name: string, context: ElementContext): Column {
    return context.columns.find(c => c.name === name);
  }

  function mockConfirmDialog(closedWithButtonIndex: number): void {
    vi.spyOn(dialogService, 'showConfirmDialog').mockImplementation((data: ConfirmDialogData) => {
      data.closedWithButtonIndex = closedWithButtonIndex;
      return <MatDialogRef<ConfirmDialogComponent>>{
        afterClosed(): Observable<boolean> {
          return of(true);
        }
      };
    });
  }

  function generatedDashboard(gridColumns = 3): GeneratedDashboard {
    const indexedColumns = (): Column[] => scene.columns.filter(c => c.indexed).map(c => ({ ...c }));
    const chartContext = new ChartContext(indexedColumns(), ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
    chartContext.dataColumns = [findColumn('Level', chartContext)];
    const summaryContext = new SummaryContext(indexedColumns());
    summaryContext.dataColumns = [findColumn('Host', summaryContext)];
    return { grid: { columns: gridColumns, cellRatio: '1:1' }, elementContexts: [chartContext, summaryContext] };
  }

  function expectElementContexts(expected: ElementContext[]): void {
    expect(component.elementContexts.length).toBe(expected.length);
    component.elementContexts.forEach((c, i) => expect(c).toBe(expected[i]));
  }
});
