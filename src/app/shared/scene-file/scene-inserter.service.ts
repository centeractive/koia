import { Injectable } from '@angular/core';
import { Document, Scene } from 'app/shared/model';
import { TabDef } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { StringUtils } from 'app/shared/utils';

@Injectable({
   providedIn: 'root'
})
export class SceneInserter {

   static readonly BATCH_SIZE = 1_000;

   constructor(private dbService: DBService) { }

   /**
    * inserts the scene, named uniquely among the other scenes, into a free database and activates it not before its entries
    * and tabs are persisted; a scene that was inserted but cannot be completed is deleted again
    *
    * @param content the scene, its creation time and database are replaced, its _id is generated when missing
    * @param signal aborts writing the entries, the scene is deleted then; an abort is detected only after the scene was
    * persisted, so a scene aborted before is persisted and deleted again
    */
   async insert(content: Omit<Scene, '_rev' | 'creationTime' | 'database'>, otherSceneNames: Set<string>, entries: Document[],
      tabs: TabDef[], signal?: AbortSignal): Promise<void> {
      const scene: Scene = {
         ...content,
         name: StringUtils.uniqueName(content.name, otherSceneNames),
         creationTime: new Date().getTime(),
         database: await this.dbService.findFreeDatabaseName()
      };
      try {
         await this.dbService.persistScene(scene, false);
         for (let i = 0; i < entries.length; i += SceneInserter.BATCH_SIZE) {
            signal?.throwIfAborted();
            await this.dbService.writeEntries(scene.database, entries.slice(i, i + SceneInserter.BATCH_SIZE));
         }
         signal?.throwIfAborted();
         await this.saveTabs(scene, tabs);
         await this.dbService.activateScene(scene._id);
      } catch (err) {
         if (scene._rev) {
            await this.dbService.deleteScene(scene).catch(e => console.warn('incomplete scene cannot be deleted', e));
         }
         throw err;
      }
   }

   /**
    * views are a bonus, the scene is usable without them
    */
   private async saveTabs(scene: Scene, tabs: TabDef[]): Promise<void> {
      try {
         await this.dbService.saveSceneTabs({ _id: DBService.sceneTabsId(scene._id), tabs });
      } catch (err) {
         console.warn('views of scene cannot be saved', err);
      }
   }
}
