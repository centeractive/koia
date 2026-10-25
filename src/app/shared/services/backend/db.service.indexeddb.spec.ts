import { NgZone } from '@angular/core';
import { Column, DataType, Operator, PropertyFilter, Query, Scene } from 'app/shared/model';
import { CouchDBServiceMock, SceneFactory } from 'app/shared/test';
import PouchDB from 'pouchdb';
import { lastValueFrom } from 'rxjs';
import { CouchDBService } from './couchdb';
import { DBService } from './db.service';

describe('DBService (IndexedDB)', () => {

  let runCounter = 0;
  let prefix: string;
  let couchDBService: CouchDBService;
  let dbService: DBService;
  let columns: Column[];
  let entries: object[];

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    vi.spyOn(console, 'warn').mockReturnValue(undefined);
    prefix = 'test_idb_' + Date.now() + '_' + runCounter++ + '_';
    columns = [
      { name: 'ID', dataType: DataType.NUMBER, width: 10, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 50, indexed: true },
      { name: 'Weight', dataType: DataType.NUMBER, width: 50, indexed: false },
      { name: 'Data', dataType: DataType.TEXT, width: 400, indexed: false }
    ];
    entries = [
      { _id: '1', ID: 1, Amount: 10, Weight: 3, Data: 'abc one' },
      { _id: '2', ID: 2, Amount: 20, Weight: 7, Data: 'xyz two' },
      { _id: '3', ID: 3, Amount: 30, Weight: 9, Data: 'abc three' },
      { _id: '4', ID: 4, Weight: 1, Data: 'four' }
    ];
    couchDBService = new CouchDBServiceMock();
    dbService = new DBService(couchDBService, new NgZone({ enableLongStackTrace: false }));
    dbService.setDbPrefix(prefix);
    await dbService.useIndexedDb();
  });

  afterEach(async () => {
    const databases = [DBService.SCENES, 'data_1', 'data_2', 'data_3'].map(name => prefix + name);
    await Promise.all(databases.map(database => new PouchDB(database).destroy()));
  });

  it('#initBackend should return no fallback when CouchDB is used', async () => {

    // given
    vi.spyOn(couchDBService, 'listDatabases').mockResolvedValue([prefix + DBService.SCENES]);

    // when
    const fallback = await dbService.initBackend(true);

    // then
    expect(fallback).toBeUndefined();
    expect(dbService.isCouchDbInUse()).toBe(true);
  });

  it('#initBackend should return CouchDB error when browser storage is used instead', async () => {

    // given
    vi.spyOn(couchDBService, 'listDatabases').mockRejectedValue('unreachable');

    // when
    const fallback = await dbService.initBackend(true);

    // then
    expect(fallback).toEqual({ couchDBError: 'unreachable' });
    expect(dbService.isIndexedDbInUse()).toBe(true);
  });

  it('#initBackend should deactivate active scene when forced', async () => {

    // given
    await dbService.persistScene(sceneOf('1', dataDB(1)), true);
    vi.spyOn(couchDBService, 'listDatabases').mockRejectedValue('unreachable');

    // when
    await dbService.initBackend(true);

    // then
    expect(dbService.getActiveScene()).toBeUndefined();
  });

  it('#initBackend should keep active scene when backend is initialized and not forced', async () => {

    // given
    const scene = await dbService.persistScene(sceneOf('1', dataDB(1)), true);
    vi.spyOn(couchDBService, 'listDatabases').mockRejectedValue('unreachable');

    // when
    const fallback = await dbService.initBackend(false);

    // then
    expect(fallback).toBeUndefined();
    expect(dbService.getActiveScene()).toBe(scene);
    expect(couchDBService.listDatabases).not.toHaveBeenCalled();
  });

  it('#initBackend should emit active scene as discarded when forced', async () => {

    // given
    await dbService.persistScene(sceneOf('1', dataDB(1)), true);
    vi.spyOn(couchDBService, 'listDatabases').mockRejectedValue('unreachable');
    const discarded = discardedSceneIds();

    // when
    await dbService.initBackend(true);

    // then
    expect(discarded).toEqual(['1']);
  });

  it('#useIndexedDb should deactivate active scene and emit it as discarded', async () => {

    // given
    await dbService.persistScene(sceneOf('1', dataDB(1)), true);
    const discarded = discardedSceneIds();

    // when
    await dbService.useIndexedDb();

    // then
    expect(dbService.getActiveScene()).toBeUndefined();
    expect(discarded).toEqual(['1']);
  });

  it('#useIndexedDb should reuse browser storage access', async () => {

    // given
    const access = dbService['db'];

    // when
    await dbService.useIndexedDb();

    // then
    expect(dbService['db']).toBe(access);
  });

  it('#activateScene should activate scene again after storage switch', async () => {

    // given
    await dbService.persistScene(sceneOf('1', dataDB(1)), true);
    await dbService.useIndexedDb();

    // when
    const scene = await dbService.activateScene('1');

    // then
    expect(scene._id).toBe('1');
    expect(dbService.getActiveScene()).toBe(scene);
  });

  it('#findFreeDatabaseName should skip database of no scene that contains documents', async () => {

    // given
    await dbService.writeEntries(dataDB(1), entries);

    // when
    const database = await dbService.findFreeDatabaseName();

    // then
    expect(database).toBe(dataDB(2));
  });

  it('#persistScene should reject without inserting scene when database contains documents', async () => {

    // given
    await dbService.writeEntries(dataDB(1), entries);

    // when
    const persisting = dbService.persistScene(sceneOf('1', dataDB(1)), false);

    // then
    await expect(persisting).rejects.toThrow('Database ' + dataDB(1) + ' is already in use, please try again');
    expect(await dbService.findSceneInfos()).toEqual([]);
  });

  it('#persistScene should reject without inserting scene when another scene refers to its database', async () => {

    // given
    await dbService.persistScene(sceneOf('1', dataDB(1)), false);

    // when
    const persisting = dbService.persistScene(sceneOf('2', dataDB(1)), false);

    // then
    await expect(persisting).rejects.toThrow('Database ' + dataDB(1) + ' is already in use, please try again');
    expect((await dbService.findSceneInfos()).map(si => si._id)).toEqual(['1']);
  });

  it('#persistScene should remove its database when scene cannot be inserted', async () => {

    // given
    const db = dbService['db'];
    const insert = db.insert.bind(db);
    vi.spyOn(db, 'insert').mockImplementation((database, doc) =>
      database === prefix + DBService.SCENES ? Promise.reject(new Error('insert failed')) : insert(database, doc));
    vi.spyOn(db, 'deleteDatabase');

    // when
    const persisting = dbService.persistScene(sceneOf('1', dataDB(1)), false);

    // then
    await expect(persisting).rejects.toThrow('insert failed');
    expect(await db.countDocuments(dataDB(1))).toBe(0);
    expect(db.deleteDatabase).toHaveBeenCalledWith(dataDB(1));
    expect(await dbService.findSceneInfos()).toEqual([]);
  });

  it('#persistScene should remove scene and its database when index cannot be created', async () => {

    // given
    const db = dbService['db'];
    vi.spyOn(db, 'createIndex').mockRejectedValue(new Error('index failed'));
    vi.spyOn(db, 'deleteDatabase');
    const scene = sceneOf('1', dataDB(1));

    // when
    const persisting = dbService.persistScene(scene, false);

    // then
    await expect(persisting).rejects.toThrow('index failed');
    expect(db.deleteDatabase).toHaveBeenCalledWith(dataDB(1));
    expect(await dbService.findSceneInfos()).toEqual([]);
    expect(scene._rev).toBeUndefined();
  });

  it('#persistScene should activate scene only when persisted completely', async () => {

    // given
    vi.spyOn(dbService['db'], 'createIndex').mockRejectedValueOnce(new Error('index failed'));
    const persisting = dbService.persistScene(sceneOf('1', dataDB(1)), true);
    await expect(persisting).rejects.toThrow('index failed');
    expect(dbService.getActiveScene()).toBeUndefined();

    // when
    const scene = await dbService.persistScene(sceneOf('2', dataDB(2)), true);

    // then
    expect(dbService.getActiveScene()).toBe(scene);
  });

  it('#persistScene should reject with original error when incomplete scene cannot be removed', async () => {

    // given
    const db = dbService['db'];
    vi.spyOn(db, 'createIndex').mockRejectedValue(new Error('index failed'));
    vi.spyOn(db, 'deleteDatabase').mockRejectedValue('delete failed');

    // when
    const persisting = dbService.persistScene(sceneOf('1', dataDB(1)), false);

    // then
    await expect(persisting).rejects.toThrow('index failed');
    expect(console.warn).toHaveBeenCalledWith('incompletely persisted scene 1 cannot be removed', 'delete failed');
  });

  it('#deleteScene should emit scene as discarded', async () => {

    // given
    const scene = await dbService.persistScene(sceneOf('1', dataDB(1)), false);
    const discarded = discardedSceneIds();

    // when
    await dbService.deleteScene(scene);

    // then
    expect(discarded).toEqual(['1']);
  });

  it('#deleteScene should keep database used by another scene', async () => {

    // given
    await dbService.persistScene(sceneOf('1', dataDB(1)), false);
    await dbService.writeEntries(dataDB(1), entries);
    const otherScene = await dbService['db'].insert(prefix + DBService.SCENES, sceneOf('2', dataDB(1))) as Scene;

    // when
    await dbService.deleteScene(otherScene);

    // then
    expect(console.warn).toHaveBeenCalledWith('database ' + dataDB(1) + ' of scene 2 is used by another scene, it is kept');
    expect(await dbService['db'].countDocuments(dataDB(1))).toBeGreaterThan(entries.length);
    expect((await dbService.findSceneInfos()).map(si => si._id)).toEqual(['1']);
  });

  it('#requestEntriesPage should count entries as found by sorted query', async () => {

    // given
    await activateSceneWithEntries(columns);
    const query = new Query();
    query.setSort({ active: 'Amount', direction: 'asc' });
    query.setPageDefinition(0, 10);

    // when
    const page = await dbService.requestEntriesPage(query);

    // then
    expect(page.totalRowCount).toBe(4);
    expect(page.entries.map(e => e['ID'])).toEqual([4, 1, 2, 3]);
  });

  it('#requestEntriesPage should count entries again when sort changed', async () => {

    // given
    await activateSceneWithEntries(columns);
    const query = new Query();
    query.setPageDefinition(0, 10);
    const prevPage = await dbService.requestEntriesPage(query);
    const findSpy = vi.spyOn(dbService['db'], 'find');

    // when
    query.setSort({ active: 'Amount', direction: 'desc' });
    const page = await dbService.requestEntriesPage(query, prevPage);

    // then
    expect(findSpy).toHaveBeenCalledTimes(2);
    expect(findSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ fields: ['_id'], sort: [{ Amount: 'desc' }] }));
    expect(page.totalRowCount).toBe(4);
    expect(page.entries.map(e => e['ID'])).toEqual([3, 2, 1, 4]);
  });

  it('#requestEntriesPage should return empty page without querying when full text filter is set and scene has no text column', async () => {

    // given
    await activateSceneWithEntries(columns.filter(c => c.dataType !== DataType.TEXT));
    vi.spyOn(dbService['db'], 'find');
    vi.spyOn(dbService['db'], 'countDocuments');
    const query = new Query();
    query.setFullTextFilter('abc');
    query.setPageDefinition(0, 10);

    // when
    const page = await dbService.requestEntriesPage(query);

    // then
    expect(page.totalRowCount).toBe(0);
    expect(page.entries).toEqual([]);
    expect(dbService['db'].find).not.toHaveBeenCalled();
    expect(dbService['db'].countDocuments).not.toHaveBeenCalled();
  });

  it('#findEntries should search text columns that are not fetched', async () => {

    // given
    await activateSceneWithEntries(columns);
    const query = new Query();
    query.setFullTextFilter('abc');

    // when
    const found = await lastValueFrom(dbService.findEntries(query, true));

    // then
    expect(found.map(e => e['ID'])).toEqual([1, 3]);
    expect(found.every(e => e['Data'] === undefined)).toBe(true);
  });

  it('#findEntries should convert number filter value of column that is not fetched', async () => {

    // given
    await activateSceneWithEntries(columns);
    const query = new Query(new PropertyFilter('Weight', Operator.GREATER_THAN, '5'));

    // when
    const found = await lastValueFrom(dbService.findEntries(query, true));

    // then
    expect(found.map(e => e['ID'])).toEqual([2, 3]);
    expect(found.every(e => e['Weight'] === undefined)).toBe(true);
  });

  it('#findEntries should return no entries without querying when full text filter is set and scene has no text column', async () => {

    // given
    await activateSceneWithEntries(columns.filter(c => c.dataType !== DataType.TEXT));
    vi.spyOn(dbService['db'], 'find');
    const query = new Query();
    query.setFullTextFilter('abc');

    // when
    const found = await lastValueFrom(dbService.findEntries(query, false));

    // then
    expect(found).toEqual([]);
    expect(dbService['db'].find).not.toHaveBeenCalled();
  });

  function dataDB(n: number): string {
    return prefix + DBService.DATA + '_' + n;
  }

  function sceneOf(id: string, database: string, sceneColumns = columns): Scene {
    return { ...SceneFactory.createScene(id, sceneColumns), database };
  }

  async function activateSceneWithEntries(sceneColumns: Column[]): Promise<void> {
    await dbService.persistScene(sceneOf('1', dataDB(1), sceneColumns), true);
    await dbService.writeEntries(dataDB(1), entries);
  }

  function discardedSceneIds(): string[] {
    const ids: string[] = [];
    dbService.sceneDiscarded$.subscribe(id => ids.push(id));
    return ids;
  }
});
