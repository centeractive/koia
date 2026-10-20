import { LanguageService } from '../language';
import { Injectable } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Column, DataType, Document, Operator, Page, Query, Scene, SceneActivation, SceneInfo } from 'app/shared/model';
import { SceneTabs } from 'app/shared/model/view-config';
import { QueryUtils } from 'app/shared/utils';
import { storedColumnsOf } from 'app/shared/utils/column-utils';
import { withComputedValues } from 'app/shared/utils/computation-utils';
import { PromiseProgressMonitor } from 'app/shared/utils/promise-progress-monitor';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { Observable, lastValueFrom, map } from 'rxjs';
import { CouchDBService, SortLimitationWorkaround } from './couchdb';
import { CouchDBConstants } from './couchdb/couchdb-constants';
import { DB } from './db.type';
import { MangoQueryBuilder } from './mango/mango-query-builder';
import { QueryConverter } from './mango/query-converter';
import { PouchDBAccess } from './pouchdb';
import { SCENES_DB, sceneActivationId, sceneTabsId } from './scenes-db';

@Injectable()
export class DBService {

  static readonly SCENES = SCENES_DB;
  static readonly DATA = 'data';
  static readonly MAX_DB_COUNT = 100;

  private db: DB;
  private dbPrefix = '';
  private queryConverter: QueryConverter;
  private activeScene: Scene;

  constructor(private couchDBService: CouchDBService) { }

  setDbPrefix(prefix: string): void {
    this.dbPrefix = prefix;
  }

  isBackendInitialized(): boolean {
    return !!this.db;
  }

  /**
   * @param force [[true]] to initialize the backend regardless if it was already initialized before,
   * [[false]] to initialize the backend only in case it was not already initialized before
   */
  async initBackend(force: boolean): Promise<unknown> {
    if (!this.db || force) {
      this.db = null;
      return this.couchDBService.listDatabases()
        .then(dbs => {
          this.db = this.couchDBService;
          this.queryConverter = new QueryConverter(false);
          if (!dbs.includes(this.scenesDbName())) {
            return this.createScenesDB();
          }
        })
        .catch(err => {
          console.warn('CouchDB cannot be accessed, browser storage is used instead', err);
          return this.useIndexedDb();
        });
    }
  }

  useIndexedDb(): Promise<unknown> {
    this.db = new PouchDBAccess();
    this.queryConverter = new QueryConverter(true);
    return this.createScenesDB();
  }

  private async createScenesDB(): Promise<unknown> {
    const scenesDB = this.scenesDbName();
    return this.db.createDatabase(scenesDB)
      .then(() => this.db.createIndex(scenesDB, 'creationTime'));
  }

  /**
   * @returns the name of a database that does not exist yet
   */
  async findFreeDatabaseName(): Promise<string> {
    if (this.isIndexedDbInUse()) {
      return this.findSceneInfos()
        .then(infos => this.findFreeDBName(infos.map(i => i.database)));
    } else {
      return this.couchDBService.listDatabases()
        .then(dbs => this.findFreeDBName(dbs));
    }
  }

  isIndexedDbInUse(): boolean {
    return this.db !== this.couchDBService;
  }

  isCouchDbInUse(): boolean {
    return this.db === this.couchDBService;
  }

  getMaxDataItemsPerScene(): number {
    return this.db ? this.db.getMaxDataItemsPerScene() : undefined;
  }

  private findFreeDBName(existingDBNames: string[]): string {
    for (let i = 1; i <= DBService.MAX_DB_COUNT; i++) {
      const dbName = this.dbPrefix + DBService.DATA + '_' + i;
      if (!existingDBNames.includes(dbName)) {
        return dbName;
      }
    }
    throw new Error('No free database table available (maximum of ' + DBService.MAX_DB_COUNT + ' reached)');
  }

  async findSceneInfos(): Promise<SceneInfo[]> {
    const query = new MangoQueryBuilder(false, undefined)
      .where('creationTime', Operator.NOT_EMPTY, null, DataType.TIME) // PouchDB expects sorted field to be part of the selector
      .sortBy({ active: 'creationTime', direction: 'desc' })
      .includeFields([CouchDBConstants._ID, CouchDBConstants._REV,
        'creationTime', 'name', 'shortDescription', 'database', 'columnMappings'])
      .toQuery();
    return lastValueFrom(this.db.find(this.scenesDbName(), query))
      .then(docs => docs.map(d => <SceneInfo>d));
  }

