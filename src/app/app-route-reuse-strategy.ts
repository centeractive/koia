import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { Route } from './shared/model';
import { Injectable } from '@angular/core';

@Injectable()
export class AppRouteReuseStrategy implements RouteReuseStrategy {

   private static readonly NON_CACHED_ROUTES = [Route.FRONT.toString(), Route.SCENES.toString(), Route.SCENE.toString()];

   private routeHandlesCache = new Map<string, DetachedRouteHandle>();

   /**
    * this method is invoked when we leave the current route. If it returns TRUE, then the [[store]] method will be invoked.
    */
   shouldDetach(route: ActivatedRouteSnapshot): boolean {
      return !AppRouteReuseStrategy.NON_CACHED_ROUTES.includes(route.routeConfig.path);
   }

   /**
    * this method is invoked only if [[shouldDetach]] returns TRUE.
    */
   store(route: ActivatedRouteSnapshot, detachedTree: DetachedRouteHandle): void {
      this.routeHandlesCache.set(this.pathOf(route), detachedTree);
   }

   /**
    * this method is called for the route just opened when we land on the component of this route. If this method
    * returns TRUE then [[retrieve]] method will be called, otherwise the component will be created from scratch
    */
   shouldAttach(route: ActivatedRouteSnapshot): boolean {
      this.removeStaleTooltips();
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

   /**
    * this method is called if [[shouldAttach]] returns TRUE, provides as parameter the current route (we just land)
    */
   retrieve(route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
      return this.routeHandlesCache.get(this.pathOf(route));
   }

   /**
    * This method is called everytime we navigate between routes. If it returns TRUE, routing will not happen (which means
    * that routing has not changed). If it returns FALSE, routing happens and the rest of the methods are called.
    */
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
