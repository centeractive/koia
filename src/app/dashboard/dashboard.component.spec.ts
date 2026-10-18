import { CdkDragDrop, CdkDragEnd } from '@angular/cdk/drag-drop';
import { CdkScrollableModule, ScrollDispatcher } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, ElementRef, NO_ERRORS_SCHEMA, QueryList } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, flushMicrotasks, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { ResizeEvent } from 'angular-resizable-element';
import { ConfirmDialogComponent, ConfirmDialogData } from 'app/shared/component/confirm-dialog/confirm-dialog/confirm-dialog.component';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Column, DataType, ElementContext, ExportFormat, Query, Route, Scene, Status, StatusType, SummaryContext, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { TabDef, View, ViewType } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
import { LanguageService } from 'app/shared/services/language';
import { ModelToViewConverter } from 'app/shared/services/view-persistence';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { MatIconModuleMock, SceneFactory } from 'app/shared/test';
import { NotificationServiceMock } from 'app/shared/test/notification-service-mock';
import type { SummaryTableComponent as RealSummaryTableComponent } from 'app/summary-table/summary-table.component';
import { Chart } from 'chart.js';
import { Observable, of, throwError } from 'rxjs';
import type { Mock } from 'vitest';
import { page } from 'vitest/browser';
import { DashboardComponent } from './dashboard.component';
import { FreeLayout } from './free-layout';
import { DashboardGenerator, GeneratedDashboard } from './generator/dashboard-generator';
import { PrintHeadingComponent } from 'app/shared/ui/print-heading/print-heading.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';

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