  async findScene(id: string): Promise<Scene> {
    return this.db.findById(this.scenesDbName(), id)
      .then(s => <Scene>s);
  }

  async persistScene(scene: Scene, activate: boolean, promiseMonitor?: PromiseProgressMonitor): Promise<Scene> {
    promiseMonitor = promiseMonitor ?? new PromiseProgressMonitor();
    return promiseMonitor.add(LanguageService.instant('scene.task.insertScene'), this.db.insert(this.scenesDbName(), scene))
      .then(LanguageService.instant('scene.task.createDatabase'), () => {
        if (activate) {
          this.activeScene = scene;
          console.log('scene activated (id: ' + scene._id + ', rev: ' + scene._rev + ')');
        }
        return this.db.createDatabase(scene.database);
      })
      .then(LanguageService.instant('scene.task.indexColumns'), () => Promise.all(scene.columns
        .filter(c => c.indexed)
        .map(c => promiseMonitor.addUnchained(LanguageService.instant('scene.task.indexColumn', { column: c.name }),
          this.db.createIndex(scene.database, c.name)))))
      .unwrap()
      .then(() => scene);
  }

  async updateScene(scene: Scene): Promise<Scene> {
    return this.db.update(this.scenesDbName(), scene)
      .then(() => scene);
  }

  async deleteScene(sceneInfo: SceneInfo): Promise<void> {
    if (this.activeScene && this.activeScene._id === sceneInfo._id) {
      this.activeScene = undefined;
    }
    return this.db.delete(this.scenesDbName(), sceneInfo)
      .then(() => this.db.deleteDatabase(sceneInfo.database))
      .then(() => this.deleteOptional(DBService.sceneTabsId(sceneInfo._id), 'open tabs', sceneInfo._id))
      .then(() => this.deleteOptional(sceneActivationId(sceneInfo._id), 'activation time', sceneInfo._id));
  }

  private async deleteOptional(docId: string, label: string, sceneId: string): Promise<void> {
    try {
      const doc = await this.findOptional(docId);
      if (doc) {
        await this.db.delete(this.scenesDbName(), doc);
      }
    } catch (err) {
      console.warn(label + ' of scene ' + sceneId + ' cannot be deleted', err);
    }
  }

  static readonly sceneTabsId = sceneTabsId;

  /**
   * @returns the persisted open tabs of the specified scene or <undefined> if none were persisted yet
   */
  async findSceneTabs(sceneId: string): Promise<SceneTabs> {
    return this.findOptional<SceneTabs>(DBService.sceneTabsId(sceneId));
  }

  private async findOptional<T extends Document>(id: string): Promise<T> {
    return this.db.findById(this.scenesDbName(), id)
      .then(doc => <T>doc)
      .catch(err => {
        if (err?.status === 404) {
          return undefined;
        }
        throw err;
      });
  }

  /**
   * inserts or updates the open tabs, a revision conflict is resolved once by retrying with the current revision
   */
  async saveSceneTabs(sceneTabs: SceneTabs): Promise<SceneTabs> {
    return this.saveDocument(sceneTabs);
  }

  private async saveDocument<T extends Document>(doc: T): Promise<T> {
    return this.writeDocument(doc)
      .catch(async err => {
        if (err?.status !== 409) {
          throw err;
        }
        const current = await this.findOptional<T>(doc._id);
        if (!current) {
          throw err;
        }
        doc._rev = current._rev;
        return this.writeDocument(doc);
      });
  }

  private writeDocument<T extends Document>(doc: T): Promise<T> {
    const write = doc._rev ? this.db.update(this.scenesDbName(), doc) : this.db.insert(this.scenesDbName(), doc);
    return write.then(() => doc);
  }

  async activateScene(id: string): Promise<Scene> {
    if (this.activeScene && this.activeScene._id === id) {
      return Promise.reject('scene with id "' + id + '" is already active');
    }
    return this.db.findById(this.scenesDbName(), id)
      .then(async s => {
        this.activeScene = s as Scene;
        await this.saveSceneActivation(id);
        return this.activeScene;
      });
  }

  private async saveSceneActivation(sceneId: string): Promise<void> {
    try {
      const activation: SceneActivation = await this.findOptional<SceneActivation>(sceneActivationId(sceneId))
        ?? { _id: sceneActivationId(sceneId), sceneId, lastActivationTime: undefined };
      activation.lastActivationTime = new Date().getTime();
      await this.saveDocument(activation);
    } catch (err) {
      console.warn('activation time of scene ' + sceneId + ' cannot be saved', err);
    }
  }

