import { LanguageService } from '../language';
import { Injectable } from '@angular/core';
import { ConfigRecord } from 'app/shared/model/view-config';
import { Query, Route, Scene, Status, StatusType } from '../../model';
import { View } from '../../model/view-config/view.type';
import { ArrayUtils } from '../../utils';
import { DBService } from '../backend';
import { createConfigRecord } from './config-record-factory';

@Injectable({
   providedIn: 'root'
})
export class ViewPersistenceService {

   private static readonly DASHBOARD_ROUTES = [Route.GRID, Route.FLEX];

   constructor(private dbService: DBService) { }

   /**
    * @returns matching [[ConfigRecord]]s descending sorted by their modified time
    */
   findRecords(scene: Scene, route: Route): ConfigRecord[] {
      return scene.config.records
         .filter(v => v.route === route)
         .sort((r1, r2) => r2.modifiedTime - r1.modifiedTime);
   }

   /**
    * adds or replaces the specified view configuration data for the [[Scene]] and updates it in the backing datastore.
    *
    * @returns a promise that provides the resolved processing status (success or error), hence there's no need for the
    * invoking part to catch errors
    */
   saveRecord(scene: Scene, route: Route, viewName: string, query: Query, data: ConfigRecord['data']): Promise<Status> {
      const newRecord = createConfigRecord(route, viewName, query, data, new Date().getTime());
      this.addOrReplace(scene.config.records, newRecord, r => r === route);
      return this.updateScene(scene, LanguageService.instant('view.saved', { name: viewName }),
         e => LanguageService.instant('view.notSaved', { name: viewName, error: e }));
   }

   /**
    * @returns [[View]]s of the same route family (grid and flex views form a family) descending sorted by their modified time
    */
   findViews(scene: Scene, route: Route): View[] {
      return scene.config.views
         .filter(v => this.isSameFamily(v.route, route))
         .sort((v1, v2) => v2.modifiedTime - v1.modifiedTime);
   }

   /**
    * adds the specified [[View]] or replaces the one with the same name and route family, then updates the [[Scene]] in the
    * backing datastore.
    *
    * @returns a promise that provides the resolved processing status (success or error), hence there's no need for the
    * invoking part to catch errors
    */
   saveView(scene: Scene, view: View): Promise<Status> {
      this.addOrReplace(scene.config.views, view, r => this.isSameFamily(r, view.route));
      return this.updateScene(scene, LanguageService.instant('view.saved', { name: view.name }),
         e => LanguageService.instant('view.notSaved', { name: view.name, error: e }));
   }

   private addOrReplace<T extends { route: Route, name: string }>(items: T[], item: T, sameRoute: (route: Route) => boolean): void {
      const prevItem = items.find(i => sameRoute(i.route) && i.name === item.name);
      if (prevItem) {
         ArrayUtils.replaceElement(items, prevItem, item);
      } else {
         items.push(item);
      }
   }

   private isSameFamily(route1: Route, route2: Route): boolean {
      const dashboardRoutes = ViewPersistenceService.DASHBOARD_ROUTES;
      return route1 === route2 || (dashboardRoutes.includes(route1) && dashboardRoutes.includes(route2));
   }

   /**
    * removes the deleted [[ConfigRecord]]s from the [[Scene]] and updates it in the backing datastore, renamed records are
    * expected to be renamed in place
    *
    * @returns a promise that provides the resolved processing status (success or error)
    */
   updateRecords(scene: Scene, deletedRecords: ConfigRecord[], renamedRecords: ConfigRecord[]): Promise<Status> {
      scene.config.records = this.without(scene.config.records, deletedRecords);
      return this.updateScene(scene, this.updateMessage(deletedRecords.length, renamedRecords.length),
         e => LanguageService.instant('view.notUpdated', { error: e }));
   }

   /**
    * removes the deleted [[View]]s from the [[Scene]] and updates it in the backing datastore, renamed views are expected
    * to be renamed in place
    *
    * @returns a promise that provides the resolved processing status (success or error)
    */
   updateViews(scene: Scene, deletedViews: View[], renamedViews: View[]): Promise<Status> {
      scene.config.views = this.without(scene.config.views, deletedViews);
      return this.updateScene(scene, this.updateMessage(deletedViews.length, renamedViews.length),
         e => LanguageService.instant('view.notUpdated', { error: e }));
   }

   private without<T>(items: T[], removedItems: T[]): T[] {
      return items.filter(i => !removedItems.includes(i));
   }

   private updateMessage(deletedCount: number, renamedCount: number): string {
      const message: string[] = [];
      if (deletedCount) {
         message.push(LanguageService.instant(deletedCount === 1 ? 'view.deletedOne' : 'view.deleted', { count: deletedCount }));
      }
      if (renamedCount) {
         message.push(LanguageService.instant(renamedCount === 1 ? 'view.renamedOne' : 'view.renamed', { count: renamedCount }));
      }
      return message.join('\n');
   }

   private updateScene(scene: Scene, successMsg: string, errorMsg: (error: string) => string): Promise<Status> {
      return this.dbService.updateScene(scene)
         .then((): Status => ({ type: StatusType.SUCCESS, msg: successMsg }))
         .catch((e): Status => ({ type: StatusType.ERROR, msg: errorMsg(typeof e === 'string' ? e : e.message) }));
   }
}
