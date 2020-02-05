import { Scene, Status, StatusType, Route } from '../../model';
import { ArrayUtils } from '../../utils';
import { Injectable } from '@angular/core';
import { DBService } from '../backend';
import { View } from '../../model/view-config/view.type';
import { ConfigRecord } from 'app/shared/model/view-config';

@Injectable({
   providedIn: 'root'
})
export class ViewPersistenceService {

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
   saveRecord(scene: Scene, route: Route, viewName: string, data: any): Promise<Status> {
      const prevRecord = this.findRecord(scene, route, viewName);
      const newRecord: ConfigRecord = { route: route, name: viewName, modifiedTime: new Date().getTime(), data: data };
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
    * @returns matching [[View]]s descending sorted by their modified time
    */
   findViews(scene: Scene, route: Route): View[] {
      return scene.config.views
         .filter(v => v.route === route)
         .sort((v1, v2) => v2.modifiedTime - v1.modifiedTime);
   }

   /**
    * adds or replaces the specified [[View]] for the [[Scene]] and updates it in the backing datastore.
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
         .filter(v => v.route === route)
         .find(v => v.name === name);
   }

   private updateScene(scene: Scene, viewName: string): Promise<Status> {
      return new Promise<Status>(resolve => {
         this.dbService.updateScene(scene)
            .then(s => resolve({ type: StatusType.SUCCESS, msg: 'View "' + viewName + '" has been saved' }))
            .catch(e => {
               const message = typeof e === 'string' ? e : e.message;
               resolve({ type: StatusType.ERROR, msg: 'View "' + viewName + '" cannot be saved: ' + message })
            });
      });
   }
}