  /**
   * @returns the last activation time of each scene that was ever activated, mapped by scene id
   */
  async findSceneActivationTimes(): Promise<Map<string, number>> {
    const query = new MangoQueryBuilder(false, undefined)
      .where('lastActivationTime', Operator.NOT_EMPTY, null, DataType.TIME)
      .includeFields(['sceneId', 'lastActivationTime'])
      .toQuery();
    try {
      const docs = await lastValueFrom(this.db.find(this.scenesDbName(), query));
      return new Map(docs.map(d => <SceneActivation>d).map(a => [a.sceneId, a.lastActivationTime]));
    } catch (err) {
      console.warn('activation times of scenes cannot be read', err);
      return new Map();
    }
  }

  getActiveScene(): Scene {
    return this.activeScene;
  }

  writeEntries(database: string, entries: Document[]): Promise<void> {
    return this.db.insertBulk(database, entries);
  }

  async requestEntriesPage(query: Query, prevPage?: Page): Promise<Page> {
    if (prevPage && QueryUtils.areFiltersEqual(query, prevPage.query) &&
      !SortLimitationWorkaround.isCouchDbWithChangedSort(this, query, prevPage)) {
      return lastValueFrom(this.findEntriesWithComputedValues(query, false))
        .then(entries => this.toPage(query, entries, prevPage.totalRowCount));
    } else {
      return this.countMatchingEntries(query)
        .then(cnt => {
          if (cnt === 0) {
            return this.toPage(query, [], cnt);
          } else {
            return lastValueFrom(this.findEntriesWithComputedValues(query, false))
              .then(entries => this.toPage(query, entries, cnt));
          }
        });
    }
  }

  private toPage(query: Query, entries: object[], totalRowCount: number): Page {
    return {
      query: query.clone(),
      entries: entries,
      totalRowCount: totalRowCount
    };
  }

  private async countMatchingEntries(query: Query): Promise<number> {
    if (query.hasFilter() || SortLimitationWorkaround.isCouchDbWithSort(this, query)) {
      const mangoQuery = this.queryConverter.queryForAllMatchingIds(storedColumnsOf(this.activeScene.columns), query);
      const objects = await lastValueFrom(this.db.find(this.activeScene.database, mangoQuery));
      return objects.length;
    } else {
      return this.countEntriesOfActiveScene();
    }
  }

  /**
   * @returns the number of all non-design documents contained in the entries database of the active scene
   */
  async countEntriesOfActiveScene(): Promise<number> {
    return this.db.countDocuments(this.activeScene.database)
      .then(n => n - this.activeScene.columns.filter(c => c.indexed).length);
  }

  findEntries(query: Query, indexedColumnsOnly: boolean): Observable<Document[]> {
    const columns = indexedColumnsOnly ? this.activeScene.columns.filter(c => c.indexed) : storedColumnsOf(this.activeScene.columns);
    const mangoQuery = this.queryConverter.toMango(columns, query);
    return this.db.find(this.activeScene.database, mangoQuery);
  }

  /**
   * @returns the entries found by [[findEntries]] including the values of the computed columns of the active scene
   */
  findEntriesWithComputedValues(query: Query, indexedColumnsOnly: boolean): Observable<Document[]> {
    return this.findEntries(query, indexedColumnsOnly)
      .pipe(map(entries => withComputedValues(entries, this.activeScene.columns)));
  }

  private scenesDbName(): string {
    return this.dbPrefix + DBService.SCENES;
  }

  /**
   * @returns min and max value of the specified number or time column
   */
  async numberRangeOf(timeColumn: Column): Promise<ValueRange> {
    const valueRange: ValueRange = { min: undefined, max: undefined };
    return this.firstNumberOf(timeColumn, 'asc')
      .then(min => {
        valueRange.min = min;
        return this.firstNumberOf(timeColumn, 'desc');
      })
      .then(max => {
        valueRange.max = max;
        return valueRange;
      });
  }

  private async firstNumberOf(timeColumn: Column, sortDirection: SortDirection): Promise<number> {
    const mangoQuery = new MangoQueryBuilder(false, [timeColumn])
      .where(timeColumn.name, Operator.GREATER_THAN, null)
      .sortBy({ active: timeColumn.name, direction: sortDirection })
      .numberOfRows(1)
      .includeFields([timeColumn.name])
      .toQuery();
    const docs = await lastValueFrom(this.db.find(this.activeScene.database, mangoQuery));
    return docs.length === 0 ? undefined : docs[0][timeColumn.name];
  }
}
