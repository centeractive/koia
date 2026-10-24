import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { Column, ComputeOperator, DataType, Operator, Page, PropertyFilter, Query, Scene } from 'app/shared/model';
import { SceneTabs, ViewType } from 'app/shared/model/view-config';
import { SceneFactory } from 'app/shared/test';
import { lastValueFrom, throwError } from 'rxjs';
import { CouchDBService } from './couchdb';
import { CouchDBConfig } from './couchdb/couchdb-config';
import { DBService } from './db.service';

describe('DBService', () => {

  const testDBPrefix = 'test_';
  let columns: Column[];
  let entries: object[];
  let couchDBService: CouchDBService;
  let dbService: DBService;
  let initialScene: Scene;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockReturnValue(undefined);
    vi.spyOn(console, 'warn').mockReturnValue(undefined);
    new CouchDBConfig().reset();
    columns = [
      { name: 'ID', dataType: DataType.NUMBER, width: 10, indexed: true },
      { name: 'Time', dataType: DataType.TIME, width: 50, indexed: true },
      { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
      { name: 'Data', dataType: DataType.TEXT, width: 400, indexed: false },
      { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
      { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
      { name: 'Amount', dataType: DataType.NUMBER, width: 50, indexed: true }
    ];
    entries = [
      { _id: '1', ID: 1, Time: 1420053116000, Level: 'INFO', Data: 'INFO line one', Host: 'local drive', Path: '/info.log', Amount: 11 },
      { _id: '2', ID: 2, Time: 1420053117000, Level: 'WARN', Data: 'WARN line one', Host: 'local drive', Path: '/warn.log', Amount: 22 },
      { _id: '3', ID: 3, Time: 1420053118000, Level: 'ERROR', Data: 'ERROR line one', Host: 'local drive', Path: '/error.log', Amount: 33 },
      { _id: '4', ID: 4, Time: 1420053119000, Level: 'ERROR', Data: 'ERROR line two', Host: 'local drive', Path: '/error.log', Amount: 44 },
      { _id: '5', ID: 5, Time: 1420053120000, Level: 'ERROR', Data: 'ERROR line three', Host: 'local drive', Path: '/error.log', Amount: 55 }
    ];
    TestBed.configureTestingModule({
      providers: [CouchDBService, DBService, provideHttpClient(withXhr(), withInterceptorsFromDi())]
    });
    couchDBService = TestBed.inject(CouchDBService);
  });

  beforeEach(async () => {
    dbService = new DBService(couchDBService);
    await couchDBService.clear(testDBPrefix)
      .then(() => {
        dbService = new DBService(couchDBService);
        dbService.setDbPrefix(testDBPrefix);
        return dbService.initBackend(false);
      })
      .then(() => {
        initialScene = SceneFactory.createScene('0', columns);
        return dbService.persistScene(initialScene, true);
      })
      .then(() => null);
  });

  it('#isBackendInitialized should return true', () => {
    expect(dbService.isBackendInitialized()).toBe(true);
  });

  it('#initBackend should be ignored when backend is already initialized', async () => {

    // given
    vi.spyOn(couchDBService, 'listDatabases').mockReturnValue(undefined);

    // when
    await dbService.initBackend(false).then(() => null);

    // then
    expect(couchDBService.listDatabases).not.toHaveBeenCalled();
  });

  it('#initBackend should not create scenes DB when it already exists', async () => {

    // given
    vi.spyOn(couchDBService, 'createDatabase').mockReturnValue(undefined);

    // when
    await dbService.initBackend(true).then(() => {

      // then
      expect(couchDBService.createDatabase).not.toHaveBeenCalled();
    });
  });


  it('#initBackend should switch to IndexedDB when CouchDB access fails', fakeAsync(() => {

    // given
    vi.spyOn(couchDBService, 'listDatabases').mockRejectedValue('error');

    // when
    dbService.initBackend(true).then(() => null);
    flush();

    // then
    expect(console.warn).toHaveBeenCalledWith('CouchDB cannot be accessed, browser storage is used instead', 'error');
    expect(dbService.isIndexedDbInUse()).toBe(true);
    expect(dbService.isCouchDbInUse()).toBe(false);
    expect(dbService.isBackendInitialized()).toBe(true);
  }));

  it('#getActiveScene should return active scene', () => {
    expect(dbService.getActiveScene()).toBe(initialScene);
  });

  it('#isIndexedDbInUse should switch to IndexedDB', async () => {

    // when
    await dbService.useIndexedDb().then(() => {

      // then
      expect(dbService.useIndexedDb).toBeTruthy();

    });
  });

  it('#findFreeDatabaseName should return free name from CouchDB', async () => {

    // when
    await dbService.findFreeDatabaseName()
      .then(db => {

        // then
        expect(db).toBe(testDBPrefix + DBService.DATA + '_1');

      });
  });

  it('#findFreeDatabaseName should throw error when max number of CouchDB databases is reached', async () => {

    // given
    const databases: string[] = [];
    for (let i = 1; i <= DBService.MAX_DB_COUNT; i++) {
      databases.push(testDBPrefix + DBService.DATA + '_' + i);
    }
    vi.spyOn(couchDBService, 'listDatabases').mockResolvedValue(databases);

    // when
    const freeName = dbService.findFreeDatabaseName();

    // then
    await expect(freeName).rejects.toThrow(expect.objectContaining({ message: 'No free database table available (maximum of ' + DBService.MAX_DB_COUNT + ' reached)' }));
  });

  it('#findFreeDatabaseName should return free name from IndexedDB', async () => {

    // given
    await dbService.useIndexedDb();
    await initWithSingleDatabase();

    // when
    await dbService.findFreeDatabaseName()
      .then(db => {

        // then
        expect(db).toBe(testDBPrefix + DBService.DATA + '_2');

      });
  });

  it('#getMaxDataItemsPerScene should return value when CouchDB is used', async () => {

    // when
    const maxDataItems = dbService.getMaxDataItemsPerScene();

    // then
    expect(maxDataItems).toBe(100_000);
  });

  it('#getMaxDataItemsPerScene should return undefined when storage is not defined', async () => {

    // when
    const maxDataItems = new DBService(couchDBService).getMaxDataItemsPerScene();

    // then
    expect(maxDataItems).toBeUndefined();
  });

  it('#getMaxDataItemsPerScene should return value when IndexedDB is used', async () => {

    // given
    await dbService.useIndexedDb().then(() => null);

    // when
    const maxDataItems = dbService.getMaxDataItemsPerScene();

    // then
    expect(maxDataItems).toBe(10_000);
  });

  it('#persistScene should persist scene', async () => {

    // given
    const sceneID = '99';

    // when
    await dbService.persistScene(SceneFactory.createScene(sceneID, columns), false).then(() => null);

    // then
    await dbService.findScene(sceneID)
      .then(s => expect(s._id).toBe(sceneID));
  });

  it('#persistScene should throw error when database cannot be created', async () => {

    // given
    const sceneID = '99';
    vi.spyOn(couchDBService, 'createDatabase').mockImplementation(() => { throw new Error('cannot create database'); });

    // when
    const persistence = dbService.persistScene(SceneFactory.createScene(sceneID, columns), false);

    // then
    await expect(persistence).rejects.toThrow(expect.objectContaining({ message: 'cannot create database' }));
  });

  it('#persistScene should throw error when index cannot be created', async () => {

    // given
    const sceneID = '99';
    vi.spyOn(couchDBService, 'createIndex').mockImplementation(() => { throw new Error('cannot create index'); });

    // when
    const persistence = dbService.persistScene(SceneFactory.createScene(sceneID, columns), false);

    // then
    await expect(persistence).rejects.toThrow(expect.objectContaining({ message: 'cannot create index' }));
  });

  it('#activateScene should activate scene', async () => {

    // given
    const scene2 = SceneFactory.createScene('2', columns);
    await dbService.persistScene(SceneFactory.createScene('1', columns), false).then(() => null);
    await dbService.persistScene(scene2, false).then(() => null);
    await dbService.persistScene(SceneFactory.createScene('3', columns), false).then(() => null);

    // when
    await dbService.activateScene(scene2._id)
      .then(() => null);

    // then
    const activeScene = dbService.getActiveScene();
    expect('2').toEqual(activeScene._id);
    expect('Scene 2').toEqual(activeScene.name);
    expect('Scene 2 Short Description').toEqual(activeScene.shortDescription);
    expect(testDBPrefix + 'data_2').toEqual(activeScene.database);
  });

  it('#activateScene should throw error when scene is already active', async () => {

    // when
    const activation = dbService.activateScene(initialScene._id);

    // then
    await expect(activation).rejects.toBe('scene with id "' + initialScene._id + '" is already active');
  });

  it('#activateScene should persist activation time', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    const before = Date.now();

    // when
    await dbService.activateScene(scene._id);

    // then
    const activationTimes = await dbService.findSceneActivationTimes();
    expect(activationTimes.size).toBe(1);
    expect(activationTimes.get(scene._id)).toBeGreaterThanOrEqual(before);
  });

  it('#activateScene should update activation time on re-activation', async () => {

    // given
    const sceneA = SceneFactory.createScene('1', columns);
    const sceneB = SceneFactory.createScene('2', columns);
    await dbService.persistScene(sceneA, false);
    await dbService.persistScene(sceneB, false);
    await dbService.activateScene(sceneA._id);
    await dbService.activateScene(sceneB._id);
    const before = Date.now();

    // when
    await dbService.activateScene(sceneA._id);

    // then
    const activationTimes = await dbService.findSceneActivationTimes();
    expect(activationTimes.size).toBe(2);
    expect(activationTimes.get(sceneA._id)).toBeGreaterThanOrEqual(before);
    expect(activationTimes.get(sceneB._id)).toBeLessThanOrEqual(activationTimes.get(sceneA._id));
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('#activateScene should not change revision of scene', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    const rev = scene._rev;

    // when
    await dbService.activateScene(scene._id);

    // then
    expect((await dbService.findScene(scene._id))._rev).toBe(rev);
  });

  it('#activateScene should activate scene when activation time cannot be saved', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    vi.spyOn(dbService['db'], 'insert').mockRejectedValue({ status: 500 });

    // when
    const activeScene = await dbService.activateScene(scene._id);

    // then
    expect(activeScene._id).toBe(scene._id);
    expect(dbService.getActiveScene()).toBe(activeScene);
    expect(console.warn).toHaveBeenCalledWith('activation time of scene ' + scene._id + ' cannot be saved', { status: 500 });
  });

  it('#activateScene should reject versioned scene violating its format', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    await dbService.updateScene({ ...scene, schemaVersion: '1.0', database: '' });

    // when
    const activation = dbService.activateScene(scene._id);

    // then
    await expect(activation).rejects.toBe('scene does not comply with scene format 1.0:\n/database: must NOT have fewer than 1 characters');
    expect(dbService.getActiveScene()._id).toBe(initialScene._id);
  });

  it('#activateScene should reject scene of unsupported format version', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    await dbService.updateScene({ ...scene, schemaVersion: '9.0' });

    // when
    const activation = dbService.activateScene(scene._id);

    // then
    await expect(activation).rejects.toBe('scene format 9.0 is not supported by this Koia version (supported: 1.0)');
  });

  it('#activateScene should activate legacy scene violating format and warn', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    await dbService.updateScene({ ...scene, database: '' });

    // when
    const activeScene = await dbService.activateScene(scene._id);

    // then
    expect(activeScene._id).toBe(scene._id);
    expect(console.warn).toHaveBeenCalledWith('scene 1 does not comply with scene format 1.0',
      [{ path: '/database', message: 'must NOT have fewer than 1 characters' }]);
  });

  it('#activateScene should default missing config', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    delete scene.config;
    await dbService.updateScene(scene);

    // when
    const activeScene = await dbService.activateScene(scene._id);

    // then
    expect(activeScene.config).toEqual({});
  });

  it('#activateScene should accept versioned scene extended by Koia', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    const computedColumn: Column = {
      name: 'Double', dataType: DataType.NUMBER, width: 10,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.ADD, rightColumn: 'Amount' }
    };
    const savedView = { name: 'Overview', modifiedTime: 1, tabs: [], rawData: undefined };
    await dbService.updateScene({ ...scene, schemaVersion: '1.0', columns: [...columns, computedColumn], config: { savedViews: [savedView] } });

    // when
    const activeScene = await dbService.activateScene(scene._id);

    // then
    expect(activeScene.columns.at(-1)).toEqual(computedColumn);
    expect(console.warn).not.toHaveBeenCalled();
  });

  it('#findSceneActivationTimes should return empty map when no scene was activated', async () => {

    // when
    const activationTimes = await dbService.findSceneActivationTimes();

    // then
    expect(activationTimes.size).toBe(0);
  });

  it('#findSceneActivationTimes should return empty map when activation times cannot be read', async () => {

    // given
    const error = new Error('find failed');
    vi.spyOn(dbService['db'], 'find').mockReturnValue(throwError(() => error));

    // when
    const activationTimes = await dbService.findSceneActivationTimes();

    // then
    expect(activationTimes.size).toBe(0);
    expect(console.warn).toHaveBeenCalledWith('activation times of scenes cannot be read', error);
  });

  it('#findSceneInfos should not include activation documents', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    await dbService.activateScene(scene._id);

    // when
    const sceneInfos = await dbService.findSceneInfos();

    // then
    expect(sceneInfos.map(si => si._id).sort()).toEqual([initialScene._id, scene._id].sort());
  });

  it('#findSceneInfos should return info about all scenes', async () => {

    // given
    await dbService.persistScene(SceneFactory.createScene('1', columns), false).then(() => null);
    await dbService.persistScene(SceneFactory.createScene('2', columns), false).then(() => null);
    await dbService.persistScene(SceneFactory.createScene('3', columns), false).then(() => null);

    // when
    await dbService.findSceneInfos()
      .then(scenes => {

        // then
        expect(scenes).toBeTruthy();
        expect(scenes.length).toBe(4);
        const sceneNames = scenes.map(s => s.name);
        expect(sceneNames.includes(initialScene.name)).toBe(true);
        expect(sceneNames.includes('Scene 1')).toBe(true);
        expect(sceneNames.includes('Scene 2')).toBe(true);
        expect(sceneNames.includes('Scene 3')).toBe(true);
      });
  });

  it('#createScene should enrich scene with _id and _rev', async () => {

    // given
    const scene: Scene = SceneFactory.createScene('1', columns);
    scene._id = undefined;

    // when
    await dbService.persistScene(scene, false)
      .then(s => {

        // then
        expect(s._id).toBeDefined();
        expect(s._rev).toBeDefined();
      });
  });

  it('#updateScene should update scene and its _rev', async () => {

    // given
    const sceneRev = initialScene._rev;
    initialScene.name = 'updated';

    // when
    await dbService.updateScene(initialScene)
      .then(() => null);

    // then
    expect(initialScene._rev).not.toBe(sceneRev);
    await dbService.findScene(initialScene._id)
      .then(s => expect(s.name).toBe('updated'));
  });

  it('#updateSceneLabels should update name and short description only', async () => {

    // given
    const scene2 = SceneFactory.createScene('2', columns);
    await dbService.persistScene(scene2, false);

    // when
    await dbService.updateSceneLabels({ _id: scene2._id, name: 'new name', shortDescription: 'new description' });

    // then
    const persisted = await dbService.findScene(scene2._id);
    expect(persisted.name).toBe('new name');
    expect(persisted.shortDescription).toBe('new description');
    expect(persisted.columns).toEqual(scene2.columns);
    expect(persisted.database).toBe(scene2.database);
    expect(persisted.creationTime).toBe(scene2.creationTime);
    expect(dbService.getActiveScene()).toBe(initialScene);
    expect(initialScene.name).toBe('Scene 0');
  });

  it('#updateSceneLabels should update active scene in place with new revision', async () => {

    // when
    await dbService.updateSceneLabels({ _id: initialScene._id, name: 'new name', shortDescription: 'new description' });

    // then
    const persisted = await dbService.findScene(initialScene._id);
    expect(dbService.getActiveScene()).toBe(initialScene);
    expect(initialScene.name).toBe('new name');
    expect(initialScene.shortDescription).toBe('new description');
    expect(initialScene._rev).toBe(persisted._rev);
    await expect(dbService.updateScene(dbService.getActiveScene())).resolves.toBe(initialScene);
  });

  it('#updateSceneLabels should keep active scene unchanged when update fails', async () => {

    // given
    const sceneRev = initialScene._rev;
    vi.spyOn(dbService, 'updateScene').mockRejectedValue('conflict');

    // when
    const update = dbService.updateSceneLabels({ _id: initialScene._id, name: 'new name', shortDescription: 'new description' });

    // then
    await expect(update).rejects.toBe('conflict');
    expect(dbService.getActiveScene().name).toBe('Scene 0');
    expect(dbService.getActiveScene()._rev).toBe(sceneRev);
  });

  it('#deleteScene should delete active scene', async () => {

    // when
    await dbService.deleteScene(initialScene)
      .then(() => null);

    // then
    expect(dbService.getActiveScene()).toBeUndefined();
    await expect(dbService.findScene(initialScene._id)).rejects.toMatchObject({ ok: false, status: 404, statusText: 'Object Not Found' });
  });

  it('#deleteScene should delete non-active scene', async () => {

    // given
    const scene2 = SceneFactory.createScene('2', columns);
    await dbService.persistScene(scene2, false).then(() => null);

    // when
    await dbService.deleteScene(scene2).then(() => null);

    // then
    expect(dbService.getActiveScene()).toBe(initialScene);
    await expect(dbService.findScene(scene2._id)).rejects.toMatchObject({ ok: false, status: 404, statusText: 'Object Not Found' });
  });

  it('#deleteScene should throw error when database cannot be deleted', async () => {

    // given
    vi.spyOn(couchDBService, 'deleteDatabase').mockImplementation(() => { throw new Error('cannot delete database'); });

    // when
    const deletion = dbService.deleteScene(initialScene);

    // then
    await expect(deletion).rejects.toThrow(expect.objectContaining({ message: 'cannot delete database' }));
  });

  it('#deleteScene should delete open tabs of scene', async () => {

    // given
    await dbService.saveSceneTabs(sceneTabs(initialScene, 'tab1'));

    // when
    await dbService.deleteScene(initialScene);

    // then
    await expect(dbService.findSceneTabs(initialScene._id)).resolves.toBeUndefined();
  });

  it('#deleteScene should delete activation time of scene', async () => {

    // given
    const scene = SceneFactory.createScene('1', columns);
    await dbService.persistScene(scene, false);
    await dbService.activateScene(scene._id);

    // when
    await dbService.deleteScene(scene);

    // then
    const activationTimes = await dbService.findSceneActivationTimes();
    expect(activationTimes.has(scene._id)).toBe(false);
  });

  it('#deleteScene should resolve when open tabs cannot be deleted', async () => {

    // given
    vi.spyOn(couchDBService, 'findById').mockRejectedValue({ status: 500 });

    // when
    const deletion = dbService.deleteScene(initialScene);

    // then
    await expect(deletion).resolves.toBeUndefined();
    expect(console.warn).toHaveBeenCalledWith('open tabs of scene ' + initialScene._id + ' cannot be deleted', { status: 500 });
  });

  it('#findSceneTabs should return undefined when no open tabs were persisted', async () => {

    // when
    const result = dbService.findSceneTabs(initialScene._id);

    // then
    await expect(result).resolves.toBeUndefined();
  });

  it('#findSceneTabs should throw error other than not found', async () => {

    // given
    vi.spyOn(couchDBService, 'findById').mockRejectedValue({ status: 500 });

    // when
    const result = dbService.findSceneTabs(initialScene._id);

    // then
    await expect(result).rejects.toEqual({ status: 500 });
  });

  it('#saveSceneTabs should insert open tabs', async () => {

    // given
    const doc = sceneTabs(initialScene, 'tab1');

    // when
    await dbService.saveSceneTabs(doc);

    // then
    expect(doc._rev).toBeDefined();
    const found = await dbService.findSceneTabs(initialScene._id);
    expect(found.tabs).toEqual(doc.tabs);
  });

  it('#saveSceneTabs should update open tabs', async () => {

    // given
    const doc = sceneTabs(initialScene, 'tab1');
    await dbService.saveSceneTabs(doc);
    const rev = doc._rev;
    doc.tabs = sceneTabs(initialScene, 'tab1', 'tab2').tabs;

    // when
    await dbService.saveSceneTabs(doc);

    // then
    expect(doc._rev).not.toBe(rev);
    const found = await dbService.findSceneTabs(initialScene._id);
    expect(found.tabs.map(t => t.id)).toEqual(['tab1', 'tab2']);
  });

  it('#saveSceneTabs should resolve revision conflict once', async () => {

    // given
    await dbService.saveSceneTabs(sceneTabs(initialScene, 'tab1'));
    const staleDoc = sceneTabs(initialScene, 'tab3');

    // when
    await dbService.saveSceneTabs(staleDoc);

    // then
    const found = await dbService.findSceneTabs(initialScene._id);
    expect(found.tabs.map(t => t.id)).toEqual(['tab3']);
  });

  it('#saveSceneTabs should throw conflict when open tabs were deleted meanwhile', async () => {

    // given
    vi.spyOn(couchDBService, 'insert').mockRejectedValue({ status: 409 });
    vi.spyOn(couchDBService, 'findById').mockRejectedValue({ status: 404 });

    // when
    const result = dbService.saveSceneTabs(sceneTabs(initialScene, 'tab1'));

    // then
    await expect(result).rejects.toEqual({ status: 409 });
    expect(couchDBService.insert).toHaveBeenCalledTimes(1);
  });

  it('#saveSceneTabs should throw error other than conflict', async () => {

    // given
    vi.spyOn(couchDBService, 'insert').mockRejectedValue({ status: 500 });

    // when
    const result = dbService.saveSceneTabs(sceneTabs(initialScene, 'tab1'));

    // then
    await expect(result).rejects.toEqual({ status: 500 });
  });

  it('#writeEntries should write entries', async () => {

    // when
    await dbService.writeEntries(initialScene.database, entries).then(() => null);

    // then
    await lastValueFrom(dbService.findEntries(new Query(), false))
      .then(data => expect(data.length).toBe(5));
  });

  it('#countEntriesOfActiveScene should return number of documents', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(() => null);

    // when
    await dbService.countEntriesOfActiveScene()
      .then(count => {

        // then
        expect(count).toBe(5);
      });
  });

  it('#requestEntriesPage should return empty page when no matching entries exist', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(() => null);

    // when
    const query = new Query(new PropertyFilter('Level', Operator.EQUAL, 'xyz'));
    query.setPageDefinition(0, 2);
    await dbService.requestEntriesPage(query)
      .then(page => {

        // then
        expect(page.entries.length).toBe(0);
        expect(page.totalRowCount).toBe(0);
        expect(page.query).not.toBe(query);
        expect(page.query).toEqual(query);
      });
  });

  it('#requestEntriesPage should return first page with new context', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(() => null);

    // when
    const query = new Query();
    query.setPageDefinition(0, 2);
    await dbService.requestEntriesPage(query)
      .then(page => {

        // then
        expect(page.entries.length).toBe(2);
        expect(page.entries.map(e => e['ID'])).toEqual([1, 2]);
        expect(page.totalRowCount).toBe(5);
        expect(page.query).not.toBe(query);
        expect(page.query).toEqual(query);
      });
  });

  it('#requestEntriesPage should return first page with matching entries', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(() => null);

    // when
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Level', Operator.NOT_EQUAL, 'WARN'));
    query.addPropertyFilter(new PropertyFilter('Level', Operator.NOT_EQUAL, 'ERROR'));

    query.setPageDefinition(0, 2);
    await dbService.requestEntriesPage(query)
      .then(page => {

        // then
        expect(page.entries.length).toBe(1);
        expect(page.entries.map(e => e['Level'])).toEqual(['INFO']);
        expect(page.totalRowCount).toBe(1);
        expect(page.query).not.toBe(query);
        expect(page.query).toEqual(query);
      });
  });

  it('#requestEntriesPage should return second page with same context', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    const query = new Query();
    query.setPageDefinition(0, 2);
    let prevPage: Page;
    await dbService.requestEntriesPage(query)
      .then(page => prevPage = page);

    // when
    query.setPageDefinition(1, 2);
    await dbService.requestEntriesPage(query, prevPage)
      .then(page => {

        // then
        expect(page.entries.length).toBe(2);
        expect(page.entries.map(e => e['ID'])).toEqual([3, 4]);
        expect(page.totalRowCount).toBe(5);
        expect(page.query).not.toBe(query);
        expect(page.query).toEqual(query);
      });
  });

  it('#findEntries should return filtered entries when full text filter is set', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    const query = new Query();
    query.setFullTextFilter('warn');

    // when
    await lastValueFrom(dbService.findEntries(query, true))
      .then(docs => {

        // then
        expect(docs.length).toBe(1);
        expect(docs[0]['Level']).toBe('WARN');
      });
  });

  it('#findEntries should return filtered entries when two contains filter on same column exist', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Data', Operator.CONTAINS, 'w'));
    query.addPropertyFilter(new PropertyFilter('Data', Operator.CONTAINS, 'o'));

    // when
    await lastValueFrom(dbService.findEntries(query, false))
      .then(docs => {

        // then
        expect(docs.length).toBe(2);
        expect(docs[0]['Data']).toBe('WARN line one');
        expect(docs[1]['Data']).toBe('ERROR line two');
      });
  });

  it('#findEntries should not include computed columns in fields of query', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    initialScene.columns.push(computedColumn());
    const findSpy = vi.spyOn(couchDBService, 'find');

    // when
    const docs = await lastValueFrom(dbService.findEntries(new Query(), false));

    // then
    expect(findSpy.mock.calls[0][1]['fields']).toEqual(['_id', 'ID', 'Time', 'Level', 'Data', 'Host', 'Path', 'Amount']);
    expect(docs.length).toBe(5);
    expect(docs[0]['Share']).toBeUndefined();
  });

  it('#findEntriesWithComputedValues should add values of computed columns', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    initialScene.columns.push(computedColumn());

    // when
    const docs = await lastValueFrom(dbService.findEntriesWithComputedValues(new Query(), true));

    // then
    expect(docs.map(d => d['Share'])).toEqual([12, 24, 36, 48, 60]);
  });

  it('#requestEntriesPage should return values of computed columns', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    initialScene.columns.push(computedColumn());
    const query = new Query();
    query.setPageDefinition(0, 2);
    const firstPage = await dbService.requestEntriesPage(query);
    query.setPageDefinition(1, 2);

    // when
    const secondPage = await dbService.requestEntriesPage(query, firstPage);

    // then
    expect(firstPage.entries.map(e => e['Share'])).toEqual([12, 24]);
    expect(secondPage.entries.map(e => e['Share'])).toEqual([36, 48]);
  });

  it('#requestEntriesPage should count full text filtered entries when computed column exists', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(() => null);
    initialScene.columns.push(computedColumn());
    const query = new Query();
    query.setFullTextFilter('error');
    query.setPageDefinition(0, 2);

    // when
    const page = await dbService.requestEntriesPage(query);

    // then
    expect(page.totalRowCount).toBe(3);
    expect(page.entries.map(e => e['Share'])).toEqual([36, 48]);
  });

  it('#countEntriesOfActiveScene should ignore computed columns', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(() => null);
    initialScene.columns.push(computedColumn());

    // when
    const count = await dbService.countEntriesOfActiveScene();

    // then
    expect(count).toBe(5);
  });

  it('#numberRangeOf should return undefined time range when no entries exist', async () => {

    // when
    await dbService.numberRangeOf(findColumn('Time'))
      .then(vr => {

        // then
        expect(vr.min).toBeUndefined();
        expect(vr.max).toBeUndefined();
      });
  });

  it('#numberRangeOf should return time range when entries exist', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(() => null);

    // when
    await dbService.numberRangeOf(findColumn('Time'))
      .then(vr => {

        // then
        expect(vr.min).toBe(entries[0]['Time']);
        expect(vr.max).toBe(entries[entries.length - 1]['Time']);
      });
  });

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }

  function computedColumn(): Column {
    return {
      name: 'Share', dataType: DataType.NUMBER, width: 10, indexed: false,
      computation: { leftColumn: 'Amount', operator: ComputeOperator.ADD, rightColumn: 'ID' }
    };
  }

  function sceneTabs(scene: Scene, ...tabIds: string[]): SceneTabs {
    return {
      _id: DBService.sceneTabsId(scene._id),
      tabs: tabIds.map(id => ({ id, type: ViewType.PIVOT, title: id }))
    };
  }

  async function initWithSingleDatabase() {
    let dbOneExists = false;
    await dbService.findSceneInfos()
      .then(r => r.forEach(si => {
        if (si._id === '1') {
          dbOneExists = true;
        } else {
          dbService.deleteScene(si);
        }
      }));
    if (!dbOneExists) {
      const scene = SceneFactory.createScene('1', columns);
      await dbService.persistScene(scene, true)
        .then(() => null);
    }
  }

});
