import { Router } from '@angular/router';
import { AppRouteReuseStrategy } from 'app/app-route-reuse-strategy';
import { Aggregation, Column, DataType, Route, Scene } from '../../model';
import { ConfigRecord, ElementType, SceneTabs, TabContent, TabDef, View, ViewType } from '../../model/view-config';
import { SceneFactory } from '../../test';
import { DBService } from '../backend';
import { TabContentProvider } from './tab-content-provider.type';
import { createTabDef } from './tab-defs';
import { TabsPersister } from './tabs-persister';
import { ViewTabsService } from './view-tabs.service';
import type { Mock } from 'vitest';

describe('ViewTabsService', () => {

   let scene: Scene;
   let dbService: DBService;
   let persister: TabsPersister;
   let routeReuseStrategy: AppRouteReuseStrategy;
   let router: Router;
   let getActiveSceneSpy: Mock;
   let findSceneTabsSpy: Mock;
   let service: ViewTabsService;

   beforeEach(() => {
      scene = SceneFactory.createScene('s1', []);
      dbService = new DBService(null);
      getActiveSceneSpy = vi.spyOn(dbService, 'getActiveScene').mockReturnValue(scene);
      findSceneTabsSpy = vi.spyOn(dbService, 'findSceneTabs').mockResolvedValue(undefined);
      persister = {
         reset: vi.fn(), request: vi.fn(), persistNow: vi.fn(), flush: vi.fn(), cancel: vi.fn(), reportError: vi.fn()
      } as unknown as TabsPersister;
      routeReuseStrategy = new AppRouteReuseStrategy();
      vi.spyOn(routeReuseStrategy, 'evict').mockReturnValue(undefined);
      router = { navigateByUrl: vi.fn().mockResolvedValue(true), routeReuseStrategy } as unknown as Router;
      service = new ViewTabsService(dbService, persister, router);
   });

   it('#ready should be false while tabs are loading', () => {

      // when
      const ready = service.ready;

      // then
      expect(ready).toBe(false);
      expect(service.tabs).toEqual([]);
   });

   it('#tabs should be loaded from persisted scene tabs', async () => {

      // given
      const doc = sceneTabs(createTabDef(ViewType.PIVOT, 1), createTabDef(ViewType.DASHBOARD, 4));
      findSceneTabsSpy.mockResolvedValue(doc);

      // when
      await loaded();

      // then
      expect(findSceneTabsSpy).toHaveBeenCalledWith('s1');
      expect(service.tabs).toBe(doc.tabs);
      expect(service.ready).toBe(true);
      expect(persister.reset).toHaveBeenCalledWith(doc);
   });

   it('#tabs should be empty and new document be prepared when none is persisted', async () => {

      // when
      await loaded();

      // then
      expect(service.tabs).toEqual([]);
      expect(persister.reset).toHaveBeenCalledWith({ _id: 's1_tabs', tabs: [] });
   });

   it('#tabs should report load error and stay not ready', async () => {

      // given
      findSceneTabsSpy.mockRejectedValue('offline');

      // when
      await loaded();

      // then
      expect(service.ready).toBe(false);
      expect(persister.reportError).toHaveBeenCalledWith('Open tabs cannot be loaded: ', 'offline');
   });

   it('#tabs should be empty when no scene is active', () => {

      // given
      getActiveSceneSpy.mockReturnValue(undefined);

      // when
      const tabs = service.tabs;

      // then
      expect(tabs).toEqual([]);
      expect(findSceneTabsSpy).not.toHaveBeenCalled();
   });

   it('#tabs should ignore late load result of previous scene', async () => {

      // given
      let resolveFirstLoad: (doc: SceneTabs) => void;
      findSceneTabsSpy.mockReturnValueOnce(new Promise(resolve => resolveFirstLoad = resolve));
      syncScene();
      getActiveSceneSpy.mockReturnValue(SceneFactory.createScene('s2', []));
      await loaded();

      // when
      resolveFirstLoad(sceneTabs(createTabDef(ViewType.PIVOT, 1)));
      await Promise.resolve();

      // then
      expect(service.tabs).toEqual([]);
      expect(persister.reset).toHaveBeenCalledTimes(1);
      expect(persister.reset).toHaveBeenCalledWith({ _id: 's2_tabs', tabs: [] });
   });

   it('#tabs should flush pending persist of previous scene on scene switch', async () => {

      // given
      await loaded();
      vi.clearAllMocks();

      // when
      getActiveSceneSpy.mockReturnValue(SceneFactory.createScene('s2', []));
      syncScene();

      // then
      expect(persister.flush).toHaveBeenCalled();
      expect(persister.cancel).not.toHaveBeenCalled();
   });

   it('#tabs should cancel pending persist when active scene was deleted', async () => {

      // given
      await loaded();
      vi.clearAllMocks();

      // when
      getActiveSceneSpy.mockReturnValue(undefined);
      syncScene();

      // then
      expect(persister.cancel).toHaveBeenCalled();
      expect(persister.flush).not.toHaveBeenCalled();
   });

   it('#findTab should return tab with matching id', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();

      // when
      const found = service.findTab('tab1');

      // then
      expect(found).toBe(tab);
   });

   it('#addTab should add tab with next sequence and unnumbered title, persist and navigate to it', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.PIVOT, 3)));
      await loaded();

      // when
      await service.addTab(ViewType.DASHBOARD);

      // then
      expect(service.tabs[1]).toEqual({ id: 'tab4', type: ViewType.DASHBOARD, title: 'Dashboard' });
      expect(persistedSnapshot()).toBe(service.tabs);
      expect(router.navigateByUrl).toHaveBeenCalledWith('/view/tab4');
   });

   it('#addTab should number second tab of same type', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.DASHBOARD, 1)));
      await loaded();

      // when
      await service.addTab(ViewType.DASHBOARD);

      // then
      expect(service.tabs[1]).toEqual({ id: 'tab2', type: ViewType.DASHBOARD, title: 'Dashboard 2' });
   });

   it('#addTab should not persist when not ready', async () => {

      // when
      await service.addTab(ViewType.DASHBOARD);

      // then
      expect(persister.persistNow).not.toHaveBeenCalled();
   });

   it('#renameTab should change title and persist', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();

      // when
      service.renameTab(tab, 'Sales');

      // then
      expect(tab.title).toBe('Sales');
      expect(persister.persistNow).toHaveBeenCalled();
   });

   it('#closeTab should remove inactive tab, persist and evict it without navigation', async () => {

      // given
      const tab1 = createTabDef(ViewType.PIVOT, 1);
      const tab2 = createTabDef(ViewType.DASHBOARD, 2);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab1, tab2));
      await loaded();

      // when
      await service.closeTab(tab1, '/view/tab2');

      // then
      expect(service.tabs).toEqual([tab2]);
      expect(persistedSnapshot()).toEqual([tab2]);
      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(routeReuseStrategy.evict).toHaveBeenCalledWith('view/tab1');
   });

   it('#closeTab should navigate to next tab when active tab is closed', async () => {

      // given
      const tab1 = createTabDef(ViewType.PIVOT, 1);
      const tab2 = createTabDef(ViewType.DASHBOARD, 2);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab1, tab2));
      await loaded();

      // when
      await service.closeTab(tab1, '/view/tab1');

      // then
      expect(router.navigateByUrl).toHaveBeenCalledWith('/view/tab2');
      expect(routeReuseStrategy.evict).toHaveBeenCalledWith('view/tab1');
   });

   it('#closeTab should navigate to previous tab when active last tab is closed', async () => {

      // given
      const tab1 = createTabDef(ViewType.PIVOT, 1);
      const tab2 = createTabDef(ViewType.DASHBOARD, 2);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab1, tab2));
      await loaded();

      // when
      await service.closeTab(tab2, '/view/tab2');

      // then
      expect(router.navigateByUrl).toHaveBeenCalledWith('/view/tab1');
   });

   it('#closeTab should navigate to raw data when only active tab is closed', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();

      // when
      await service.closeTab(tab, '/view/tab1');

      // then
      expect(router.navigateByUrl).toHaveBeenCalledWith('/' + Route.RAWDATA);
      expect(service.tabs).toEqual([]);
   });

   it('#closeTab should drop provider of closed tab', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();
      const provider = contentProvider({ record: pivotRecord() });
      service.register('tab1', provider);

      // when
      await service.closeTab(tab, '/rawdata');

      // then
      expect(service.layoutOf(tab)).toBeUndefined();
   });

   it('#currentTab should merge content of registered provider', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();
      const record = pivotRecord();
      service.register('tab1', contentProvider({ record }));

      // when
      const current = service.currentTab(tab);

      // then
      expect(current).toEqual({ ...tab, record });
      expect(tab.record).toBeUndefined();
   });

   it('#currentTab should return copy of tab when no provider is registered', () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);

      // when
      const current = service.currentTab(tab);

      // then
      expect(current).toEqual(tab);
   });

   it('#layoutOf should return layout of registered provider', () => {

      // given
      const tab = createTabDef(ViewType.DASHBOARD, 1);
      service.register('tab1', contentProvider({}, Route.FLEX));

      // when
      const layout = service.layoutOf(tab);

      // then
      expect(layout).toBe(Route.FLEX);
   });

   it('#unregister should keep last content of provider', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();
      const record = pivotRecord();
      const provider = contentProvider({ record });
      service.register('tab1', provider);

      // when
      service.unregister('tab1', provider);

      // then
      expect(tab.record).toBe(record);
      expect(service.layoutOf(tab)).toBeUndefined();
   });

   it('#unregister should ignore provider that is not registered for the tab', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();
      const provider = contentProvider({ record: pivotRecord() }, Route.PIVOT);
      service.register('tab1', provider);

      // when
      service.unregister('tab1', contentProvider({}));

      // then
      expect(tab.record).toBeUndefined();
      expect(service.layoutOf(tab)).toBe(Route.PIVOT);
   });

   it('#unregister should ignore provider of unknown tab', () => {

      // given
      const provider = contentProvider({ record: pivotRecord() }, Route.PIVOT);
      service.register('tab9', provider);

      // when
      service.unregister('tab9', provider);

      // then
      expect(service.layoutOf(createTabDef(ViewType.PIVOT, 9))).toBeUndefined();
   });

   it('#requestPersist should be ignored when not ready', () => {

      // when
      service.requestPersist();

      // then
      expect(persister.request).not.toHaveBeenCalled();
   });

   it('#requestPersist should request persisting snapshot with current provider content', async () => {

      // given
      const tab = createTabDef(ViewType.PIVOT, 1);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(tab));
      await loaded();
      const record = pivotRecord();
      service.register('tab1', contentProvider({ record }));

      // when
      service.requestPersist();

      // then
      const snapshot: () => TabDef[] = vi.mocked(persister.request).mock.lastCall[0];
      expect(snapshot()).toEqual([{ ...tab, record }]);
      expect(tab.record).toBe(record);
   });

   it('#renameColumn should rename column in views of tabs and request persist', async () => {

      // given
      const dashboardTab: TabDef = { ...createTabDef(ViewType.DASHBOARD, 1), view: dashboardView() };
      const pivotTab = createTabDef(ViewType.PIVOT, 2);
      findSceneTabsSpy.mockResolvedValue(sceneTabs(dashboardTab, pivotTab));
      await loaded();

      // when
      service.renameColumn('Share', 'Ratio');

      // then
      expect(dashboardTab.view.elements[0].dataColumns.map(c => c.name)).toEqual(['Ratio', 'Amount']);
      expect(pivotTab.view).toBeUndefined();
      expect(persister.request).toHaveBeenCalled();
   });

   it('#replaceTabs should replace tabs and persist them', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.PIVOT, 1)));
      await loaded();
      const tabs = [createTabDef(ViewType.DASHBOARD, 2)];

      // when
      service.replaceTabs(tabs);

      // then
      expect(service.tabs).toBe(tabs);
      expect(persistedSnapshot()).toBe(tabs);
   });

   it('#replaceTabs should evict routes of replaced and new tabs once', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.PIVOT, 1), createTabDef(ViewType.PIVOT, 2)));
      await loaded();

      // when
      service.replaceTabs([createTabDef(ViewType.DASHBOARD, 2), createTabDef(ViewType.DASHBOARD, 3)]);

      // then
      expect(vi.mocked(routeReuseStrategy.evict).mock.calls).toEqual([['view/tab1'], ['view/tab2'], ['view/tab3']]);
   });

   it('#replaceTabs should not let unregistered provider of replaced tab overwrite new tab of same id', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.PIVOT, 1)));
      await loaded();
      const provider = contentProvider({ record: pivotRecord() });
      service.register('tab1', provider);
      const newTab = createTabDef(ViewType.DASHBOARD, 1);

      // when
      service.replaceTabs([newTab]);
      service.unregister('tab1', provider);

      // then
      expect(newTab.record).toBeUndefined();
      expect(service.currentTab(newTab)).toEqual(newTab);
   });

   it('#replaceTabs should continue sequence after highest restored tab', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.PIVOT, 1)));
      await loaded();

      // when
      service.replaceTabs([createTabDef(ViewType.DASHBOARD, 5)]);

      // then
      await service.addTab(ViewType.PIVOT);
      expect(service.tabs[1].id).toBe('tab6');
   });

   it('#replaceTabs should keep sequence when restored tabs have lower numbers', async () => {

      // given
      findSceneTabsSpy.mockResolvedValue(sceneTabs(createTabDef(ViewType.PIVOT, 4)));
      await loaded();

      // when
      service.replaceTabs([createTabDef(ViewType.DASHBOARD, 1)]);

      // then
      await service.addTab(ViewType.PIVOT);
      expect(service.tabs[1].id).toBe('tab5');
   });

   it('#replaceTabs should not persist when tabs are not ready', () => {

      // when
      service.replaceTabs([createTabDef(ViewType.DASHBOARD, 1)]);

      // then
      expect(persister.persistNow).not.toHaveBeenCalled();
   });

   it('#evict should evict route of tab', () => {

      // when
      service.evict('tab3');

      // then
      expect(routeReuseStrategy.evict).toHaveBeenCalledWith('view/tab3');
   });

   function syncScene(): TabDef[] {
      return service.tabs;
   }

   async function loaded(): Promise<void> {
      syncScene();
      await new Promise(resolve => setTimeout(resolve));
   }

   function persistedSnapshot(): TabDef[] {
      const snapshot: () => TabDef[] = vi.mocked(persister.persistNow).mock.lastCall[0];
      return snapshot();
   }

   function sceneTabs(...tabs: TabDef[]): SceneTabs {
      return { _id: 's1_tabs', _rev: '1-a', tabs };
   }

   function dashboardView(): View {
      const element = {
         elementType: ElementType.SUMMARY, title: 'Summary', gridColumnSpan: 1, gridRowSpan: 1, width: 300, height: 300,
         dataColumns: [numberColumn('Share'), numberColumn('Amount')], splitColumns: [], groupByColumns: [],
         aggregations: [Aggregation.AVG], valueGroupings: [], colorOptions: undefined
      };
      return { route: Route.GRID, name: 'Dashboard', modifiedTime: 0, query: null, gridColumns: 2, gridCellRatio: '1:1', elements: [element] };
   }

   function numberColumn(name: string): Column {
      return { name, dataType: DataType.NUMBER, width: 10 };
   }

   function pivotRecord(): ConfigRecord {
      return { route: Route.PIVOT, name: 'Pivot Table 1', modifiedTime: 0, query: null, data: { pivotOptions: { cols: ['Level'] } } };
   }

   function contentProvider(content: TabContent, layout = Route.PIVOT): TabContentProvider {
      return { tabContent: () => content, layout: () => layout };
   }
});
