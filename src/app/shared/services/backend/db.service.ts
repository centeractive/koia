import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MangoQueryBuilder } from './mango/mango-query-builder';
import { QueryUtils } from 'app/shared/utils';
import { QueryConverter } from './mango/query-converter';
import { CouchDBConstants } from './couchdb/couchdb-constants';
import { SortDirection } from '@angular/material/sort';
import { CouchDBService, SortLimitationWorkaround } from './couchdb';
import { DB } from './db.type';
import { PouchDBAccess } from './pouchdb';
import { Scene, SceneInfo, DataType, Operator, Query, Page, Column, Document } from 'app/shared/model';
import { ValueRange } from 'app/shared/value-range/model/value-range.type';

@Injectable()
export class DBService {

  static readonly SCENES = 'scenes';
  static readonly DATA = 'data';
  static readonly MAX_DB_COUNT = 100;

  private db: DB;
  private dbPrefix = '';
  private queryConverter: QueryConverter;
  private activeScene: Scene;

  constructor(private couchDBService: CouchDBService) { }

  setDbPrefix(prefix: string) {
    this.dbPrefix = prefix;
  }

  isBackendInitialized(): boolean {
    return this.db !== null && this.db !== undefined;
  }

  /**
   * @param force [[true]] to initialize the backend regardless if it was already initialized before,
   * [[false]] to initialize the backend only in case it was not already initialized before
   */
  async initBackend(force: boolean): Promise<void> {
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

  useIndexedDb(): Promise<any> {
    this.db = new PouchDBAccess();
    this.queryConverter = new QueryConverter(true);
    return this.createScenesDB();
  }

  private async createScenesDB(): Promise<any> {
    const scenesDB = this.scenesDbName();
    return this.db.createDatabase(scenesDB)
      .then(r => this.db.createIndex(scenesDB, 'creationTime'));
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
    return this.db.find(this.scenesDbName(), query).toPromise()
      .then(docs => docs.map(d => <SceneInfo>d));
  }

  async findScene(id: string): Promise<Scene> {
    return this.db.findById(this.scenesDbName(), id)
      .then(s => <Scene>s);
  }

  async persistScene(scene: Scene, activate: boolean): Promise<Scene> {
    return this.db.insert(this.scenesDbName(), scene)
      .then(r => {
        if (activate) {
          this.activeScene = scene;
          console.log('scene activated (id: ' + scene._id + ', rev: ' + scene._rev + ')');
        }
        return this.db.createDatabase(scene.database);
      })
      .then(r => Promise.all(scene.columns
        .filter(c => c.indexed)
        .map(c => this.db.createIndex(scene.database, c.name))))
      .then(() => scene);
  }

  async updateScene(scene: Scene): Promise<Scene> {
    return this.db.update(this.scenesDbName(), scene)
      .then(d => scene);
  }

  async deleteScene(sceneInfo: SceneInfo): Promise<any> {
    if (this.activeScene && this.activeScene._id === sceneInfo._id) {
      this.activeScene = undefined;
    }
    return this.db.delete(this.scenesDbName(), sceneInfo)
      .then(r => this.db.deleteDatabase(sceneInfo.database));
  }

  async activateScene(id: string): Promise<Scene> {
    if (this.activeScene && this.activeScene._id === id) {
      return Promise.reject('scene with id "' + id + '" is already active');
    }
    return this.db.findById(this.scenesDbName(), id)
      .then(s => {
        this.activeScene = <Scene>s;
        return this.activeScene;
      });
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
      return this.findEntries(query, false).toPromise()
        .then(entries => this.toPage(query, entries, prevPage.totalRowCount));
    } else {
      return this.countMatchingEntries(query)
        .then(cnt => {
          if (cnt === 0) {
            return this.toPage(query, [], cnt);
          } else {
            return this.findEntries(query, false).toPromise()
              .then(entries => this.toPage(query, entries, cnt));
          }
        });
    }
  }

  private toPage(query: Query, entries: Object[], totalRowCount: number): Page {
    return {
      query: query.clone(),
      entries: entries,
      totalRowCount: totalRowCount
    };
  }

  private async countMatchingEntries(query: Query): Promise<number> {
    if (query.hasFilter() || SortLimitationWorkaround.isCouchDbWithSort(this, query)) {
      const mangoQuery = this.queryConverter.queryForAllMatchingIds(this.activeScene.columns, query);
      const objects = await this.db.find(this.activeScene.database, mangoQuery).toPromise();
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
    const columns = indexedColumnsOnly ? this.activeScene.columns.filter(c => c.indexed) : this.activeScene.columns;
    const mangoQuery = this.queryConverter.toMango(columns, query);
    return this.db.find(this.activeScene.database, mangoQuery);
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
    const docs = await this.db.find(this.activeScene.database, mangoQuery).toPromise();
    return docs.length === 0 ? undefined : docs[0][timeColumn.name];
  }
}