@Component({ selector: 'koia-element-header', template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class ElementHeaderComponent { }

describe('DashboardComponent', () => {

  let now: number;
  let scene: Scene;
  let entries: object[];
  let fixture: ComponentFixture<DashboardComponent>;
  let component: DashboardComponent;
  const dbService = new DBService(null);
  const dialogService = new DialogService(null);
  const viewPersistenceService = new ViewPersistenceService(dbService);
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
    viewTabsService = { requestPersist: vi.fn(), register: vi.fn(), unregister: vi.fn() } as unknown as ViewTabsService;
    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [
        DashboardComponent, MainToolbarComponent, ChartSideBarComponent, GraphSideBarComponent, SummaryTableSideBarComponent,
        SummaryTableComponent, ChartComponent, GraphComponent, ElementHeaderComponent, ViewToolbarComponent, PrintHeadingComponent
      ],
      imports: [MatSidenavModule, MatMenuModule, MatButtonModule, MatIconModule, MatBottomSheetModule, CdkScrollableModule],
      providers: [
        provideRouter([]),
        MatBottomSheet,
        { provide: DBService, useValue: dbService },
        { provide: DialogService, useValue: dialogService },
        { provide: ViewPersistenceService, useValue: viewPersistenceService },
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
    findEntriesSpy = vi.spyOn(dbService, 'findEntries').mockReturnValue(of(entries.slice(0)));
  }));

  function init(tab?: TabDef): void {
    component.tab = tab;
    fixture.detectChanges();
    flush();
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
      expect(dbService.findEntries).toHaveBeenCalled();
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
      expect(dbService.findEntries).toHaveBeenCalledWith(query, true);
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

    it('#loadView should not scroll elements into view', fakeAsync(() => {

      // given
      const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockReturnValue(undefined);

      // when
      component.loadView(viewOf(Route.GRID, [new SummaryContext(scene.columns), new SummaryContext(scene.columns)]));
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

    it('#resizableEdgesOf should return bottom/right-resizable when no chart margin is shown', () => {

      // when
      const edges = component.resizableEdgesOf(new GraphContext(scene.columns));

      // then
      expect(edges).toEqual({ bottom: true, right: true, top: false, left: false });
    });

    it('#resizableEdgesOf should return non-resizable when chart context shows margin', () => {

      // given
      const chartContext = new ChartContext(scene.columns, ChartType.PIE.type, { top: 0, right: 0, bottom: 0, left: 0 });
      chartContext.toggleShowResizableMargin();

      // when
      const edges = component.resizableEdgesOf(chartContext);

      // then
      expect(edges).toEqual({ bottom: false, right: false, top: false, left: false });
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
      expect(component.elementContexts.map(c => [c.x, c.y, c.z])).toEqual([[0, 0, 1], [610, 0, 2]]);
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

      it('#setLayout to free canvas should keep rendered tile rects', () => {

        // given
        renderGridSummaries(3, [[1, 2], [1, 1], [1, 1], [2, 1]], '2:1');
        const gridRects = rectsOf('#div_grid .div_tile');

        // when
        component.setLayout(Route.FLEX);
        fixture.detectChanges();

        // then
        expectSameRects(rectsOf('.div_canvas_tile'), gridRects);
      });

      it('#setLayout to free canvas should push tiles crossing page to next page', () => {

        // given
        renderGridSummaries(3, [[1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1], [1, 1]]);

        // when
        component.setLayout(Route.FLEX);

        // then
        const tops = component.elementContexts.map(c => c.y);
        expect(tops.slice(0, 3)).toEqual([0, 0, 0]);
        expect(tops[3] + component.elementContexts[3].height).toBeLessThanOrEqual(FreeLayout.PAGE_HEIGHT);
        expect(tops[6]).toBe(FreeLayout.PAGE_HEIGHT);
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

      it('#setLayout to grid should derive spans from canvas size', () => {

        // given
        component.gridLayout.gridColumns = 4;
        component.gridLayout.gridCellRatio = '1:1';
        renderCanvasSummaries([[0, 0, 690, 340], [0, 350, 1390, 340]]);

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
        const secondPage: HTMLElement = fixture.nativeElement.querySelectorAll('.div_canvas_page')[1];
        const tileRect = secondPage.querySelector('.div_canvas_tile').getBoundingClientRect();
        expect(tileRect.top - secondPage.getBoundingClientRect().top).toBeCloseTo(10 * canvasScale(), 0);
      });

      it('canvas tiles should be absolutely positioned', () => {

        // when
        renderCanvasSummaries([[100, 50, 600, 400]]);

        // then
        const [tileRect] = rectsOf('.div_canvas_tile');
        expect(getComputedStyle(fixture.nativeElement.querySelector('.div_canvas_tile')).position).toBe('absolute');
        expect(tileRect.left - pagesRect().left).toBeCloseTo(100 * canvasScale(), 0);
        expect(tileRect.top - pagesRect().top).toBeCloseTo(50 * canvasScale(), 0);
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
        component.onGridResizing(resizeEvent(3 * pitch - 10, pitch - 10));

        // then
        expect(component.resizePreview.width).toBeCloseTo(3 * pitch - 10, 0);
      });

      it('#onGridResizing should preview covered cells', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);

        // when
        component.onGridResizing(resizeEvent(pitch + 5, pitch + 5));

        // then
        expectPreview({ left: 0, top: 0, width: 2 * pitch - 10, height: 2 * pitch - 10 });
      });

      it('#onGridResizing should limit preview to grid columns', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1], [1, 1], [1, 1], [1, 1]]);

        // when
        component.onGridResizing(resizeEvent(2 * pitch - 10, pitch - 10, 3 * pitch));

        // then
        expect(component.resizePreview.width).toBeCloseTo(pitch - 10, 0);
      });

      it('should render grid resize preview', () => {

        // given
        const pitch = renderGridSummariesForResize([[1, 1]]);
        component.onGridResizing(resizeEvent(pitch + 5, pitch + 5));

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

      it('#onGridResizeEnd should snap tile to covered grid cells', () => {

        // given
        renderGridSummariesForResize([[1, 1], [1, 1]]);
        const cw = contentWidth();
        component.onGridResizing(resizeEvent(cw / 2, cw / 2));
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

      function renderCanvasSummaries(rects: number[][]): SummaryContext[] {
        component.setLayout(Route.FLEX);
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
        return component.canvasPagesRef.nativeElement.clientWidth / FreeLayout.PAGE_WIDTH;
      }

      function pagesRect(): DOMRect {
        return component.canvasPagesRef.nativeElement.getBoundingClientRect();
      }

      const PICKUP = { x: 10, y: 10 };

      function constrainMoveTo(x: number, y: number, pages = pagesRect()): { x: number, y: number } {
        const scale = canvasScale();
        return component.constrainFreeMove({ x: pages.left + x * scale + PICKUP.x, y: pages.top + y * scale + PICKUP.y }, null, null, PICKUP);
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
        expect(point.x).toBeCloseTo(pagesRect().left + 600 * canvasScale(), 5);
        expect(point.y).toBeCloseTo(pagesRect().top, 5);
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
        expect(point.x).toBeCloseTo(startRect.left + 600 * canvasScale(), 5);
        expect(point.y).toBeCloseTo(startRect.top, 5);
      });

      it('#onFreeMoving should show guides of snap', () => {

        // given
        const [, moved] = renderCanvasSummaries([[0, 0, 600, 400], [0, 410, 600, 300]]);
        component.onFreeMoveStarted(moved);
        constrainMoveTo(603, 3);

        // when
        component.onFreeMoving();

        // then
        expect(component.canvasGuides).toEqual([{ axis: 'x', position: 600 }, { axis: 'y', position: 0 }]);
      });

      it('#onFreeMoving should show no guides before first move', () => {

        // given
        const [moved] = renderCanvasSummaries([[0, 0, 600, 400]]);
        component.onFreeMoveStarted(moved);

        // when
        component.onFreeMoving();

        // then
        expect(component.canvasGuides).toEqual([]);
      });

      it('#onFreeMoveEnded should set position, bring tile to front and reset drag', () => {

        // given
        const [moved, other] = renderCanvasSummaries([[0, 410, 600, 400], [0, 0, 600, 400]]);
        component.onFreeMoveStarted(moved);
        constrainMoveTo(603, 3);
        component.onFreeMoving();
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
        constrainMoveTo(0, FreeLayout.PAGE_HEIGHT + 2);
        vi.spyOn(chartContext, 'fireStructureChanged');

        // when
        component.onFreeMoveEnded(chartContext, dragEnd());
        tick();

        // then
        expect(chartContext.y).toBe(FreeLayout.PAGE_HEIGHT);
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
        expect(component.resizePreview.left).toBe(0);
        expect(component.resizePreview.top).toBe(0);
        expect(component.resizePreview.width).toBeCloseTo(700 * scale, 5);
        expect(component.resizePreview.height).toBeCloseTo(400 * scale, 5);
        expect(component.canvasGuides).toEqual([{ axis: 'x', position: 700 }]);
      });

      it('#onFreeResizeEnd should set snapped size and bring tile to front', () => {

        // given
        const [resized, other] = renderCanvasSummaries([[0, 0, 600, 400], [0, 410, 600, 400]]);
        component.onFreeResizeStart(resized);
        const scale = canvasScale();
        component.onFreeResizing(resized, resizeEvent(697 * scale, 397 * scale));

        // when
        component.onFreeResizeEnd(resized, { ...resizeEvent(697 * scale, 397 * scale), edges: { top: 0, left: 0, right: 97, bottom: -3 } });

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
        component.onFreeResizeEnd(resized, { ...resizeEvent(447 * scale, 333 * scale), edges: { top: 0, left: 0, right: 0, bottom: 0 } });

        // then
        expect([resized.width, resized.height]).toEqual([447, 333]);
        expect(component.resizePreview).toBeUndefined();
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
    });

    it('#loadView should place tiles of legacy flex view in rows', () => {

      // given
      component.addSummaryTable();
      component.addSummaryTable();
      const view = viewOf(Route.FLEX, component.elementContexts);

      // when
      component.loadView(view);

      // then
      expect(component.elementContexts.map(c => [c.x, c.y])).toEqual([[0, 0], [610, 0]]);
    });

    it('#loadView should size legacy flex tiles without size by default', () => {

      // given
      component.addSummaryTable();
      const view = viewOf(Route.FLEX, component.elementContexts);
      view.elements[0].width = null;
      view.elements[0].height = null;

      // when
      component.loadView(view);

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
      expect([context.x, context.y]).toEqual([0, 410]);
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

    it('snap to grid button should follow separator in front of add buttons', () => {

      // when
      const button = snapToGridButton();

      // then
      expect(button.previousElementSibling.classList).toContain('koia-toolbar-separator');
      expect(button.nextElementSibling.querySelector('mat-icon[svgicon="add_chart"]')).toBeTruthy();
    });

    it('snap to grid button should switch to flex layout', () => {

      // when
      snapToGridButton().click();
      fixture.detectChanges();

      // then
      expect(component.isGridLayout()).toBe(false);
      expect(snapToGridButton().classList).not.toContain('koia-toggle-active');
    });

    it('snap to grid button should switch back to grid layout', () => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();

      // when
      snapToGridButton().click();

      // then
      expect(component.isGridLayout()).toBe(true);
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

    it('should render resize handle on grid tiles', () => {

      // given
      component.addSummaryTable();

      // when
      fixture.detectChanges();

      // then
      expect(fixture.nativeElement.querySelector('#div_grid .div_tile > img.resize-handle')).toBeTruthy();
    });

    it.each([
      { layout: Route.GRID, type: 'mousedown' },
      { layout: Route.GRID, type: 'touchstart' },
      { layout: Route.FLEX, type: 'mousedown' },
      { layout: Route.FLEX, type: 'touchstart' }
    ])('resize handle should not propagate $type to tile in $layout layout', ({ layout, type }) => {

      // given
      component.addSummaryTable();
      component.setLayout(layout);
      fixture.detectChanges();
      const tileListener = vi.fn();
      fixture.nativeElement.querySelector('.div_tile').addEventListener(type, tileListener);

      // when
      fixture.nativeElement.querySelector('.div_tile img.resize-handle').dispatchEvent(new Event(type, { bubbles: true }));

      // then
      expect(tileListener).not.toHaveBeenCalled();
    });

    it('#loadView should load grid view', () => {

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
      component.loadView(view);

      // then
      expect(component.isGridLayout()).toBe(true);
      expect(component.gridLayout.gridColumns).toBe(4);
      expect(component.gridLayout.gridCellRatio).toBe('4:3');
      expect(elementsOf(component.elementContexts)).toEqual(elementsOf(elementContexts));
    });

    it('#loadView should switch to flex layout and keep grid settings of legacy flex view', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      const view = viewOf(Route.FLEX, component.elementContexts, null, null);
      component.gridLayout.gridColumns = 2;
      component.gridLayout.gridCellRatio = '2:1';

      // when
      component.loadView(view);

      // then
      expect(component.isGridLayout()).toBe(false);
      expect(component.gridLayout.gridColumns).toBe(2);
      expect(component.gridLayout.gridCellRatio).toBe('2:1');
    });

    it('#loadView should restore summary context column hierarchy', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      summaryContext.groupByColumns = [findColumn('Path', summaryContext), findColumn('Time', summaryContext), findColumn('Amount', summaryContext)];
      const view = viewOf(Route.FLEX, component.elementContexts);
      component.elementContexts = [];

      // when
      component.loadView(view);

      // then
      expect(component.elementContexts.length).toBe(1);
      expect(component.elementContexts[0].groupByColumns.map(c => c.name)).toEqual(['Path', 'Time', 'Amount']);
    });

    it('#loadView should restore and fetch query of view', () => {

      // given
      const query = new Query();
      query.setFullTextFilter('abc');
      const view = new ModelToViewConverter().convert(Route.GRID, 'test', query, []);

      // when
      component.loadView(view);

      // then
      expect(component.restoredQuery.getFullTextFilter()).toBe('abc');
      expect(dbService.findEntries).toHaveBeenLastCalledWith(component.restoredQuery, true);
    });

    it('#loadView should not modify loaded view when elements are changed', () => {

      // given
      const summaryContext = component.addSummaryTable();
      summaryContext.dataColumns = [findColumn('Level', summaryContext)];
      const view = viewOf(Route.GRID, component.elementContexts);
      const viewJson = JSON.stringify(view);
      component.loadView(view);

      // when
      component.elementContexts[0].title = 'changed';
      component.elementContexts[0].gridColumnSpan = 3;

      // then
      expect(JSON.stringify(view)).toBe(viewJson);
    });

    it('#saveView should not save view when input dialog is canceled', () => {

      // given
      component.addSummaryTable();
      vi.spyOn(dialogService, 'showInputDialog').mockImplementation((data: InputDialogData) => {
        data.closedWithOK = false;
        return createInputDialogRef();
      });
      vi.spyOn(viewPersistenceService, 'saveView').mockReturnValue(undefined);

      // when
      component.saveView();

      // then
      expect(viewPersistenceService.saveView).not.toHaveBeenCalled();
    });

    it('#saveView should warn user when view contains no elements', () => {

      // given
      component.elementContexts = [];

      // when
      component.saveView();

      // then
      expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet),
        { type: StatusType.WARNING, msg: 'View contains no elements' });
    });

    it('#saveView should save view with current layout and notify user about success', fakeAsync(() => {

      // given
      component.setLayout(Route.FLEX);
      component.addSummaryTable();
      vi.spyOn(dialogService, 'showInputDialog').mockImplementation((data: InputDialogData) => {
        data.input = 'test';
        data.closedWithOK = true;
        return createInputDialogRef();
      });
      const status: Status = { type: StatusType.SUCCESS, msg: 'View has been saved' };
      const saveViewSpy = vi.spyOn(viewPersistenceService, 'saveView').mockResolvedValue(status);

      // when
      component.saveView();
      tick();

      // then
      const savedView: View = saveViewSpy.mock.lastCall[1];
      expect(savedView.route).toBe(Route.FLEX);
      expect(savedView.name).toBe('test');
      expect(savedView.gridColumns).toBe(component.gridLayout.gridColumns);
      expect(savedView.gridCellRatio).toBe(component.gridLayout.gridCellRatio);
      expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), status);
    }));

    it('#click on print button should print window', () => {

      // given
      component.addGraph();
      fixture.detectChanges();
      vi.spyOn(window, 'print').mockReturnValue(undefined);

      // when
      fixture.debugElement.query(By.css('#but_print')).nativeElement.click();

      // then
      expect(window.print).toHaveBeenCalled();
    });

    it('#click on save button should save view', () => {

      // given
      component.addGraph();
      fixture.detectChanges();
      vi.spyOn(component, 'saveView').mockReturnValue(undefined);

      // when
      fixture.debugElement.query(By.css('#but_save_view')).nativeElement.click();

      // then
      expect(component.saveView).toHaveBeenCalled();
    });

    it('print and save buttons should be disabled without elements', () => {

      // given
      component.elementContexts = [];

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('#but_print')).nativeElement.disabled).toBe(true);
      expect(fixture.debugElement.query(By.css('#but_save_view')).nativeElement.disabled).toBe(true);
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

    it('#updateViews should update views and notify user', async () => {

      // given
      const converter = new ModelToViewConverter();
      const deleted = converter.convert(Route.GRID, 'deleted', new Query(), []);
      const renamed = converter.convert(Route.FLEX, 'renamed', new Query(), []);
      const status = { type: StatusType.SUCCESS, msg: 'Deleted 1 view\nRenamed 1 view' };
      vi.spyOn(viewPersistenceService, 'updateViews').mockResolvedValue(status);
      vi.spyOn(viewPersistenceService, 'findViews').mockReturnValue([renamed]);

      // when
      await component.updateViews([deleted], [renamed]);

      // then
      expect(viewPersistenceService.updateViews).toHaveBeenCalledWith(scene, [deleted], [renamed]);
      expect(component.views).toEqual([renamed]);
      expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), status);
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

    it('#ngOnInit should not take tab title as name for saving view', fakeAsync(() => {

      // given
      init(dashboardTab(viewOf(Route.GRID, [new SummaryContext(scene.columns)])));
      const showInputDialogSpy = vi.spyOn(dialogService, 'showInputDialog').mockReturnValue(createInputDialogRef());

      // when
      component.saveView();

      // then
      const dialogData: InputDialogData = showInputDialogSpy.mock.lastCall[0];
      expect(dialogData.input).toBe('');
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

    it('#manageViews should show manage view dialog', fakeAsync(() => {

      // given
      init(dashboardTab());
      vi.spyOn(dialogService, 'showManageViewDialog').mockReturnValue(undefined);

      // when
      component.manageViews();

      // then
      expect(dialogService.showManageViewDialog).toHaveBeenCalledWith(component);
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
      { change: 'toggleGridLayout', apply: (c: DashboardComponent) => c.toggleGridLayout() },
      { change: 'removeElement', apply: (c: DashboardComponent) => c.removeElement(c.elementContexts[0]) },
      { change: 'loadView', apply: (c: DashboardComponent) => c.loadView(viewOf(Route.GRID, [])) }
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

  function resizeEvent(width: number, height: number, left = 0, top = 0): ResizeEvent {
    return {
      rectangle: { top, bottom: top + height, left, right: left + width, width, height },
      edges: null
    };
  }

  function findColumn(name: string, context: ElementContext): Column {
    return context.columns.find(c => c.name === name);
  }

  function createInputDialogRef(): MatDialogRef<InputDialogComponent> {
    return <MatDialogRef<InputDialogComponent>>{
      afterClosed(): Observable<boolean> {
        return of(true);
      }
    };
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
