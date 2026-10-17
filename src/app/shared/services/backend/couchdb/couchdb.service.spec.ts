import { HttpErrorResponse, provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ConnectionInfo, Document, Protocol } from 'app/shared/model';
import { lastValueFrom } from 'rxjs';
import { CouchDBConfig } from './couchdb-config';
import { CouchDBService } from './couchdb.service';

describe('CouchDBService', () => {

   const testDBPrefix = 'test_';
   const config = new CouchDBConfig();
   let couchDBService: CouchDBService;

   beforeEach(async () => {
      vi.spyOn(console, 'log').mockReturnValue(undefined);
      TestBed.configureTestingModule({
         providers: [CouchDBService, provideHttpClient(withXhr(), withInterceptorsFromDi())]
      });
      couchDBService = TestBed.inject(CouchDBService);
      await couchDBService.clear(testDBPrefix)
         .then(() => null);
   });

   afterEach(async () => {
      config.reset();
      await couchDBService.initConnection(config.readConnectionInfo()).then(() => null);
   });

   it('#initConnection should store config', async () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'server1', port: 9999, user: 'test', password: 'secret' };
      vi.spyOn(couchDBService, 'listDatabases').mockResolvedValue([]);

      // when
      await couchDBService.initConnection(connInfo).then(() => null);

      // then
      expect(couchDBService.getConnectionInfo()).toEqual(connInfo);
   });

   it('#initConnection should be rejected when connection fails', async () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'server1', port: 9999, user: 'test', password: 'secret' };

      // when
      const connection = couchDBService.initConnection(connInfo);

      // then
      await expect(connection).rejects.toBeDefined();
      expect(couchDBService.getConnectionInfo()).toEqual(connInfo);
   });

   it('#listDatabases should return empty array when no database exists', async () => {

      // when
      await couchDBService.listDatabases()
         .then(dbs => {

            // then
            const testDBs = dbs.filter(db => db.startsWith(testDBPrefix));
            expect(testDBs.length).toBe(0);
         });
   });

   it('#listDatabases should return databases', async () => {

      // given
      await couchDBService.createDatabase(testDBPrefix + 'db10');
      await couchDBService.createDatabase(testDBPrefix + 'db20');

      // when
      await couchDBService.listDatabases()
         .then(dbs => {

            // then
            const testDBs = dbs.filter(db => db.startsWith(testDBPrefix));
            expect(testDBs.length).toBe(2);
            expect(dbs.includes(testDBPrefix + 'db10')).toBe(true);
            expect(dbs.includes(testDBPrefix + 'db20')).toBe(true);
         });
   });

   it('#createDatabase should create database', async () => {

      // when
      const dbName = testDBPrefix + 'db99';
      await couchDBService.createDatabase(testDBPrefix + 'db99');

      // then
      await couchDBService.listDatabases()
         .then(dbs => expect(dbs.includes(dbName)).toBeTruthy());
   });

   it('#getMaxDataItemsPerScene should return max items', async () => {
      expect(couchDBService.getMaxDataItemsPerScene()).toBe(100_000);
   });

   it('#deleteDatabase should be rejected when database is system database', async () => {

      // when
      const deletion = couchDBService.deleteDatabase('_users');

      // then
      await expect(deletion).rejects.toBe('You have no permission to delete the system database _users');
   });

   it('#deleteDatabase should delete database', async () => {

      // given
      await couchDBService.createDatabase(testDBPrefix + 'db100');
      await couchDBService.createDatabase(testDBPrefix + 'db200');

      // when
      await couchDBService.deleteDatabase(testDBPrefix + 'db100').then(() => null)

      // then
      await couchDBService.listDatabases()
         .then(dbs => {
            const testDBs = dbs.filter(db => db.startsWith(testDBPrefix));
            expect(testDBs.length).toBe(1);
            expect(dbs.includes(testDBPrefix + 'db200')).toBe(true);
         });
   });

   it('#createIndex should create design document', async () => {

      // given
      const database = testDBPrefix + 'db';
      await couchDBService.createDatabase(database);

      // when
      await couchDBService.createIndex(database, 'name').then(() => null)

      // when
      await couchDBService.countDocuments(database)
         .then(n => {

            // then
            expect(n).toBe(1);
         });
   });

   it('#insert should insert document', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ];
      await couchDBService.createDatabase(database);
      await couchDBService.insertBulk(database, documents).then(() => null);
      const newDocument = { _id: '4', name: 'd' };


      // when
      await couchDBService.insert(database, newDocument).then(() => null);

      // then
      await couchDBService.findById(database, '4')
         .then(d => checkDocument(d, '4', 'd'));
   });

   it('#insert should throw error when document already exists', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ];
      await couchDBService.createDatabase(database);
      await couchDBService.insertBulk(database, documents).then(() => null);

      // when
      const insertion = couchDBService.insert(database, documents[0]);

      // then
      await expect(insertion).rejects.toBeInstanceOf(HttpErrorResponse);
      await expect(insertion).rejects.toMatchObject({ ok: false, error: { error: 'conflict', reason: 'Document update conflict.' } });
   });

   it('#insertBulk should insert many documents', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await couchDBService.createDatabase(database);

      // when
      await couchDBService.insertBulk(database, documents).then(() => null);

      // then
      const query = { selector: { _id: { $gt: null } }, fields: ['_id', '_rev', 'name'] };
      await lastValueFrom(couchDBService.find(database, query))
         .then(docs => {
            expect(docs).toBeDefined();
            expect(docs.length).toBe(3);
            checkDocument(docs[0], '1', 'a');
            checkDocument(docs[1], '2', 'b');
            checkDocument(docs[2], '3', 'c');
         });
   });

   it('#insertBulk should throw error when documents already exists', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await couchDBService.createDatabase(database);
      await couchDBService.insertBulk(database, documents.slice(1)).then(() => null);

      // when
      const insertion = couchDBService.insertBulk(database, documents);

      // then
      await expect(insertion).rejects.toBe(
         'id: 2, error: conflict, reason: Document update conflict.\n' +
         'id: 3, error: conflict, reason: Document update conflict.');
   });

   it('#update should create document with new revision', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await couchDBService.createDatabase(database);
      await couchDBService.insertBulk(database, documents).then(() => null);
      let docToUpdate: Document;
      await couchDBService.findById(database, '1').then(doc => docToUpdate = doc);
      const initialDocRev = docToUpdate._rev;
      docToUpdate['name'] = 'x';

      // when
      await couchDBService.update(database, docToUpdate).then(() => null);

      // then
      const query = { selector: { _id: '1' }, fields: ['_id', '_rev', 'name'] };
      await lastValueFrom(couchDBService.find(database, query))
         .then(docs => {
            expect(docs).toBeDefined();
            expect(docs.length).toBe(1);
            checkDocument(docs[0], '1', 'x');
            expect(docs[0]._rev).not.toBe(initialDocRev);
         });
   });

   it('#delete should delete document', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await couchDBService.createDatabase(database);
      await couchDBService.insertBulk(database, documents).then(() => null);
      let docToDelete: Document;
      await couchDBService.findById(database, '2').then(doc => docToDelete = doc);

      // when
      await couchDBService.delete(database, docToDelete);

      // then
      await couchDBService.countDocuments(database)
         .then(n => expect(n).toBe(2));
   });

   it('#countDocuments should return number of documents', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await couchDBService.createDatabase(database);
      await couchDBService.insertBulk(database, documents).then(() => null);

      // when
      await couchDBService.countDocuments(database)
         .then(n => {

            // then
            expect(n).toBe(3);
         });
   });

   it('#clear should delete matching databases when prefix is provided', async () => {

      // given
      const databases = ['scenes', 'data_1', testDBPrefix + 'scenes', testDBPrefix + 'data_1', testDBPrefix + 'data_2'];
      vi.spyOn(couchDBService, 'listDatabases').mockResolvedValue(databases);
      vi.spyOn(couchDBService, 'deleteDatabase').mockResolvedValue(undefined);

      // when
      await couchDBService.clear(testDBPrefix);

      // then
      expect(couchDBService.deleteDatabase).toHaveBeenCalledTimes(3);
      expect(couchDBService.deleteDatabase).toHaveBeenCalledWith(testDBPrefix + 'scenes');
      expect(couchDBService.deleteDatabase).toHaveBeenCalledWith(testDBPrefix + 'data_1');
      expect(couchDBService.deleteDatabase).toHaveBeenCalledWith(testDBPrefix + 'data_2');
   });

   it('#clear should delete all non-system databases when no prefix is provided', async () => {

      // given
      const databases = ['scenes', 'data_1', 'data_2'];
      vi.spyOn(couchDBService, 'listDatabases').mockResolvedValue(databases);
      vi.spyOn(couchDBService, 'deleteDatabase').mockImplementation(() => Promise.resolve());

      // when
      await couchDBService.clear();

      // then
      expect(couchDBService.deleteDatabase).toHaveBeenCalledTimes(3);
      expect(couchDBService.deleteDatabase).toHaveBeenCalledWith('scenes');
      expect(couchDBService.deleteDatabase).toHaveBeenCalledWith('data_1');
      expect(couchDBService.deleteDatabase).toHaveBeenCalledWith('data_2');
   });

   function checkDocument(doc: Document, expID: string, expName: string): void {
      expect(doc).toBeDefined();
      expect(doc._id).toBe(expID);
      expect(doc._rev).toBeDefined();
      expect(doc['name']).toBe(expName);
   }
});
