import { RouteReuseStrategy, Params } from '@angular/router/';
import { ActivatedRouteSnapshot, DetachedRouteHandle } from '@angular/router';
import { Route } from './shared/model';

export class AppRouteReuseStrategy implements RouteReuseStrategy {

   private static readonly NON_CACHED_ROUTES = [Route.SCENES.toString(), Route.SCENE.toString()];

   private routeHandlesCache = new Map<string, DetachedRouteHandle>();
   private rawDataLastQueryParams: Params;

   shouldDetach(route: ActivatedRouteSnapshot): boolean {
      return true;
   }

   store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
      this.routeHandlesCache.set(this.pathOf(route), detachedTree);
   }

   shouldAttach(route: ActivatedRouteSnapshot): boolean {
      this.removeStaleTooltips();
      const path = route.routeConfig.path;
      if (AppRouteReuseStrategy.NON_CACHED_ROUTES.includes(path)) {
         return false;
      }
      if (path === Route.RAWDATA) {
         if (this.rawDataLastQueryParams && JSON.stringify(route.queryParams) !== JSON.stringify(this.rawDataLastQueryParams)) {
            return false;
         }
         this.rawDataLastQueryParams = route.queryParams;
      }
      return this.routeHandlesCache.has(this.pathOf(route));
   }

   /**
    * workaround for problem https://github.com/angular/material2/issues/11478
    */
   private removeStaleTooltips() {
      const tooltips = document.getElementsByTagName('mat-tooltip-component');
      for (let i = 0; i < tooltips.length; i++) {
         tooltips[i].remove();
      }
      d3.selectAll('.nvtooltip').style('opacity', '0');
   }

   retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
      return this.routeHandlesCache.get(this.pathOf(route)) as DetachedRouteHandle;
   }

   shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
      return future.routeConfig === curr.routeConfig;
   }

   private pathOf(route: ActivatedRouteSnapshot): string {
      if (route.routeConfig !== null && route.routeConfig.path !== null) {
         return route.routeConfig.path;
      }
      return '';
   }

   clear() {
      this.routeHandlesCache.clear();
   }
}
