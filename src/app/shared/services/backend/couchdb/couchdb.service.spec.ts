import { TestBed, fakeAsync, flush } from '@angular/core/testing';
import { CouchDBService } from './couchdb.service';
import { HttpClientModule, HttpErrorResponse } from '@angular/common/http';
import { Document, ConnectionInfo } from 'app/shared/model';
import { CouchDBConfig } from './couchdb-config';

describe('CouchDBService', () => {

   const testDBPrefix = 'test_';
   const couchDBConfig = new CouchDBConfig();
   let dbService: CouchDBService;

   beforeAll(() => {
      couchDBConfig.reset();
      TestBed.configureTestingModule({
         imports: [HttpClientModule],
         providers: [CouchDBService]
      });
      dbService = TestBed.get(CouchDBService);
      spyOn(console, 'log').and.callFake(m => null);
   });

   beforeEach(async () => {
      await dbService.clear(testDBPrefix)
         .then(r => null)
         .catch(e => fail(e));
   });

   afterEach(async() => {
      couchDBConfig.reset();
      await dbService.initConnection(couchDBConfig.readConnectionInfo()).then(r => null);
   });

   it('#initConnection should store config', fakeAsync(() => {

      // given
      const connInfo: ConnectionInfo = { host: 'server1', port: 9999, user: 'test', password: 'secret' };
      spyOn(dbService, 'listDatabases').and.returnValue(Promise.resolve());

      // when
      dbService.initConnection(connInfo).then(dbs => null);
      flush();

      // then
      expect(couchDBConfig.readConnectionInfo()).toEqual(connInfo);
   }));

   it('#listDatabases should return empty array when no database exists', async () => {

      // when
      await dbService.listDatabases()
         .then(dbs => {

            // then
            const testDBs = dbs.filter(db => db.startsWith(testDBPrefix));
            expect(testDBs.length).toBe(0);
         })
         .catch(e => fail(e));
   });

   it('#listDatabases should return databases', async () => {

      // given
      await dbService.createDatabase(testDBPrefix + 'db1');
      await dbService.createDatabase(testDBPrefix + 'db2');

      // when
      await dbService.listDatabases()
         .then(dbs => {

            // then
            const testDBs = dbs.filter(db => db.startsWith(testDBPrefix));
            expect(testDBs.length).toBe(2);
            expect(dbs.includes(testDBPrefix + 'db1')).toBeTruthy();
            expect(dbs.includes(testDBPrefix + 'db2')).toBeTruthy();
         })
         .catch(e => fail(e));
   });

   it('#deleteDatabase should be rejected when database is system database', async () => {

      // when
      await dbService.deleteDatabase('_users')
         .then(() => fail('should have been rejected'))
         .catch(e => {

            // then
            expect(e).toBe('You have no permission to delete the system database _users');
         });
   });

   it('#deleteDatabase should delete database', async () => {

      // given
      await dbService.createDatabase(testDBPrefix + 'db1');
      await dbService.createDatabase(testDBPrefix + 'db2');

      // when
      await dbService.deleteDatabase(testDBPrefix + 'db1').then(() => null)

      // then
      await dbService.listDatabases()
         .then(dbs => {
            const testDBs = dbs.filter(db => db.startsWith(testDBPrefix));
            expect(testDBs.length).toBe(1);
            expect(dbs.includes(testDBPrefix + 'db2')).toBeTruthy();
         })
         .catch(e => fail(e));
   });

   it('#createIndex should create design document', async () => {

      // given
      const database = testDBPrefix + 'db';
      await dbService.createDatabase(database);

      // when
      await dbService.createIndex(database, 'name').then(() => null)

      // when
      await dbService.countDocuments(database)
         .then(n => {

            // then
            expect(n).toBe(1);
         })
         .catch(e => fail(e));
   });

   it('#insert should insert document', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ];
      await dbService.createDatabase(database);
      await dbService.insertBulk(database, documents).then(() => null);
      const newDocument: any = { _id: '4', name: 'd' };


      // when
      await dbService.insert(database, newDocument).then(() => null);

      // then
      await dbService.findById(database, '4')
         .then(d => checkDocument(d, '4', 'd'))
         .catch(e => fail(e));
   });

   it('#insert should throw error when document already exists', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ];
      await dbService.createDatabase(database);
      await dbService.insertBulk(database, documents).then(() => null);

      // when
      await dbService.insert(database, documents[0])
         .then(() => fail('should have thrown error'))
         .catch(err => {

            // then
            expect(err instanceof HttpErrorResponse).toBeTruthy();
            const httpErrorResponse = <HttpErrorResponse>err;
            expect(httpErrorResponse.ok).toBeFalsy();
            expect(httpErrorResponse.error).toEqual({ error: 'conflict', reason: 'Document update conflict.' });
         });
   });

   it('#insertBulk should insert many documents', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbService.createDatabase(database);

      // when
      await dbService.insertBulk(database, documents).then(() => null);

      // then
      const query = { selector: { _id: { $gt: null } }, fields: ['_id', '_rev', 'name'] };
      await dbService.find(database, query).toPromise()
         .then(docs => {
            expect(docs).toBeDefined();
            expect(docs.length).toBe(3);
            checkDocument(docs[0], '1', 'a');
            checkDocument(docs[1], '2', 'b');
            checkDocument(docs[2], '3', 'c');
         })
         .catch(e => fail(e));
   });

   it('#insertBulk should throw error when documents already exists', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbService.createDatabase(database);
      await dbService.insertBulk(database, documents.slice(1)).then(() => null);

      // when
      await dbService.insertBulk(database, documents)
         .then(() => fail('should have thrown error'))
         .catch(err => {

            // then
            expect(err).toBe(
               'id: 2, error: conflict, reason: Document update conflict.\n' +
               'id: 3, error: conflict, reason: Document update conflict.');
         });
   });

   it('#update should create document with new revision', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbService.createDatabase(database);
      await dbService.insertBulk(database, documents).then(() => null);
      let docToUpdate: Document;
      await dbService.findById(database, '1').then(doc => docToUpdate = doc);
      const initialDocRev = docToUpdate._rev;
      docToUpdate['name'] = 'x';

      // when
      await dbService.update(database, docToUpdate).then(() => null);

      // then
      const query = { selector: { _id: '1' }, fields: ['_id', '_rev', 'name'] };
      await dbService.find(database, query).toPromise()
         .then(docs => {
            expect(docs).toBeDefined();
            expect(docs.length).toBe(1);
            checkDocument(docs[0], '1', 'x');
            expect(docs[0]._rev).not.toBe(initialDocRev);
         })
         .catch(e => fail(e));
   });

   it('#delete should delete document', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbService.createDatabase(database);
      await dbService.insertBulk(database, documents).then(() => null);
      let docToDelete: Document;
      await dbService.findById(database, '2').then(doc => docToDelete = doc);

      // when
      await dbService.delete(database, docToDelete);

      // then
      await dbService.countDocuments(database)
         .then(n => expect(n).toBe(2))
         .catch(e => fail(e));
   });

   it('#countDocuments should return number of documents', async () => {

      // given
      const database = testDBPrefix + 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbService.createDatabase(database);
      await dbService.insertBulk(database, documents).then(() => null);

      // when
      await dbService.countDocuments(database)
         .then(n => {

            // then
            expect(n).toBe(3);
         })
         .catch(e => fail(e));
   });

   function checkDocument(doc: Document, expID: string, expName: string): void {
      expect(doc).toBeDefined();
      expect(doc._id).toBe(expID);
      expect(doc._rev).toBeDefined();
      expect(doc['name']).toBe(expName);
   }
});
