import { Injectable } from '@angular/core';
import { Scene } from 'app/shared/model';
import { TabDef } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { LanguageService } from 'app/shared/services/language';
import { StringUtils } from 'app/shared/utils';
import { SampleData, SampleDef, toEntries } from './sample-data';

@Injectable({
   providedIn: 'root'
})
export class SampleSceneService {

   static readonly BATCH_SIZE = 1_000;

   constructor(private dbService: DBService) { }

   /**
    * activates the sample scene identified by its fixed id, inserts it (named uniquely) into the database before when it does not
    * exist yet or was imported incompletely
    */
   async open(sample: SampleDef): Promise<void> {
      const sceneInfos = await this.dbService.findSceneInfos();
      const sceneInfo = sceneInfos.find(si => si._id === sample.sceneId);
      if (sceneInfo) {
         if (this.dbService.getActiveScene()?._id !== sceneInfo._id) {
            await this.dbService.activateScene(sceneInfo._id);
         }
         if (await this.dbService.countEntriesOfActiveScene() === sample.rowCount) {
            return;
         }
         console.warn('sample scene was imported incompletely and is imported again');
         await this.dbService.deleteScene(sceneInfo);
      }
      const otherSceneNames = new Set(sceneInfos.filter(si => si._id !== sample.sceneId).map(si => si.name));
      await this.insert(sample.sceneId, otherSceneNames, await this.fetchSampleData(sample));
   }

   private async fetchSampleData(sample: SampleDef): Promise<SampleData> {
      const response = await fetch(new URL('assets/samples/' + sample.file, document.baseURI));
      if (!response.ok) {
         throw new Error(LanguageService.instant('sample.loadFailed', { reason: response.statusText }));
      }
      return response.json();
   }

   /**
    * activates the scene not before its entries and tabs are persisted, a scene that was inserted but cannot be completed is
    * deleted again
    */
   private async insert(sceneId: string, otherSceneNames: Set<string>, data: SampleData): Promise<void> {
      const scene: Scene = {
         ...data.scene,
         _id: sceneId,
         name: StringUtils.uniqueName(data.scene.name, otherSceneNames),
         creationTime: new Date().getTime(),
         database: await this.dbService.findFreeDatabaseName()
      };
      try {
         await this.dbService.persistScene(scene, false);
         const entries = toEntries(data);
         for (let i = 0; i < entries.length; i += SampleSceneService.BATCH_SIZE) {
            await this.dbService.writeEntries(scene.database, entries.slice(i, i + SampleSceneService.BATCH_SIZE));
         }
         await this.saveTabs(scene, data.tabs);
         await this.dbService.activateScene(scene._id);
      } catch (err) {
         if (scene._rev) {
            await this.dbService.deleteScene(scene).catch(e => console.warn('incomplete sample scene cannot be deleted', e));
         }
         throw err;
      }
   }

   /**
    * views are a bonus, the sample scene is usable without them
    */
   private async saveTabs(scene: Scene, tabs: TabDef[]): Promise<void> {
      try {
         await this.dbService.saveSceneTabs({ _id: DBService.sceneTabsId(scene._id), tabs });
      } catch (err) {
         console.warn('sample views cannot be saved', err);
      }
   }
}
