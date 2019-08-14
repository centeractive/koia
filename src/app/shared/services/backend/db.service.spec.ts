import { TestBed, fakeAsync, flush } from '@angular/core/testing';

import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Scene, Query, Column, DataType, Operator, PropertyFilter, Page } from 'app/shared/model';
import { DBService } from './db.service';
import { CouchDBService } from './couchdb';
import { CouchDBConfig } from './couchdb/couchdb-config';
import { SceneFactory } from 'app/shared/test';

describe('DBService', () => {

  const testDBPrefix = 'test_';
  const now = new Date().getTime();
  let columns: Column[];
  let entries: Object[];
  let couchDBService: CouchDBService;
  let dbService: DBService;
  let initialScene: Scene;

  beforeAll(() => {
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
      {
        _id: '5', ID: 5, Time: 1420053120000, Level: 'ERROR', Data: 'ERROR line three', Host: 'local drive',
        Path: '/error.log', Amount: 55
      }
    ];
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [CouchDBService, DBService]
    });
    couchDBService = TestBed.get(CouchDBService);
    spyOn(console, 'log').and.callFake(m => null);
  });

  beforeEach(async () => {
    await couchDBService.clear(testDBPrefix).then(dbs => null).catch(e => fail(e));
    dbService = new DBService(couchDBService);
    dbService.setDbPrefix(testDBPrefix);
    await dbService.initBackend(false).then(r => null).catch(e => fail(e));
    initialScene = SceneFactory.createScene('0', columns);
    await dbService.persistScene(initialScene, true).then(r => null).catch(e => fail(e));
  });

  it('#isBackendInitialized should return true', () => {
    expect(dbService.isBackendInitialized()).toBeTruthy();
  });

  it('#initBackend should be ignored when backend is initialized', async () => {

    // given
    spyOn(couchDBService, 'listDatabases');

    // when
    await dbService.initBackend(false).then(r => null);

    // then
    expect(couchDBService.listDatabases).not.toHaveBeenCalled();
  });

  it('#initBackend should not create scenes DB when it already exists', async () => {

    // given
    spyOn(couchDBService, 'createDatabase');

    // when
    await dbService.initBackend(true).then(r => {

      // then
      expect(couchDBService.createDatabase).not.toHaveBeenCalled();
    });
  });


  it('#initBackend should switch to browser storage when CouchDB access fails', fakeAsync(() => {

    // given
    spyOn(couchDBService, 'listDatabases').and.returnValue(Promise.reject('error'));

    // when
    dbService.initBackend(true).then(r => null);
    flush();

    // then
    expect(console.log).toHaveBeenCalledWith('CouchDB cannot be accessed, browser storage is used instead', 'error');
    expect(dbService.usesBrowserStorage()).toBeTruthy();
    expect(dbService.isBackendInitialized()).toBeTruthy();
  }));

  it('#getActiveScene should return active scene', () => {
    expect(dbService.getActiveScene()).toBe(initialScene);
  });

  it('#useBrowserStorage should switch to browser storage', async () => {

    // when
    await dbService.useBrowserStorage().then(db => {

      // then
      expect(dbService.usesBrowserStorage).toBeTruthy();
    })
      .catch(e => fail(e));
  });

  it('#findFreeDatabaseName should return free name from CouchDB', async () => {

    // when
    await dbService.findFreeDatabaseName()
      .then(db => {

        // then
        expect(db).toBe(testDBPrefix + DBService.DATA + '_1');
      })
      .catch(e => fail(e));
  });

  it('#findFreeDatabaseName should throw error when max number of CouchDB databases is reached', async () => {

    // given
    const databases: string[] = [];
    for (let i = 1; i <= DBService.MAX_DB_COUNT; i++) {
      databases.push(testDBPrefix + DBService.DATA + '_' + i);
    }
    spyOn(couchDBService, 'listDatabases').and.returnValue(Promise.resolve(databases));

    // when
    await dbService.findFreeDatabaseName()
      .then(db => fail(' should have been rejected'))
      .catch(e => {

        // then
        expect(e).toEqual(new Error('No free database table available (maximum of ' + DBService.MAX_DB_COUNT + ' reached)'));
      });
  });

  it('#findFreeDatabaseName should return free name from browser storage', async () => {

    // given
    await dbService.useBrowserStorage();

    // when
    await dbService.findFreeDatabaseName()
      .then(db => {

        // then
        expect(db).toBe(testDBPrefix + DBService.DATA + '_1');
      })
      .catch(e => fail(e));
  });

  it('#getMaxDataItemsPerScene should return value when CouchDB is used', async () => {

    // when
    const maxDataItems = dbService.getMaxDataItemsPerScene();

    // then
    expect(maxDataItems).toBe(100_000);
  });

  it('#getMaxDataItemsPerScene should return value when browser storage is used', async () => {

    // given
    await dbService.useBrowserStorage().then(db => null);

    // when
    const maxDataItems = dbService.getMaxDataItemsPerScene();

    // then
    expect(maxDataItems).toBe(10_000);
  });

  it('#persistScene should persist scene', async () => {

    // given
    const sceneID = '99';

    // when
    await dbService.persistScene(SceneFactory.createScene(sceneID, columns), false).then(s => null);

    // then
    await dbService.findScene(sceneID)
      .then(s => expect(s._id).toBe(sceneID))
      .catch(e => fail(e));
  });

  it('#persistScene should throw error when database cannot be created', async () => {

    // given
    const sceneID = '99';
    spyOn(couchDBService, 'createDatabase').and.throwError('cannot create database');

    // when
    await dbService.persistScene(SceneFactory.createScene(sceneID, columns), false)
      .then(s => fail('should be rejected'))
      .catch(e => {

        // then
        expect(e).toEqual(new Error('cannot create database'));
      });
  });

  it('#persistScene should throw error when index cannot be created', async () => {

    // given
    const sceneID = '99';
    spyOn(couchDBService, 'createIndex').and.throwError('cannot create index');

    // when
    await dbService.persistScene(SceneFactory.createScene(sceneID, columns), false)
      .then(s => fail('should be rejected'))
      .catch(e => {

        // then
        expect(e).toEqual(new Error('cannot create index'));
      });
  });

  it('#activateScene should activate scene', async () => {

    // given
    const scene2 = SceneFactory.createScene('2', columns);
    await dbService.persistScene(SceneFactory.createScene('1', columns), false).then(s => null);
    await dbService.persistScene(scene2, false).then(s => null);
    await dbService.persistScene(SceneFactory.createScene('3', columns), false).then(s => null);

    // when
    await dbService.activateScene(scene2._id)
      .then(s => null)
      .catch(e => fail(e));

    // then
    const activeScene = dbService.getActiveScene();
    expect('2').toEqual(activeScene._id);
    expect('Scene 2').toEqual(activeScene.name);
    expect('Scene 2 Short Description').toEqual(activeScene.shortDescription);
    expect(testDBPrefix + 'data_2').toEqual(activeScene.database);
  });

  it('#activateScene should throw error when scene is already active', async () => {

    // when
    await dbService.activateScene(initialScene._id)
      .then(s => fail('should have been rejected'))
      .catch(e => {

        // then
        expect(e).toBe('scene with id "' + initialScene._id + '" is already active');
      });
  });

  it('#findSceneInfos should return info about all scenes', async () => {

    // given
    await dbService.persistScene(SceneFactory.createScene('1', columns), false).then(s => null).catch(e => fail(e));
    await dbService.persistScene(SceneFactory.createScene('2', columns), false).then(s => null).catch(e => fail(e));
    await dbService.persistScene(SceneFactory.createScene('3', columns), false).then(s => null).catch(e => fail(e));

    // when
    await dbService.findSceneInfos()
      .then(scenes => {

        // then
        expect(scenes).toBeTruthy();
        expect(scenes.length).toBe(4);
        const sceneNames = scenes.map(s => s.name);
        expect(sceneNames.includes(initialScene.name)).toBeTruthy();
        expect(sceneNames.includes('Scene 1')).toBeTruthy();
        expect(sceneNames.includes('Scene 2')).toBeTruthy();
        expect(sceneNames.includes('Scene 3')).toBeTruthy();
      })
      .catch(e => fail(e));
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
      })
      .catch(e => fail(e));
  });

  it('#updateScene should update scene and its _rev', async () => {

    // given
    console.log(JSON.stringify(initialScene));
    const sceneRev = initialScene._rev;
    initialScene.name = 'updated';

    // when
    await dbService.updateScene(initialScene).then(s => null).catch(e => fail(e));

    // then
    expect(initialScene._rev).not.toBe(sceneRev);
    await dbService.findScene(initialScene._id)
      .then(s => expect(s.name).toBe('updated'))
      .catch(e => fail(e));
  });

  it('#deleteScene should delete active scene', async () => {

    // when
    await dbService.deleteScene(initialScene).then(s => null).catch(e => fail(e));

    // then
    expect(dbService.getActiveScene()).toBeUndefined();
    await dbService.findScene(initialScene._id)
      .then(s => fail('scene should not exist anymore: ' + JSON.stringify(s)))
      .catch((e: HttpErrorResponse) => {
        expect(e.ok).toBeFalsy();
        expect(e.status).toBe(404);
        expect(e.statusText).toBe('Object Not Found');
      });
  });

  it('#deleteScene should delete non-active scene', async () => {

    // given
    const scene2 = SceneFactory.createScene('2', columns);
    await dbService.persistScene(scene2, false).then(s => null);

    // when
    await dbService.deleteScene(scene2).then(s => null).catch(e => fail(e));

    // then
    expect(dbService.getActiveScene()).toBe(initialScene);
    await dbService.findScene(scene2._id)
      .then(s => fail('scene should not exist anymore: ' + JSON.stringify(s)))
      .catch((e: HttpErrorResponse) => {
        expect(e.ok).toBeFalsy();
        expect(e.status).toBe(404);
        expect(e.statusText).toBe('Object Not Found');
      });
  });

  it('#deleteScene should throw error when database cannot be deleted', async () => {

    // given
    spyOn(couchDBService, 'deleteDatabase').and.throwError('cannot delete database');

    // when
    await dbService.deleteScene(initialScene)
      .then(s => fail('should be rejected'))
      .catch(e => {

        // then
        expect(e).toEqual(new Error('cannot delete database'));
      });
  });

  it('#writeEntries should write entries', async () => {

    // when
    await dbService.writeEntries(initialScene.database, entries).then(r => null).catch(e => fail(e));

    // then
    await dbService.findEntries(new Query(), false).toPromise()
      .then(data => expect(data.length).toBe(5))
      .catch(err => fail(err));
  });

  it('#countEntriesOfActiveScene should return number of documents', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(r => null).catch(e => fail(e));

    // when
    await dbService.countEntriesOfActiveScene()
      .then(count => {

        // then
        expect(count).toBe(5);
      })
      .catch(err => fail(err));
  });

  it('#requestEntriesPage should return empty page when no matching entries exist', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(r => null).catch(e => fail(e));

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
      })
      .catch(err => fail(err));
  });

  it('#requestEntriesPage should return first page with new context', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(r => null).catch(e => fail(e));

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
      })
      .catch(err => fail(err));
  });

  it('#requestEntriesPage should return first page with matching entries', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(r => null).catch(e => fail(e));

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
      })
      .catch(err => fail(err));
  });

  it('#requestEntriesPage should return second page with same context', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(r => null).catch(e => fail(e));
    const query = new Query();
    query.setPageDefinition(0, 2);
    let prevPage: Page;
    await dbService.requestEntriesPage(query)
      .then(page => prevPage = page)
      .catch(err => fail(err));

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
      })
      .catch(err => fail(err));
  });

  it('#findEntries should return filtered entries when full text filter is set', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(r => null).catch(e => fail(e));
    const query = new Query();
    query.setFullTextFilter('warn');

    // when
    await dbService.findEntries(query, true).toPromise()
      .then(docs => {

        // then
        expect(docs.length).toBe(1);
        expect(docs[0]['Level']).toBe('WARN');
      })
      .catch(err => fail(err));
  });

  it('#findEntries should return filtered entries when two contains filter on same column exist', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries.slice(0)).then(r => null).catch(e => fail(e));
    const query = new Query();
    query.addPropertyFilter(new PropertyFilter('Data', Operator.CONTAINS, 'w'));
    query.addPropertyFilter(new PropertyFilter('Data', Operator.CONTAINS, 'o'));

    // when
    await dbService.findEntries(query, false).toPromise()
      .then(docs => {

        // then
        expect(docs.length).toBe(2);
        expect(docs[0]['Data']).toBe('WARN line one');
        expect(docs[1]['Data']).toBe('ERROR line two');
      })
      .catch(err => fail(err));
  });

  it('#numberRangeOf should return undefined time range when no entries exist', async () => {

    // when
    await dbService.numberRangeOf(findColumn('Time'))
      .then(vr => {

        // then
        expect(vr.min).toBeUndefined();
        expect(vr.max).toBeUndefined();
      })
      .catch(e => fail(e));
  });

  it('#numberRangeOf should return time range when entries exist', async () => {

    // given
    await dbService.writeEntries(initialScene.database, entries).then(r => null).catch(e => fail(e));

    // when
    await dbService.numberRangeOf(findColumn('Time'))
      .then(vr => {

        // then
        expect(vr.min).toBe(entries[0]['Time']);
        expect(vr.max).toBe(entries[entries.length - 1]['Time']);
      })
      .catch(e => fail(e));
  });

  function findColumn(name: string): Column {
    return columns.find(c => c.name === name);
  }
});
