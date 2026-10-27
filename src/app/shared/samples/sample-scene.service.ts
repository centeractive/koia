import { Injectable } from '@angular/core';
import { SceneInserter } from 'app/shared/scene-file/scene-inserter.service';
import { DBService } from 'app/shared/services/backend';
import { LanguageService } from 'app/shared/services/language';
import { SampleData, SampleDef, toEntries } from './sample-data';

@Injectable({
   providedIn: 'root'
})
export class SampleSceneService {

   constructor(private dbService: DBService, private sceneInserter: SceneInserter) { }

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
      const data = await this.fetchSampleData(sample);
      await this.sceneInserter.insert({ ...data.scene, _id: sample.sceneId }, otherSceneNames, toEntries(data), data.tabs);
   }

   private async fetchSampleData(sample: SampleDef): Promise<SampleData> {
      const response = await fetch(new URL('assets/samples/' + sample.file, document.baseURI));
      if (!response.ok) {
         throw new Error(LanguageService.instant('sample.loadFailed', { reason: response.statusText }));
      }
      return response.json();
   }
}
