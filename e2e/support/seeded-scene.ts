import type { Scene } from 'app/shared/model/scene.type';
import type { SceneInfo } from 'app/shared/model/scene-info.type';
import type { SceneTabs } from 'app/shared/model/view-config/tab-def.type';
import { SampleData, toEntries } from 'app/shared/samples/sample-data';
import { SCENES_DB, sceneActivationId, sceneTabsId } from 'app/shared/services/backend/scenes-db';
import { DEFAULT_LANGUAGE } from 'app/shared/services/language/language';
import { CouchDB, uniqueTestName } from './couchdb';
import { fruitSalesOf } from './fruit-sales-sample';

const ENTRY_COUNT = 20;
const CREATION_TIME: keyof SceneInfo = 'creationTime';

/**
 * scene with the first entries of the sample, stored in its own data database
 */
export class SeededScene {

   readonly id = uniqueTestName();
   readonly name = 'E2E ' + this.id;
   readonly entryCount = ENTRY_COUNT;
   private readonly data: SampleData = fruitSalesOf(DEFAULT_LANGUAGE);
   readonly columnNames = this.data.scene.columns.map(c => c.name);

   constructor(private readonly couchDB: CouchDB) { }

   async create(): Promise<void> {
      await this.ensureScenesDatabase();
      await this.couchDB.createDatabase(this.id);
      for (const column of this.data.scene.columns.filter(c => c.indexed)) {
         await this.couchDB.createIndex(this.id, column.name);
      }
      await this.couchDB.insertBulk(this.id, toEntries(this.data).slice(0, ENTRY_COUNT));
      await this.couchDB.putDocument(SCENES_DB, this.sceneDocument());
   }

   async remove(): Promise<void> {
      await this.couchDB.deleteDocumentIfExists(SCENES_DB, this.id);
      await this.couchDB.deleteDocumentIfExists(SCENES_DB, sceneTabsId(this.id));
      await this.couchDB.deleteDocumentIfExists(SCENES_DB, sceneActivationId(this.id));
      await this.couchDB.deleteDatabaseIfExists(this.id);
   }

   async tabTitles(): Promise<string[]> {
      const sceneTabs = await this.couchDB.findDocument<SceneTabs>(SCENES_DB, sceneTabsId(this.id));
      return sceneTabs?.tabs.map(t => t.title) ?? [];
   }

   /**
    * a fresh CouchDB (CI) has no scenes database yet, it gets the index Koia creates along with it (DBService#createScenesDB)
    */
   private async ensureScenesDatabase(): Promise<void> {
      if (await this.couchDB.createDatabaseIfAbsent(SCENES_DB)) {
         await this.couchDB.createIndex(SCENES_DB, CREATION_TIME);
      }
   }

   private sceneDocument(): Scene {
      return { ...this.data.scene, _id: this.id, name: this.name, creationTime: Date.now(), database: this.id };
   }
}
