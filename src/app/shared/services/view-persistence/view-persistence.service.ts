import { Injectable } from '@angular/core';
import { ConfigRecord } from 'app/shared/model/view-config';
import { Query, Route, Scene, Status, StatusType } from '../../model';
import { View } from '../../model/view-config/view.type';
import { ArrayUtils, StringUtils } from '../../utils';
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
   saveRecord(scene: Scene, route: Route, viewName: string, query: Query, data: any): Promise<Status> {
      const prevRecord = this.findRecord(scene, route, viewName);
      const newRecord = createConfigRecord(route, viewName, query, data, new Date().getTime());
      if (prevRecord) {
         ArrayUtils.replaceElement(scene.config.records, prevRecord, newRecord);
      } else {
         scene.config.records.push(newRecord);
      }
      return this.updateScene(scene, viewName);
   }

   private findRecord(scene: Scene, route: Route, name: string): ConfigRecord {
      return scene.config.records
         .filter(v => v.route === route)
         .find(v => v.name === name);
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
      const prevView = this.findView(scene, view.route, view.name);
      if (prevView) {
         ArrayUtils.replaceElement(scene.config.views, prevView, view);
      } else {
         scene.config.views.push(view);
      }
      return this.updateScene(scene, view.name);
   }

   private findView(scene: Scene, route: Route, name: string): View {
      return scene.config.views
         .filter(v => this.isSameFamily(v.route, route))
         .find(v => v.name === name);
   }

   private isSameFamily(route1: Route, route2: Route): boolean {
      const dashboardRoutes = ViewPersistenceService.DASHBOARD_ROUTES;
      return route1 === route2 || (dashboardRoutes.includes(route1) && dashboardRoutes.includes(route2));
   }

   /**
    * removes the deleted [[ConfigRecord]]s from the [[Scene]] and persists it, renamed records are expected to be renamed in place
    */
   updateRecords(scene: Scene, deletedRecords: ConfigRecord[], renamedRecords: ConfigRecord[]): Status {
      scene.config.records = this.withoutNamesOf(scene.config.records, deletedRecords);
      return this.persistUpdate(scene, deletedRecords.length, renamedRecords.length);
   }

   /**
    * removes the deleted [[View]]s from the [[Scene]] and persists it, renamed views are expected to be renamed in place
    */
   updateViews(scene: Scene, deletedViews: View[], renamedViews: View[]): Status {
      scene.config.views = this.withoutNamesOf(scene.config.views, deletedViews);
      return this.persistUpdate(scene, deletedViews.length, renamedViews.length);
   }

   private withoutNamesOf<T extends { name: string }>(items: T[], removedItems: T[]): T[] {
      const removedNames = removedItems.map(i => i.name);
      return items.filter(i => !removedNames.includes(i.name));
   }

   private persistUpdate(scene: Scene, deletedCount: number, renamedCount: number): Status {
      this.dbService.persistScene(scene, false);
      const message: string[] = [];
      if (deletedCount) {
         message.push('Deleted ' + deletedCount + StringUtils.pluralize(' view', deletedCount));
      }
      if (renamedCount) {
         message.push('Renamed ' + renamedCount + StringUtils.pluralize(' view', renamedCount));
      }
      return { type: StatusType.SUCCESS, msg: message.join('\n') };
   }

   private updateScene(scene: Scene, viewName: string): Promise<Status> {
      return new Promise<Status>(resolve => {
         this.dbService.updateScene(scene)
            .then(() => resolve({ type: StatusType.SUCCESS, msg: 'View "' + viewName + '" has been saved' }))
            .catch(e => {
               const message = typeof e === 'string' ? e : e.message;
               resolve({ type: StatusType.ERROR, msg: 'View "' + viewName + '" cannot be saved: ' + message });
            });
      });
   }
}
