import { Injectable } from '@angular/core';
import { DataType, Document, Scene } from 'app/shared/model';
import { TabDef } from 'app/shared/model/view-config';
import { DBService } from 'app/shared/services/backend';
import { SampleDef } from './fruit-sales.sample';

/**
 * content of a sample file, the time values of the entries are local dates of pattern 'yyyy-MM-dd'
 */
export interface SampleData {
   scene: Pick<Scene, 'name' | 'shortDescription' | 'context' | 'columns' | 'columnMappings' | 'config'>;
   tabs: TabDef[];
   entries: object[];
}

@Injectable({
   providedIn: 'root'
})
export class SampleSceneService {

   static readonly BATCH_SIZE = 1_000;

   constructor(private dbService: DBService) { }

   /**
    * activates the sample scene, inserts it into the database before when it does not exist yet or was imported incompletely
    */
   async open(sample: SampleDef): Promise<void> {
      const sceneInfo = (await this.dbService.findSceneInfos()).find(si => si.name === sample.sceneName);
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
      await this.insert(await this.fetchSampleData(sample));
   }

   private async fetchSampleData(sample: SampleDef): Promise<SampleData> {
      const response = await fetch(new URL('assets/samples/' + sample.file, document.baseURI));
      if (!response.ok) {
         throw new Error('cannot load sample data: ' + response.statusText);
      }
      return response.json();
   }

   /**
    * activates the scene not before its entries and tabs are persisted, a scene that cannot be completed is deleted again
    */
   private async insert(data: SampleData): Promise<void> {
      const scene: Scene = {
         ...data.scene,
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
         if (scene._id) {
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

/**
 * converts the local dates of the time columns to their time at local midnight, the same as when importing a file
 */
export function toEntries(data: SampleData): Document[] {
   const timeColumns = data.scene.columns.filter(c => c.dataType === DataType.TIME).map(c => c.name);
   return data.entries.map(e => {
      const entry = { ...e };
      timeColumns.forEach(name => {
         const [year, month, day] = String(entry[name]).split('-').map(Number);
         entry[name] = new Date(year, month - 1, day).getTime();
      });
      return entry as Document;
   });
}
