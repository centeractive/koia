import { NgZone } from '@angular/core';
import { PouchDBAccess } from './pouchdb-access';
import { Document } from 'app/shared/model';
import PouchDB from 'pouchdb';
import { lastValueFrom } from 'rxjs';

describe('PouchDBAccess', () => {

   const DB = 'db';
   let zone: NgZone;
   let dbAccess: PouchDBAccess;
   const registeredInstances = () =>
      destructionListeners().get(DB)?.length ?? 0;
   const registeredViewInstances = () => [...destructionListeners()]
      .filter(([name]) => name.startsWith(DB + '-mrview-'))
      .reduce((sum, [, instances]) => sum + instances.length, 0);

   function destructionListeners(): Map<string, unknown[]> {
      return (PouchDB as unknown as { _destructionListeners: Map<string, unknown[]> })._destructionListeners;
   }

   beforeAll(() => {
      zone = new NgZone({ enableLongStackTrace: false });
      dbAccess = new PouchDBAccess(zone);
   });

   beforeEach(async () => {
      vi.spyOn(console, 'log').mockReturnValue(undefined);
      await dbAccess.clear()
         .then(() => null);

      // Also destroy DB cached in the IndexedDB
      await new PouchDB(DB).destroy()
         .then(() => null);
   });

   it('#getMaxDataItemsPerScene', async () => {
      expect(dbAccess.getMaxDataItemsPerScene()).toBe(10_000);
   });

   it('#deleteDatabase should be rejected when system database', async () => {

      // when
      const deletion = dbAccess.deleteDatabase('_users');

      // then
      await expect(deletion).rejects.toBe('You have no permission to delete the system database _users');
   });

   it('#deleteDatabase should be accepted when non-system database', async () => {

      // given
      await dbAccess.createDatabase('db1');
      await dbAccess.createDatabase('db2');

      // when
      await dbAccess.deleteDatabase('db1')
         .then(() => expect(true).toBe(true)); // prevents 'has no expectations' warning
   });

   it('#createIndex should create design document', async () => {

      // given
      await dbAccess.createDatabase(DB);

      // when
      await dbAccess.createIndex(DB, 'name').then(() => null);

      // when
      await dbAccess.countDocuments(DB)
         .then(n => {

            // then
            expect(n).toBe(1);
         });
   });

   it('#find should query PouchDB outside Angular zone when called inside Angular zone', async () => {

      // given
      let inAngularZone: boolean;
      vi.spyOn(PouchDB.prototype, 'find').mockImplementation(async () => {
         inAngularZone = NgZone.isInAngularZone();
         return { docs: [] };
      });

      // when
      await zone.run(() => lastValueFrom(dbAccess.find(DB, { selector: {} })));

      // then
      expect(inAngularZone).toBe(false);
   });

   it('#find should emit result inside Angular zone when called inside Angular zone', async () => {

      // given
      let inAngularZone: boolean;
      vi.spyOn(PouchDB.prototype, 'find').mockResolvedValue({ docs: [] });

      // when
      await new Promise<void>(resolve => zone.run(() => dbAccess.find(DB, { selector: {} }).subscribe(() => {
         inAngularZone = NgZone.isInAngularZone();
         resolve();
      })));

      // then
      expect(inAngularZone).toBe(true);
   });

   it('#find should return single document when two contains filter on same field match', async () => {

      // given
      const documents = [
         { _id: '1', name: 'ab' },
         { _id: '2', name: 'bc' },
         { _id: '3', name: 'x' }
      ]
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents).then(() => null);

      // when
      const query = {
         selector: {
            $and: [
               { name: { $regex: new RegExp('(?=.*a.*)(?=.*b.*)', 'i') } }
            ]
         },
         fields: ['_id', '_rev', 'name']
      };
      await lastValueFrom(dbAccess.find(DB, query))
         .then(docs => {

            // then
            expect(docs).toBeDefined();
            expect(docs.length).toBe(1);
            checkDocument(docs[0], '1', 'ab');
         });
   });

   it('#find should return matching documents when two contains filter on same field match', async () => {

      // given
      const documents = [
         { _id: '1', name: 'abc' },
         { _id: '2', name: 'bcd' },
         { _id: '3', name: 'xyz' }
      ]
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents).then(() => null);

      // when
      const query = {
         selector: {
            $and: [
               { name: { $regex: new RegExp('(?=.*b.*)(?=.*c.*)', 'i') } }
            ]
         },
         fields: ['_id', '_rev', 'name']
      };
      await lastValueFrom(dbAccess.find(DB, query))
         .then(docs => {

            // then
            expect(docs).toBeDefined();
            expect(docs.length).toBe(2);
            checkDocument(docs[0], '1', 'abc');
            checkDocument(docs[1], '2', 'bcd');
         });
   });

   it('#insert should insert document', async () => {

      // given
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ];
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents.slice(1)).then(() => null);

      // when
      await dbAccess.insert(DB, documents[0]).then(() => null);

      // then
      await dbAccess.findById(DB, '1')
         .then(d => checkDocument(d, '1', 'a'));
   });

   it('#insert should throw error when document already exists', async () => {

      // given
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ];
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents).then(() => null);

      // when
      const insertion = dbAccess.insert(DB, documents[0]);

      // then
      await expect(insertion).rejects.toMatchObject({ message: 'Document update conflict' });
   });

   it('#insertBulk should insert many documents', async () => {

      // given
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbAccess.createDatabase(DB);

      // when
      await dbAccess.insertBulk(DB, documents).then(() => null);

      // then
      const query = { selector: { _id: { $gt: null } }, fields: ['_id', '_rev', 'name'] };
      await lastValueFrom(dbAccess.find(DB, query))
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
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents.slice(1)).then(() => null);

      // when
      const insertion = dbAccess.insertBulk(DB, documents);

      // then
      await expect(insertion).rejects.toBe(
         'id: 2, error: conflict, reason: Document update conflict\n' +
         'id: 3, error: conflict, reason: Document update conflict');
   });

   it('#update should create document with new revision', async () => {

      // given
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents).then(() => null);
      let docToUpdate: Document;
      await dbAccess.findById(DB, '1').then(doc => docToUpdate = doc);
      const initialDocRev = docToUpdate._rev;
      docToUpdate['name'] = 'x';

      // when
      await dbAccess.update(DB, docToUpdate).then(() => null);

      // then
      const query = { selector: { _id: '1' }, fields: ['_id', '_rev', 'name'] };
      await lastValueFrom(dbAccess.find(DB, query))
         .then(docs => {
            expect(docs).toBeDefined();
            expect(docs.length).toBe(1);
            checkDocument(docs[0], '1', 'x');
            expect(docs[0]._rev).not.toBe(initialDocRev);
         });
   });

   it('#delete should delete document', async () => {

      // given
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents).then(() => null);
      let docToDelete: Document;
      await dbAccess.findById(DB, '2').then(doc => docToDelete = doc);

      // when
      await dbAccess.delete(DB, docToDelete);

      // then
      await dbAccess.countDocuments(DB)
         .then(n => expect(n).toBe(2));
   });

   it('#countDocuments should return number of documents', async () => {

      // given
      const database = 'db';
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbAccess.createDatabase(database);
      await dbAccess.insertBulk(database, documents).then(() => null);

      // when
      await dbAccess.countDocuments(database)
         .then(n => {

            // then
            expect(n).toBe(3);
         });
   });

   it('#insertBulk should leave no PouchDB instance registered when written', async () => {

      // given
      await dbAccess.createDatabase(DB);

      // when
      await dbAccess.insertBulk(DB, [{ _id: '1' }]);

      // then
      expect(registeredInstances()).toBe(0);
   });

   it('#findById should leave no PouchDB instance registered when operation fails', async () => {

      // given
      await dbAccess.createDatabase(DB);

      // when
      const finding = dbAccess.findById(DB, 'missing');

      // then
      await expect(finding).rejects.toMatchObject({ status: 404 });
      expect(registeredInstances()).toBe(0);
   });

   it('#find should share one PouchDB instance between concurrent operations', async () => {

      // given
      await dbAccess.createDatabase(DB);
      const query = { selector: { _id: { $gt: null } } };

      // when
      const findings = [lastValueFrom(dbAccess.find(DB, query)), lastValueFrom(dbAccess.find(DB, query))];

      // then
      expect(dbAccess['instances'].size).toBe(1);
      expect(dbAccess['instances'].get(DB).operations).toBe(2);
      await Promise.all(findings);
      expect(dbAccess['instances'].size).toBe(0);
      expect(registeredInstances()).toBe(0);
   });

   it('#findById should reject with error of operation when instance cannot be closed', async () => {

      // given
      await dbAccess.createDatabase(DB);
      const acquire = dbAccess['acquire'].bind(dbAccess);
      vi.spyOn(dbAccess as unknown as { acquire: typeof acquire }, 'acquire').mockImplementation(database => {
         const instance = acquire(database);
         vi.spyOn(instance.db, 'close').mockRejectedValue(new Error('not closed'));
         return instance;
      });

      // when
      const finding = dbAccess.findById(DB, 'missing');

      // then
      await expect(finding).rejects.toEqual(expect.objectContaining({ status: 404 }));
   });

   it('#deleteDatabase should leave no PouchDB instance registered', async () => {

      // given
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, [{ _id: '1' }]);

      // when
      await dbAccess.deleteDatabase(DB);

      // then
      expect(dbAccess['instances'].size).toBe(0);
      expect(registeredInstances()).toBe(0);
   });

   it('#insertBulk should write into recreated database after database was deleted', async () => {

      // given
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, [{ _id: '1' }]);
      await dbAccess.deleteDatabase(DB);
      await dbAccess.createDatabase(DB);

      // when
      await dbAccess.insertBulk(DB, [{ _id: '1' }, { _id: '2' }, { _id: '3' }]);

      // then
      await expect(dbAccess.countDocuments(DB)).resolves.toBe(3);
   });

   it('#countDocuments should count documents of database destroyed meanwhile by another PouchDB instance', async () => {

      // given
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, [{ _id: '1' }, { _id: '2' }]);
      await new PouchDB(DB).destroy();

      // when
      const count = await dbAccess.countDocuments(DB);

      // then
      expect(count).toBe(0);
   });

   it('#find should leave no view instance registered when sorted by indexed field', async () => {

      // given
      await dbAccess.createDatabase(DB);
      await dbAccess.createIndex(DB, 'name');
      const documents = [{ _id: '1', name: 'b' }, { _id: '2', name: 'a' }];
      await dbAccess.insertBulk(DB, documents);
      const query = { selector: { name: { $gt: null } }, sort: ['name'] };

      // when
      const docs = await lastValueFrom(dbAccess.find(DB, query));

      // then
      expect(docs.map(d => d._id)).toEqual(['2', '1']);
      expect(registeredViewInstances()).toBe(0);
      expect(registeredInstances()).toBe(0);
   });

   it('#createIndex should leave no view instance registered', async () => {

      // given
      await dbAccess.createDatabase(DB);

      // when
      await dbAccess.createIndex(DB, 'name');

      // then
      expect(registeredViewInstances()).toBe(0);
   });

   it('#find should resolve when view cannot be closed', async () => {

      // given
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, [{ _id: '1' }]);
      const acquire = dbAccess['acquire'].bind(dbAccess);
      vi.spyOn(dbAccess as unknown as { acquire: typeof acquire }, 'acquire').mockImplementation(database => {
         const instance = acquire(database);
         (instance.db as unknown as { _cachedViews: object })._cachedViews = {
            v: Promise.resolve({ db: { close: () => Promise.reject(new Error('not closed')) } })
         };
         return instance;
      });

      // when
      const docs = await lastValueFrom(dbAccess.find(DB, { selector: { _id: { $gt: null } } }));

      // then
      expect(docs.map(d => d._id)).toEqual(['1']);
   });

   it('#createDatabase should register database once when created twice', async () => {

      // given
      await dbAccess.createDatabase(DB);

      // when
      await dbAccess.createDatabase(DB);

      // then
      expect(dbAccess['databases']).toEqual([DB]);
   });

   function checkDocument(doc: Document, expID: string, expName: string): void {
      expect(doc).toBeDefined();
      expect(doc._id).toBe(expID);
      expect(doc._rev).toBeDefined();
      expect(doc['name']).toBe(expName);
   }
});
