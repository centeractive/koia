import { LanguageService } from '../language';
import { Injectable, NgZone } from '@angular/core';
import { SortDirection } from '@angular/material/sort';
import { Column, DataType, Document, Operator, Page, Query, Scene, SceneActivation, SceneInfo, SceneLabels } from 'app/shared/model';
import { SceneTabs } from 'app/shared/model/view-config';
import { rejectionOf } from 'app/shared/scene-format/scene-format-rejection';
import { SceneValidator } from 'app/shared/scene-format/scene-validator';
import { CommonUtils, QueryUtils } from 'app/shared/utils';
import { storedColumnsOf } from 'app/shared/utils/column-utils';
import { withComputedValues } from 'app/shared/utils/computation-utils';
import { PromiseProgressMonitor } from 'app/shared/utils/promise-progress-monitor';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';
import { Observable, Subject, lastValueFrom, map, of } from 'rxjs';
import { CouchDBService } from './couchdb';
import { CouchDBConstants } from './couchdb/couchdb-constants';
import { DB } from './db.type';
import { MangoQueryBuilder } from './mango/mango-query-builder';
import { QueryConverter } from './mango/query-converter';
import { PouchDBAccess } from './pouchdb';
import { SCENES_DB, sceneActivationId, sceneTabsId } from './scenes-db';

/**
 * CouchDB cannot be used, the browser storage is used instead
 */
export interface CouchDBFallback {
  couchDBError: string | object;
}

@Injectable()
export class DBService {

  static readonly SCENES = SCENES_DB;
  static readonly DATA = 'data';
  static readonly MAX_DB_COUNT = 100;

  private db: DB;
  private pouchDBAccess: PouchDBAccess;
  private dbPrefix = '';
  private queryConverter: QueryConverter;
  private activeScene: Scene;
  private readonly sceneValidator = new SceneValidator();
  private readonly sceneDiscards = new Subject<string>();

  /**
   * emits the _id of each scene that is deleted or whose storage is given up, its open tabs must not be written anymore
   */
  readonly sceneDiscarded$ = this.sceneDiscards.asObservable();

  constructor(private couchDBService: CouchDBService, private readonly zone: NgZone) { }

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
  async initBackend(force: boolean): Promise<CouchDBFallback | undefined> {
    if (this.db && !force) {
      return undefined;
    }
    this.discardActiveScene();
    this.db = null;
    try {
      const dbs = await this.couchDBService.listDatabases();
      this.db = this.couchDBService;
      this.queryConverter = new QueryConverter(false);
      if (!dbs.includes(this.scenesDbName())) {
        await this.createScenesDB();
      }
      return undefined;
    } catch (couchDBError) {
      console.warn('CouchDB cannot be accessed, browser storage is used instead', couchDBError);
      await this.useIndexedDb();
      return { couchDBError };
    }
  }

  useIndexedDb(): Promise<unknown> {
    this.discardActiveScene();
    this.db = this.pouchDBAccess ??= new PouchDBAccess(this.zone);
    this.queryConverter = new QueryConverter(true);
    return this.createScenesDB();
  }

  private discardActiveScene(): void {
    if (this.activeScene) {
      this.sceneDiscards.next(this.activeScene._id);
      this.activeScene = undefined;
    }
  }

  private async createScenesDB(): Promise<unknown> {
    const scenesDB = this.scenesDbName();
    return this.db.createDatabase(scenesDB)
      .then(() => this.db.createIndex(scenesDB, 'creationTime'));
  }

  /**
   * @returns the name of a database that neither exists nor is referred to by a scene
   */
  async findFreeDatabaseName(): Promise<string> {
    const takenNames = await this.sceneDatabaseNames();
    if (this.isCouchDbInUse()) {
      takenNames.push(...await this.couchDBService.listDatabases());
    }
    for (let i = 1; i <= DBService.MAX_DB_COUNT; i++) {
      const dbName = this.dbPrefix + DBService.DATA + '_' + i;
      if (!takenNames.includes(dbName) && !await this.containsPouchDocuments(dbName)) {
        return dbName;
      }
    }
    throw new Error('No free database table available (maximum of ' + DBService.MAX_DB_COUNT + ' reached)');
  }

  private async sceneDatabaseNames(): Promise<string[]> {
    return (await this.findSceneInfos()).map(si => si.database);
  }

  /**
   * PouchDB creates a database on first access, a database without documents is as good as a missing one
   */
  private async containsPouchDocuments(database: string): Promise<boolean> {
    return this.isIndexedDbInUse() && await this.db.countDocuments(database) > 0;
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
    await promiseMonitor.addUnchained(LanguageService.instant('scene.task.createDatabase'), this.createSceneDatabase(scene.database));
    try {
      await promiseMonitor.add(LanguageService.instant('scene.task.insertScene'), this.db.insert(this.scenesDbName(), scene))
        .then(LanguageService.instant('scene.task.indexColumns'), () => Promise.all(scene.columns
          .filter(c => c.indexed)
          .map(c => promiseMonitor.addUnchained(LanguageService.instant('scene.task.indexColumn', { column: c.name }),
            this.db.createIndex(scene.database, c.name)))))
        .unwrap();
    } catch (err) {
      await this.discardIncompleteScene(scene);
      throw err;
    }
    if (activate) {
      this.activeScene = scene;
      console.log('scene activated (id: ' + scene._id + ', rev: ' + scene._rev + ')');
    }
    return scene;
  }

