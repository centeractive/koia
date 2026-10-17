import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { CdkScrollableModule, ScrollDispatcher } from '@angular/cdk/scrolling';
import { ChangeDetectionStrategy, Component, ElementRef, NO_ERRORS_SCHEMA, QueryList } from '@angular/core';
import { ComponentFixture, fakeAsync, flush, TestBed, tick, waitForAsync } from '@angular/core/testing';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { By } from '@angular/platform-browser';
import { provideRouter, Router } from '@angular/router';
import { ResizeEvent } from 'angular-resizable-element';
import { InputDialogComponent, InputDialogData } from 'app/shared/component/input-dialog/input-dialog.component';
import { Column, DataType, ElementContext, ExportFormat, Query, Route, Scene, Status, StatusType, SummaryContext, TimeUnit } from 'app/shared/model';
import { ChartContext, ChartType } from 'app/shared/model/chart';
import { GraphContext } from 'app/shared/model/graph';
import { TabDef, View, ViewType } from 'app/shared/model/view-config';
import { DialogService, ExportService, NotificationService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { ChartMarginService } from 'app/shared/services/chart';
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
import { PrintHeadingComponent } from 'app/shared/ui/print-heading/print-heading.component';
import { ViewToolbarComponent } from 'app/shared/ui/view-toolbar/view-toolbar.component';

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

    it('#onFilterChanged should notify error when error occurs', fakeAsync(() => {

      // given
      findEntriesSpy.mockReturnValue(throwError(() => 'server error'));
      vi.spyOn(component, 'notifyError').mockReturnValue(undefined);

      // when
      component.onFilterChanged(new Query());
      flush();

      // then
      expect(component.notifyError).toHaveBeenCalled();
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

    it('#validateElementResize should reject too small element', () => {

      // when
      const valid = component.validateElementResize(resizeEvent(100, 100));

      // then
      expect(valid).toBe(false);
    });

    it('#onResizeEnd should resize element container and set context size', () => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const context = component.addSummaryTable();
      fixture.detectChanges();
      vi.spyOn(context, 'setSize').mockReturnValue(undefined);

      // when
      component.onResizeEnd(context, resizeEvent(333, 221));

      // then
      expect(context.setSize).toHaveBeenCalledWith(333, 221);
      const containerStyle = component.elementContainerDivRefs.get(0).nativeElement.style;
      expect(containerStyle.width).toBe('333px');
      expect(containerStyle.height).toBe('221px');
    });

    it('#onResizeEnd should set context size when container is not rendered', () => {

      // given
      const context = component.addSummaryTable();
      component.elementContainerDivRefs = new QueryList<ElementRef<HTMLDivElement>>();
      vi.spyOn(context, 'setSize').mockReturnValue(undefined);

      // when
      component.onResizeEnd(context, resizeEvent(300, 199));

      // then
      expect(context.setSize).toHaveBeenCalledWith(300, 199);
    });

    it('should render grid layout markup', () => {

      // given
      component.addGraph();

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('#div_grid'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#div_flex'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.div_graph koia-graph'))).toBeTruthy();
    });

    it('should render flex layout markup', () => {

      // given
      component.addGraph();
      component.setLayout(Route.FLEX);

      // when
      fixture.detectChanges();

      // then
      expect(fixture.debugElement.query(By.css('#div_flex'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('#div_grid'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.div_graph'))).toBeFalsy();
      expect(fixture.debugElement.query(By.css('.div_flex_element koia-graph'))).toBeTruthy();
    });

    it('grid content should scroll below header', () => {

      // given
      const grid: HTMLElement = fixture.nativeElement.querySelector('#div_grid');

      // when
      (grid.firstElementChild as HTMLElement).style.height = '5000px';

      // then
      expectScrollingBelowHeader(grid);
    });

    it('flex content should scroll below header', () => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const flex: HTMLElement = fixture.nativeElement.querySelector('#div_flex');

      // when
      flex.style.height = '5000px';

      // then
      expectScrollingBelowHeader(flex.parentElement);
    });

    it('grid content should be registered as scrollable', () => {

      // given
      const grid: HTMLElement = fixture.nativeElement.querySelector('#div_grid');

      // when
      const scrollables = TestBed.inject(ScrollDispatcher).getAncestorScrollContainers(grid.firstElementChild as HTMLElement);

      // then
      expect(scrollables.map(s => s.getElementRef().nativeElement)).toContain(grid);
    });

    it('flex content should be scrollable ancestor of drop list for drag auto-scroll', () => {

      // given
      component.setLayout(Route.FLEX);
      fixture.detectChanges();
      const flex: HTMLElement = fixture.nativeElement.querySelector('#div_flex');

      // when
      const scrollables = TestBed.inject(ScrollDispatcher).getAncestorScrollContainers(flex);

      // then
      expect(scrollables.map(s => s.getElementRef().nativeElement)).toContain(flex.parentElement);
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

    it('should render flex tiles as white surface with thin frame instead of heavy shadow', () => {

      // given
      component.addGraph();
      component.setLayout(Route.FLEX);

      // when
      fixture.detectChanges();

      // then
      expectWhiteThinFramedTiles('.div_flex_element');
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
      expect(elementsOf(component.elementContexts)).toEqual(elementsOf(previousContexts));
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
      component.elementContainerDivRefs = new QueryList<ElementRef<HTMLDivElement>>();
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

      function renderGridSummaries(gridColumns: number, spans: number[][]): void {
        component.gridLayout.gridColumns = gridColumns;
        component.gridLayout.gridCellRatio = '1:1';
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

      function applyContextSizes(): void {
        component.elementContexts.forEach(c => component.onResizeEnd(c, resizeEvent(c.width, c.height)));
        fixture.detectChanges();
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

      it('#setLayout to flex should take size of rendered grid tiles', () => {

        // given
        renderHalfWidthSummaries();
        const gridRects = rectsOf('#div_grid .div_tile');

        // when
        component.setLayout(Route.FLEX);
        fixture.detectChanges();

        // then
        component.elementContexts.forEach((c, i) => {
          expect(c.width).toBeCloseTo(gridRects[i].width, 0);
          expect(c.height).toBeCloseTo(gridRects[i].height, 0);
        });
      });

      it('#setLayout to flex should place tiles at former grid positions', () => {

        // given
        renderHalfWidthSummaries();
        const gridRects = rectsOf('#div_grid .div_tile');

        // when
        component.setLayout(Route.FLEX);
        fixture.detectChanges();
        applyContextSizes();

        // then
        expectSameRects(rectsOf('.div_flex_element'), gridRects);
      });

      it('#setLayout to flex should keep size of tile with zero-sized rect', () => {

        // given
        renderHalfWidthSummaries();
        const tile = component.elementContainerDivRefs.get(0).nativeElement.parentElement;
        vi.spyOn(tile, 'getBoundingClientRect').mockReturnValue(new DOMRect(0, 0, 100, 0));
        const [width, height] = [component.elementContexts[0].width, component.elementContexts[0].height];

        // when
        component.setLayout(Route.FLEX);

        // then
        expect([component.elementContexts[0].width, component.elementContexts[0].height]).toEqual([width, height]);
      });

      it('#setLayout to grid should derive spans from flex size', () => {

        // given
        component.gridLayout.gridColumns = 4;
        component.gridLayout.gridCellRatio = '1:1';
        component.setLayout(Route.FLEX);
        component.elementContexts = [new SummaryContext(scene.columns), new SummaryContext(scene.columns)];
        fixture.detectChanges();
        const contentWidth = component.divContentRef.nativeElement.clientWidth;
        const rowHeight = contentWidth / 4 - 10;
        component.onResizeEnd(component.elementContexts[0], resizeEvent(contentWidth / 2 - 10, rowHeight));
        component.onResizeEnd(component.elementContexts[1], resizeEvent(contentWidth - 10, rowHeight));
        fixture.detectChanges();
        const flexRects = rectsOf('.div_flex_element');

        // when
        component.setLayout(Route.GRID);
        fixture.detectChanges();

        // then
        expect(component.elementContexts.map(c => [c.gridColumnSpan, c.gridRowSpan])).toEqual([[2, 1], [4, 1]]);
        expectSameRects(rectsOf('#div_grid .div_tile'), flexRects);
      });
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

    it('layout menu items should switch layout', fakeAsync(() => {

      // given
      fixture.debugElement.query(By.css('.but_view_more')).nativeElement.click();
      fixture.detectChanges();
      (document.querySelector('#menuItemLayout') as HTMLButtonElement).click();
      fixture.detectChanges();
      flush();

      // when
      (document.querySelector('#menuItemFlexLayout') as HTMLButtonElement).click();

      // then
      expect(component.isGridLayout()).toBe(false);
    }));

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
      const indexedColumns = scene.columns.filter(c => c.indexed);
      expect(exportService.exportData).toHaveBeenCalledWith(exportData, indexedColumns, ExportFormat.EXCEL, 'Test');
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

    it('#updateViews should update views and notify user', () => {

      // given
      const converter = new ModelToViewConverter();
      const deleted = converter.convert(Route.GRID, 'deleted', new Query(), []);
      const renamed = converter.convert(Route.FLEX, 'renamed', new Query(), []);
      const status = { type: StatusType.SUCCESS, msg: 'Deleted 1 view\nRenamed 1 view' };
      vi.spyOn(viewPersistenceService, 'updateViews').mockReturnValue(status);
      vi.spyOn(viewPersistenceService, 'findViews').mockReturnValue([renamed]);

      // when
      component.updateViews([deleted], [renamed]);

      // then
      expect(viewPersistenceService.updateViews).toHaveBeenCalledWith(scene, [deleted], [renamed]);
      expect(component.views).toEqual([renamed]);
      expect(notificationService.showStatus).toHaveBeenCalledWith(TestBed.inject(MatBottomSheet), status);
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

    it('should scroll bottom of new element into view when tab with elements was restored', fakeAsync(() => {

      // given
      init(dashboardTab(viewOf(Route.GRID, [new SummaryContext(scene.columns)])));
      const scrollIntoViewSpy = vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockReturnValue(undefined);

      // when
      component.addGraph();
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
  });

  function elementsOf(contexts: ElementContext[]): unknown {
    return JSON.parse(JSON.stringify(new ModelToViewConverter().convert(Route.GRID, '', new Query(), contexts).elements));
  }

  function resizeEvent(width: number, height: number): ResizeEvent {
    return {
      rectangle: { top: 0, bottom: 0, left: 0, right: 0, width, height },
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
});
