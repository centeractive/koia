import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ChangeDetectionStrategy, Component, CUSTOM_ELEMENTS_SCHEMA, provideZoneChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { provideRouter, RouteReuseStrategy } from '@angular/router';
import { ResizableDirective, ResizeHandleDirective } from 'angular-resizable-element';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { DashboardComponent } from 'app/dashboard/dashboard.component';
// must be imported after DashboardComponent to resolve the ViewController <-> ChartComponent import cycle in the right order
import { ChartComponent } from 'app/chart/chart.component';
import { PivotTableComponent } from 'app/pivot-table/pivot-table.component';
import { Aggregation, Query, Route, Scene } from 'app/shared/model';
import { ChartContext } from 'app/shared/model/chart';
import { ConfigRecord, ElementType, SceneTabs, View, ViewType } from 'app/shared/model/view-config';
import { DialogService, NotificationService, TimeGroupingService, ViewPersistenceService } from 'app/shared/services';
import { DBService } from 'app/shared/services/backend';
import { Summary } from 'app/shared/services/view-persistence';
import { queryToQueryDef } from 'app/shared/services/view-persistence/filter/query-to-filter-converter';
import { ViewTabsService } from 'app/shared/services/view-tabs';
import { BACKENDS, BackendRun, IT_COLUMNS, IT_PROVIDERS, sceneData, setUpBackend, tearDownBackend } from 'app/shared/test/backend-fixture';
import { DomMetrics } from 'app/shared/ui/table-fit/dom-metrics';
import { ValueRangeGroupingService } from 'app/shared/value-range';
import { page } from 'vitest/browser';

const TIMEOUT = 30_000;

@Component({ template: '', changeDetection: ChangeDetectionStrategy.Eager, standalone: false })
class DummyComponent { }

