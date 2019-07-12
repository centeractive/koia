import { Scene, Status, StatusType } from '../model';
import { ArrayUtils } from '../utils';
import { View } from '../config/view.type';
import { Injectable } from '@angular/core';
import { DBService } from './backend';


@Injectable({
   providedIn: 'root'
})
export class ConfigService {

   constructor(private dbService: DBService) { }

   getData(scene: Scene, name: string): any {
      const record = scene.config.records.find(r => r.name === name);
      return record ? record.data : undefined;
   }

   /**
  * adds or replaces the specified config data in the cached configuration and saves the configuration object directly
  * in the JSON database and thus in the JSON file that also contains the data.
  *
  * @returns a promise that provides the resolved processing status (success or error), hence there's no need for the
  * invoking part to catch errors
  */
   saveData(scene: Scene, name: string, data: any): Promise<Status> {
      const prevRecord = scene.config.records.find(r => r.name === name);
      const newRecord = { name: name, data: data };
      if (prevRecord) {
         ArrayUtils.replaceElement(scene.config.records, prevRecord, newRecord);
      } else {
         scene.config.records.push(newRecord);
      }
      return this.updateScene(scene, 'Data');
   }

   getView(scene: Scene, name: string): View {
      return scene.config.views.find(v => v.name === name);
   }

   /**
    * adds or replaces the specified view in the cached configuration and saves the configuration object directly
    * in the JSON database and thus in the JSON file that also contains the data.
    *
    * @returns a promise that provides the resolved processing status (success or error), hence there's no need for the
    * invoking part to catch errors
    */
   saveView(scene: Scene, view: View): Promise<Status> {
      const prevView = this.getView(scene, view.name);
      if (prevView) {
         ArrayUtils.replaceElement(scene.config.views, prevView, view);
      } else {
         scene.config.views.push(view);
      }
      return this.updateScene(scene, 'View');
   }

   private updateScene(scene: Scene, type: string): Promise<Status> {
      return new Promise<Status>(resolve => {
         this.dbService.updateScene(scene)
            .then(c => resolve({ type: StatusType.SUCCESS, msg: type + ' has been saved' }))
            .catch(e => {
               const message = typeof e === 'string' ? e : e.message;
               resolve({ type: StatusType.ERROR, msg: type + ' cannot be saved: ' + message })
            });
      });
   }
}
