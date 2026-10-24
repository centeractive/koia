import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, destroyDetachedRouteHandle, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';
import { Route } from './shared/model';

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
   private removeStaleTooltips(): void {
      Array.from(document.getElementsByTagName('mat-tooltip-component')).forEach(tooltip => tooltip.remove());
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
      return future.routeConfig === curr.routeConfig && this.pathOf(future) === this.pathOf(curr);
   }

   /**
    * @returns the resolved path of the route (i.e. 'view/tab1' for route 'view/:id')
    */
   private pathOf(route: ActivatedRouteSnapshot): string {
      if (route.routeConfig) {
         return route.url.map(s => s.path).join('/');
      }
      return '';
   }

   /**
    * destroys the cached component of the specified path and removes it from the cache
    *
    * @param path resolved route path (i.e. 'view/tab1')
    */
   evict(path: string): void {
      const handle = this.routeHandlesCache.get(path);
      if (handle) {
         destroyDetachedRouteHandle(handle);
      }
      this.routeHandlesCache.delete(path);
   }

   clear(): void {
      [...this.routeHandlesCache.keys()].forEach(path => this.evict(path));
   }
}