describe.each(BACKENDS)('View tabs IT ($name)', backend => {

  let run: BackendRun;
  let scene: Scene;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      declarations: [DashboardComponent, PivotTableComponent, ChartComponent, DummyComponent],
      imports: [MatSidenavModule, MatMenuModule, MatTooltipModule, MatDialogModule, MatBottomSheetModule, MatProgressBarModule, ResizableDirective, ResizeHandleDirective,
        DragDropModule],
      providers: [
        provideZoneChangeDetection(),
        ...IT_PROVIDERS,
        provideRouter([{ path: '**', component: DummyComponent }]),
        { provide: RouteReuseStrategy, useClass: AppRouteReuseStrategy },
        NotificationService,
        TimeGroupingService,
        ValueRangeGroupingService,
        { provide: DBService, useFactory: () => run.db }
      ]
    });
    run = await setUpBackend(backend, [sceneData('it', 30)]);
    scene = run.scenes[0].scene;
    vi.spyOn(run.db, 'getActiveScene').mockImplementation(() => scene);
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    const dialogService = TestBed.inject(DialogService);
    vi.spyOn(dialogService, 'showViewLauncherDialog').mockReturnValue(undefined);
    vi.spyOn(dialogService, 'showConfigLauncherDialog').mockReturnValue(undefined);
  }, TIMEOUT);

  afterEach(async () => {
    await tearDownBackend(run);
  }, TIMEOUT);

  async function readyTabsService(): Promise<ViewTabsService> {
    const service = TestBed.inject(ViewTabsService);
    await DomMetrics.waitFrames(() => service.ready, 600);
    return service;
  }

  async function persistedTabs(expectedCount: number): Promise<SceneTabs> {
    for (let attempt = 0; attempt < 100; attempt++) {
      const sceneTabs = await run.db.findSceneTabs(scene._id);
      if (sceneTabs?.tabs.length === expectedCount) {
        return sceneTabs;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    throw new Error(expectedCount + ' persisted tabs expected');
  }

  function summaryElement(gridColumnSpan: number, gridRowSpan: number): Summary {
    return {
      elementType: ElementType.SUMMARY, title: 'Levels', gridColumnSpan, gridRowSpan, width: 400, height: 300,
      dataColumns: [IT_COLUMNS.find(c => c.name === 'Level')], splitColumns: [], groupByColumns: [], aggregations: [Aggregation.COUNT],
      valueGroupings: [], colorOptions: undefined, empty: ''
    };
  }

  function legacyView(route: Route, name: string, gridColumns: number, element: Summary): View {
    return { route, name, modifiedTime: 1, query: null, gridColumns, gridCellRatio: gridColumns ? '1:1' : null, elements: [element] };
  }

  it('should persist open tabs numbered per type and restore them after scene was activated again', async () => {

    // given
    const service = await readyTabsService();
    await service.addTab(ViewType.PIVOT);
    await service.addTab(ViewType.DASHBOARD);
    await service.addTab(ViewType.DASHBOARD);
    await service.addTab(ViewType.PIVOT);
    await persistedTabs(4);

    // when
    scene = await run.db.findScene(scene._id);
    const restoredService = await readyTabsService();

    // then
    expect(restoredService.tabs).toEqual([
      { id: 'tab1', type: ViewType.PIVOT, title: 'Pivot Table' },
      { id: 'tab2', type: ViewType.DASHBOARD, title: 'Dashboard' },
      { id: 'tab3', type: ViewType.DASHBOARD, title: 'Dashboard 2' },
      { id: 'tab4', type: ViewType.PIVOT, title: 'Pivot Table 2' }
    ]);
  }, TIMEOUT);

  it('should open legacy flex view in dashboard with flex layout and default spans', async () => {

    // given
    const flexView = legacyView(Route.FLEX, 'legacy flex', null, summaryElement(null, null));
    scene.config.views.push(flexView);
    await run.db.updateScene(scene);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const dashboard = fixture.componentInstance;

    // when
    dashboard.loadView(dashboard.views.find(v => v.name === 'legacy flex'));

    // then
    expect(dashboard.isGridLayout()).toBe(false);
    expect(dashboard.elementContexts[0].gridColumnSpan).toBe(1);
    expect(dashboard.elementContexts[0].gridRowSpan).toBe(1);
    expect(dashboard.elementContexts[0].title).toBe('Levels');
    fixture.destroy();
  }, TIMEOUT);

  it('should open legacy grid view in dashboard with grid layout and settings', async () => {

    // given
    scene.config.views.push(legacyView(Route.GRID, 'legacy grid', 2, summaryElement(2, 1)));
    await run.db.updateScene(scene);
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    const dashboard = fixture.componentInstance;
    dashboard.setLayout(Route.FLEX);

    // when
    dashboard.loadView(dashboard.views.find(v => v.name === 'legacy grid'));

    // then
    expect(dashboard.isGridLayout()).toBe(true);
    expect(dashboard.gridLayout.gridColumns).toBe(2);
    expect(dashboard.elementContexts[0].gridColumnSpan).toBe(2);
    fixture.destroy();
  }, TIMEOUT);

  it('should open legacy pivot record in pivot table', async () => {

    // given
    const record: ConfigRecord = {
      route: Route.PIVOT, name: 'legacy pivot', modifiedTime: 1, query: null,
      data: {
        timeColumns: [], negativeColor: '#FF3333', positiveColor: '#00FF00', showRowTotals: true, showColumnTotals: true,
        valueGroupings: [], pivotOptions: { rendererName: 'Table', cols: ['Level'], rows: [] }
      }
    };
    scene.config.records.push(record);
    await run.db.updateScene(scene);
    const fixture = TestBed.createComponent(PivotTableComponent);
    fixture.autoDetectChanges();
    const pivotTable = fixture.componentInstance;
    await DomMetrics.waitFrames(() => !!pivotTable.dataFrame, 600);

    // when
    pivotTable.loadConfig(pivotTable.configRecords.find(r => r.name === 'legacy pivot'));
    await DomMetrics.waitFrames(() => !!fixture.nativeElement.querySelector('.pvtColLabel') && !pivotTable.computing, 600);

    // then
    const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.pvtColLabel')).map(e => e.textContent);
    expect(headers).toEqual(['ERROR', 'INFO', 'WARN']);
    fixture.destroy();
  }, TIMEOUT);

  it('should keep single view when dashboard is saved under same name in flex and grid layout', async () => {

    // given
    const viewPersistenceService = TestBed.inject(ViewPersistenceService);
    const flexView = legacyView(Route.FLEX, 'x', 3, summaryElement(1, 1));
    await viewPersistenceService.saveView(scene, flexView);

    // when
    await viewPersistenceService.saveView(scene, legacyView(Route.GRID, 'x', 3, summaryElement(1, 1)));

    // then
    const persistedScene = await run.db.findScene(scene._id);
    expect(persistedScene.config.views.map(v => v.name + ':' + v.route)).toEqual(['x:' + Route.GRID]);
  }, TIMEOUT);

  it('should save open tabs with stale revision', async () => {

    // given
    const doc: SceneTabs = { _id: DBService.sceneTabsId(scene._id), tabs: [] };
    await run.db.saveSceneTabs(doc);
    const staleDoc: SceneTabs = { ...doc, tabs: [{ id: 'tab1', type: ViewType.PIVOT, title: 'stale' }] };
    await run.db.saveSceneTabs({ ...doc, tabs: [{ id: 'tab1', type: ViewType.PIVOT, title: 'other window' }] });

    // when
    await run.db.saveSceneTabs(staleDoc);

    // then
    const persisted = await run.db.findSceneTabs(scene._id);
    expect(persisted.tabs[0].title).toBe('stale');
  }, TIMEOUT);

  it('should delete open tabs together with scene', async () => {

    // given
    await run.db.saveSceneTabs({ _id: DBService.sceneTabsId(scene._id), tabs: [] });

    // when
    await run.db.deleteScene(scene);

    // then
    await expect(run.db.findSceneTabs(scene._id)).resolves.toBeUndefined();
  }, TIMEOUT);

  describe('with desktop viewport', () => {

    beforeAll(() => page.viewport(1280, 800));

    afterAll(() => page.viewport(414, 896));

    it('should render chart after switching layout', async () => {

      // given
      const fixture = TestBed.createComponent(DashboardComponent);
      fixture.autoDetectChanges();
      const dashboard = fixture.componentInstance;
      expect(await DomMetrics.waitFrames(() => !!dashboard.entries && !dashboard.loading, 600)).toBe(true);
      const context = dashboard.addChart();
      fixture.detectChanges();
      context.aggregations = [Aggregation.COUNT];
      context.dataColumns = [context.columns.find(c => c.name === 'Level')];
      expect(await DomMetrics.waitFrames(() => !!context.chart, 600)).toBe(true);

      // when
      dashboard.setLayout(Route.FLEX);
      fixture.detectChanges();

      // then
      const flexContext = dashboard.elementContexts[0] as ChartContext;
      await DomMetrics.waitFrames(() => !!flexContext.chart, 600);
      expect(flexContext.chart).toBeDefined();
      fixture.destroy();
    }, TIMEOUT);
  });

  it('should restore query of pivot tab', async () => {

    // given
    const query = new Query();
    query.setFullTextFilter('INFO');
    const service = await readyTabsService();
    await service.addTab(ViewType.PIVOT);
    const tab = service.tabs[0];
    tab.record = {
      route: Route.PIVOT, name: tab.title, modifiedTime: 0, query: queryToQueryDef(query),
      data: {
        timeColumns: [], negativeColor: '#FF3333', positiveColor: '#00FF00', showRowTotals: true, showColumnTotals: true,
        valueGroupings: [], pivotOptions: { rendererName: 'Table', cols: ['Level'], rows: [] }
      }
    };
    const fixture = TestBed.createComponent(PivotTableComponent);
    fixture.componentInstance.tab = tab;

    // when
    fixture.autoDetectChanges();
    await DomMetrics.waitFrames(() => !!fixture.nativeElement.querySelector('.pvtTable') && !fixture.componentInstance.computing, 600);

    // then
    const headers = Array.from<HTMLElement>(fixture.nativeElement.querySelectorAll('.pvtColLabel')).map(e => e.textContent);
    expect(headers).toEqual(['INFO']);
    fixture.destroy();
  }, TIMEOUT);
});
