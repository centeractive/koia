import { ActivatedRouteSnapshot, DefaultUrlSerializer, DetachedRouteHandle, UrlSegment } from '@angular/router';
import { AppRouteReuseStrategy } from './app-route-reuse-strategy';
import { Route } from './shared/model';
import { SceneFactory } from 'app/shared/test';

describe('AppRouteReuseStrategy', () => {

   let strategy: AppRouteReuseStrategy;

   beforeEach(() => {
      strategy = new AppRouteReuseStrategy();
   });

   it('#shouldDetach should return false for non-cached route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.SCENE);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const shouldAttach = strategy.shouldDetach(routeSnapshot);

      // then
      expect(shouldAttach).toBe(false);
   });

   it('#shouldDetach should return true for cached route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const shouldAttach = strategy.shouldDetach(routeSnapshot);

      // then
      expect(shouldAttach).toBe(true);
   });

   it('#shouldDetach should return true for view tab route', () => {

      // when
      const shouldAttach = strategy.shouldDetach(createViewTabRouteSnapshot('tab1'));

      // then
      expect(shouldAttach).toBe(true);
   });

   it('#shouldAttach should return false for non-stored route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.SCENE);

      // when
      const shouldAttach = strategy.shouldAttach(routeSnapshot);

      // then
      expect(shouldAttach).toBe(false);
   });

   it('#shouldAttach should return true for stored route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const shouldAttach = strategy.shouldAttach(routeSnapshot);

      // then
      expect(shouldAttach).toBe(true);
   });

   it('#shouldAttach should return false for view tab with other id than the stored one', () => {

      // given
      strategy.store(createViewTabRouteSnapshot('tab1'), {});

      // when
      const shouldAttach = strategy.shouldAttach(createViewTabRouteSnapshot('tab2'));

      // then
      expect(shouldAttach).toBe(false);
   });

   it('#shouldAttach should remove stale tooltips', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);
      document.body.appendChild(document.createElement('mat-tooltip-component'));
      expect(document.getElementsByTagName('mat-tooltip-component').length).toBe(1);

      // when
      strategy.shouldAttach(routeSnapshot);

      // then
      expect(document.getElementsByTagName('mat-tooltip-component').length).toBe(0);
   });

   it('#shouldAttach should remove all of several stale tooltips', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      strategy.store(routeSnapshot, {});
      for (let i = 0; i < 3; i++) {
         document.body.appendChild(document.createElement('mat-tooltip-component'));
      }

      // when
      strategy.shouldAttach(routeSnapshot);

      // then
      expect(document.getElementsByTagName('mat-tooltip-component').length).toBe(0);
   });

   it('#retrieve should return undefined when detached route handle is not stored', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);

      // when
      const handle = strategy.retrieve(routeSnapshot);

      // then
      expect(handle).toBeUndefined();
   });

   it('#retrieve should return detached route handle when it is stored', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const handle = strategy.retrieve(routeSnapshot);

      // then
      expect(handle).toBe(routeHandle);
   });

   it('#retrieve should return detached route handle of matching view tab', () => {

      // given
      const tab1Handle: DetachedRouteHandle = {};
      const tab2Handle: DetachedRouteHandle = {};
      strategy.store(createViewTabRouteSnapshot('tab1'), tab1Handle);
      strategy.store(createViewTabRouteSnapshot('tab2'), tab2Handle);

      // when
      const handle = strategy.retrieve(createViewTabRouteSnapshot('tab2'));

      // then
      expect(handle).toBe(tab2Handle);
   });

   it('#retrieve should use empty path for route without config', () => {

      // given
      const routeSnapshot = { routeConfig: null, url: [] } as ActivatedRouteSnapshot;
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const handle = strategy.retrieve(routeSnapshot);

      // then
      expect(handle).toBe(routeHandle);
   });

   it('#shouldReuseRoute should return false when route configs are different', () => {

      // given
      const futureRouteSnapshot = createViewTabRouteSnapshot('tab1');
      const currentRouteSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);

      // when
      const reuse = strategy.shouldReuseRoute(futureRouteSnapshot, currentRouteSnapshot);

      // then
      expect(reuse).toBe(false);
   });

   it('#shouldReuseRoute should return true when route configs are same', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);

      // when
      const reuse = strategy.shouldReuseRoute(routeSnapshot, routeSnapshot);

      // then
      expect(reuse).toBe(true);
   });

   it('#shouldReuseRoute should return false when view tab ids are different', () => {

      // given
      const routeConfig = { path: Route.VIEW + '/:id' };
      const futureRouteSnapshot = createViewTabRouteSnapshot('tab1', routeConfig);
      const currentRouteSnapshot = createViewTabRouteSnapshot('tab2', routeConfig);

      // when
      const reuse = strategy.shouldReuseRoute(futureRouteSnapshot, currentRouteSnapshot);

      // then
      expect(reuse).toBe(false);
   });

   it('#evict should destroy and remove stored handle', () => {

      // given
      const routeSnapshot = createViewTabRouteSnapshot('tab1');
      const routeHandle = createDestroyableRouteHandle();
      strategy.store(routeSnapshot, routeHandle);

      // when
      strategy.evict('view/tab1');

      // then
      expect(routeHandle['componentRef'].destroy).toHaveBeenCalled();
      expect(strategy.retrieve(routeSnapshot)).toBeUndefined();
   });

   it('#evict should remove null handle', () => {

      // given
      const routeSnapshot = createViewTabRouteSnapshot('tab1');
      strategy.store(routeSnapshot, null);

      // when
      strategy.evict('view/tab1');

      // then
      expect(strategy.shouldAttach(routeSnapshot)).toBe(false);
   });

   it('#evict should ignore unknown path', () => {

      // given
      const routeSnapshot = createViewTabRouteSnapshot('tab1');
      const routeHandle = createDestroyableRouteHandle();
      strategy.store(routeSnapshot, routeHandle);

      // when
      strategy.evict('view/tab2');

      // then
      expect(routeHandle['componentRef'].destroy).not.toHaveBeenCalled();
      expect(strategy.retrieve(routeSnapshot)).toBe(routeHandle);
   });

   it('#clear should destroy and remove stored routes', () => {

      // given
      const rawDataRouteSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const rawDataRouteHandle = createDestroyableRouteHandle();
      strategy.store(rawDataRouteSnapshot, rawDataRouteHandle);
      const tabRouteSnapshot = createViewTabRouteSnapshot('tab1');
      const tabRouteHandle = createDestroyableRouteHandle();
      strategy.store(tabRouteSnapshot, tabRouteHandle);

      // when
      strategy.clear();

      // then
      expect(rawDataRouteHandle['componentRef'].destroy).toHaveBeenCalled();
      expect(tabRouteHandle['componentRef'].destroy).toHaveBeenCalled();
      expect(strategy.retrieve(rawDataRouteSnapshot)).toBeUndefined();
      expect(strategy.retrieve(tabRouteSnapshot)).toBeUndefined();
   });

   it('#clearIfSceneChanged should destroy stored routes when active scene changed', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const routeHandle = createDestroyableRouteHandle();
      strategy.store(routeSnapshot, routeHandle);

      // when
      strategy.clearIfSceneChanged(SceneFactory.createScene('1', []), undefined);

      // then
      expect(routeHandle['componentRef'].destroy).toHaveBeenCalled();
      expect(strategy.retrieve(routeSnapshot)).toBeUndefined();
   });

   it('#clearIfSceneChanged should keep stored routes when scene is still active', () => {

      // given
      const scene = SceneFactory.createScene('1', []);
      const routeSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);
      const routeHandle = createDestroyableRouteHandle();
      strategy.store(routeSnapshot, routeHandle);

      // when
      strategy.clearIfSceneChanged(scene, scene);

      // then
      expect(routeHandle['componentRef'].destroy).not.toHaveBeenCalled();
      expect(strategy.retrieve(routeSnapshot)).toBe(routeHandle);
   });

   it('#isCached should be true for raw data and view tab urls', () => {

      // when
      const cached = ['/rawdata', '/view/tab1'].map(url => strategy.isCached(new DefaultUrlSerializer().parse(url)));

      // then
      expect(cached).toEqual([true, true]);
   });

   it('#isCached should be false for front, scenes and scene urls', () => {

      // when
      const cached = ['/front?x=1', '/scenes', '/scene'].map(url => strategy.isCached(new DefaultUrlSerializer().parse(url)));

      // then
      expect(cached).toEqual([false, false, false]);
   });

   it('#isCached should be false for root url', () => {

      // when
      const cached = strategy.isCached(new DefaultUrlSerializer().parse('/'));

      // then
      expect(cached).toBe(false);
   });

   function createActivatedRouteSnapshot(route: Route): ActivatedRouteSnapshot {
      return {
         routeConfig: {
            path: route
         },
         url: [new UrlSegment(route, {})]
      } as ActivatedRouteSnapshot;
   }

   function createViewTabRouteSnapshot(id: string, routeConfig = { path: Route.VIEW + '/:id' }): ActivatedRouteSnapshot {
      return {
         routeConfig,
         url: [new UrlSegment(Route.VIEW, {}), new UrlSegment(id, {})]
      } as ActivatedRouteSnapshot;
   }

   function createDestroyableRouteHandle(): DetachedRouteHandle {
      return {
         componentRef: { destroy: vi.fn() },
         route: { value: {} }
      };
   }
});
