import { AppRouteReuseStrategy } from './app-route-reuse-strategy';
import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Route } from './shared/model';
import { DebugElement } from '@angular/core';

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
      expect(shouldAttach).toBeFalse();
   });

   it('#shouldDetach should return true for cached route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.GRID);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const shouldAttach = strategy.shouldDetach(routeSnapshot);

      // then
      expect(shouldAttach).toBeTrue();
   });

   it('#shouldAttach should return false for non-stored route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.SCENE);

      // when
      const shouldAttach = strategy.shouldAttach(routeSnapshot);

      // then
      expect(shouldAttach).toBeFalse();
   });

   it('#shouldAttach should return true for stored route', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.PIVOT);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const shouldAttach = strategy.shouldAttach(routeSnapshot);

      // then
      expect(shouldAttach).toBeTrue();
   });

   it('#shouldAttach should remove stale tooltips', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.PIVOT);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);
      document.body.appendChild(document.createElement('mat-tooltip-component'));
      expect(document.getElementsByTagName('mat-tooltip-component').length).toBe(1);

      // when
      strategy.shouldAttach(routeSnapshot);

      // then
      expect(document.getElementsByTagName('mat-tooltip-component').length).toBe(0);
   });


   it('#retrieve should return undefined when detached route handle is not stored', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.PIVOT);

      // when
      const handle = strategy.retrieve(routeSnapshot);

      // then
      expect(handle).toBeUndefined();
   });

   it('#retrieve should return detached route handle when it is stored', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.PIVOT);
      const routeHandle: DetachedRouteHandle = {};
      strategy.store(routeSnapshot, routeHandle);

      // when
      const handle = strategy.retrieve(routeSnapshot);

      // then
      expect(handle).toBe(routeHandle);
   });

   it('#shouldReuseRoute should return false when route configs are different', () => {

      // given
      const futureRouteSnapshot = createActivatedRouteSnapshot(Route.PIVOT);
      const currentRouteSnapshot = createActivatedRouteSnapshot(Route.RAWDATA);

      // when
      const reuse = strategy.shouldReuseRoute(futureRouteSnapshot, currentRouteSnapshot);

      // then
      expect(reuse).toBeFalse();
   });

   it('#shouldReuseRoute should return true when route configs are same', () => {

      // given
      const routeSnapshot = createActivatedRouteSnapshot(Route.PIVOT);

      // when
      const reuse = strategy.shouldReuseRoute(routeSnapshot, routeSnapshot);

      // then
      expect(reuse).toBeTrue();
   });

   it('#clear should remove stored routes', () => {

      // given
      const gridRouteSnapshot = createActivatedRouteSnapshot(Route.GRID);
      strategy.store(gridRouteSnapshot, {});
      const pivotRouteSnapshot = createActivatedRouteSnapshot(Route.PIVOT);
      strategy.store(pivotRouteSnapshot, {});

      // when
      strategy.clear();

      // then
      expect(strategy.retrieve(gridRouteSnapshot)).toBeUndefined();
      expect(strategy.retrieve(pivotRouteSnapshot)).toBeUndefined();
   });

   function createActivatedRouteSnapshot(route: Route): ActivatedRouteSnapshot {
      return <ActivatedRouteSnapshot>{
         routeConfig: {
            path: route
         }
      };
   }
});