  private async createSceneDatabase(database: string): Promise<void> {
    if ((await this.sceneDatabaseNames()).includes(database) || await this.containsPouchDocuments(database)) {
      throw this.databaseInUseError(database);
    }
    try {
      await this.db.createDatabase(database);
    } catch (err) {
      throw err?.status === 412 ? this.databaseInUseError(database) : err;
    }
  }

  private databaseInUseError(database: string): Error {
    return new Error(LanguageService.instant('scene.databaseInUse', { database }));
  }

  private async discardIncompleteScene(scene: Scene): Promise<void> {
    try {
      await (scene._rev ? this.deleteScene(scene) : this.deleteSceneDatabase(scene));
    } catch (err) {
      console.warn('incompletely persisted scene ' + scene._id + ' cannot be removed', err);
    }
    delete scene._rev;
  }

  async updateScene(scene: Scene): Promise<Scene> {
    return this.db.update(this.scenesDbName(), scene)
      .then(() => scene);
  }

  /**
   * updates name and short description of the specified scene, the active scene is updated in place
   */
  async updateSceneLabels(labels: SceneLabels): Promise<void> {
    const scene = await this.findScene(labels._id);
    scene.name = labels.name;
    scene.shortDescription = labels.shortDescription;
    await this.updateScene(scene);
    if (this.activeScene?._id === scene._id) {
      this.activeScene.name = scene.name;
      this.activeScene.shortDescription = scene.shortDescription;
      this.activeScene._rev = scene._rev;
    }
  }

  /**
   * deletes the database before the scene document, so that a failure leaves a scene that can be deleted again,
   * open tabs and activation time go last since they're useless without the scene
   */
  async deleteScene(sceneInfo: SceneInfo): Promise<void> {
    if (this.activeScene && this.activeScene._id === sceneInfo._id) {
      this.activeScene = undefined;
    }
    this.sceneDiscards.next(sceneInfo._id);
    await this.deleteSceneDatabase(sceneInfo);
    await this.db.delete(this.scenesDbName(), sceneInfo);
    await this.deleteOptional(DBService.sceneTabsId(sceneInfo._id), 'open tabs', sceneInfo._id);
    await this.deleteOptional(sceneActivationId(sceneInfo._id), 'activation time', sceneInfo._id);
  }

  /**
   * a scene written by a third party may refer to the scenes database or to the database of another scene,
   * which must never be deleted along with it
   */
  private async deleteSceneDatabase(sceneInfo: SceneInfo): Promise<void> {
    if (sceneInfo.database === this.scenesDbName()) {
      console.warn('scene ' + sceneInfo._id + ' refers to the scenes database, which is kept');
      return;
    }
    if ((await this.findSceneInfos()).some(si => si._id !== sceneInfo._id && si.database === sceneInfo.database)) {
      console.warn('database ' + sceneInfo.database + ' of scene ' + sceneInfo._id + ' is used by another scene, it is kept');
      return;
    }
    await this.db.deleteDatabase(sceneInfo.database)
      .catch(err => {
        if (err?.status !== 404) {
          throw err;
        }
      });
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
        const validation = this.sceneValidator.validate(s);
        const rejection = rejectionOf(validation, this.sceneValidator.supportedVersions);
        if (rejection) {
          throw rejection;
        }
        if (validation.errors.length) {
          console.warn('scene ' + id + ' does not comply with scene format ' + validation.version, validation.errors);
        }
        const scene = s as Scene;
        scene.config ??= {};
        this.activeScene = scene;
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
    if (prevPage && QueryUtils.areFiltersEqual(query, prevPage.query) && CommonUtils.compare(query.getSort(), prevPage.query.getSort())) {
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

  /**
   * both backends omit entries lacking the value of the sort field, they're counted with the selector and sort of the entries query
   */
  private async countMatchingEntries(query: Query): Promise<number> {
    if (this.matchesNothing(query)) {
      return 0;
    }
    if (query.hasFilter() || query.hasSort()) {
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

  /**
   * @param indexedColumnsOnly true to fetch the values of indexed columns only, filters apply to all stored columns anyway
   */
  findEntries(query: Query, indexedColumnsOnly: boolean): Observable<Document[]> {
    if (this.matchesNothing(query)) {
      return of([]);
    }
    const columns = storedColumnsOf(this.activeScene.columns);
    const fieldColumns = indexedColumnsOnly ? this.activeScene.columns.filter(c => c.indexed) : columns;
    const mangoQuery = this.queryConverter.toMango(columns, query, fieldColumns);
    return this.db.find(this.activeScene.database, mangoQuery);
  }

  /**
   * a full text filter matches nothing when the scene has no stored text column
   */
  private matchesNothing(query: Query): boolean {
    return query.hasFullTextFilter() && !storedColumnsOf(this.activeScene.columns).some(c => c.dataType === DataType.TEXT);
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
