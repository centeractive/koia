import { Injectable } from '@angular/core';
import { Document } from 'app/shared/model';
import { DBService } from 'app/shared/services/backend';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import { ExportService } from 'app/shared/services/export/export.service';
import { LanguageService } from 'app/shared/services/language';
import { SCENE_FILE_EXTENSION, SCENE_FILE_FORMAT, SCENE_FILE_VERSION, SceneFile } from './scene-file';
import { SceneFileCodec } from './scene-file-codec';
import { SceneFileValidator } from './scene-file-validator';
import { SceneInserter } from './scene-inserter.service';

@Injectable({
   providedIn: 'root'
})
export class SceneFileService {

   private readonly validator = new SceneFileValidator();

   constructor(private dbService: DBService, private exportService: ExportService, private sceneInserter: SceneInserter) { }

   /**
    * downloads the scene with its open tabs and all its entries as .koia file
    */
   async export(sceneId: string): Promise<void> {
      const scene = await this.dbService.findScene(sceneId);
      const [entries, sceneTabs] = await Promise.all([this.dbService.findAllEntries(scene.database), this.dbService.findSceneTabs(sceneId)]);
      const sceneFile: SceneFile = {
         format: SCENE_FILE_FORMAT,
         version: SCENE_FILE_VERSION,
         scene: SceneFileService.withoutIds(scene),
         tabs: sceneTabs?.tabs ?? [],
         entries: entries.map(e => SceneFileService.withoutIds(e))
      };
      this.exportService.saveBlobAs(await SceneFileCodec.encode(sceneFile), this.exportService.generateFileName(scene.name, SCENE_FILE_EXTENSION));
   }

   /**
    * inserts the scene of a .koia file as new scene and activates it, rejects with the reason when the file cannot be imported
    *
    * @param signal cancels the import, an inserted scene is deleted then
    */
   async import(file: File, signal?: AbortSignal): Promise<void> {
      const content = await SceneFileCodec.decode(file).catch(() => {
         throw LanguageService.instant('sceneFile.unreadable', { file: file.name });
      });
      const rejection = this.validator.rejectionOf(content);
      if (rejection) {
         throw rejection;
      }
      const sceneFile = content as SceneFile;
      const max = this.dbService.getMaxDataItemsPerScene();
      if (sceneFile.entries.length > max) {
         throw LanguageService.instant('sceneFile.tooManyEntries', { count: sceneFile.entries.length, max });
      }
      const sceneNames = new Set((await this.dbService.findSceneInfos()).map(si => si.name));
      const entries = sceneFile.entries.map((e, i) => ({ ...e, _id: String(CouchDBConstants.ENTRY_ID_BASE + i + 1) }));
      await this.sceneInserter.insert(sceneFile.scene, sceneNames, entries, sceneFile.tabs, signal);
   }

   private static withoutIds<T extends Document>(doc: T): T {
      const copy = { ...doc };
      delete copy._id;
      delete copy._rev;
      return copy;
   }
}
