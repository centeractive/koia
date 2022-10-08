import { PouchDBAccess } from './pouchdb-access';
import { Document } from 'app/shared/model';
import PouchDB from 'pouchdb';

describe('PouchDBAccess', () => {

   const DB = 'db';
   const dbAccess = new PouchDBAccess();

   beforeAll(() => {
      spyOn(console, 'log');
   });

   beforeEach(async () => {
      await dbAccess.clear()
         .then(r => null)
         .catch(e => fail(e));

      // Also destroy DB cached in the IndexedDB
      await new PouchDB(DB).destroy()
         .then(r => null)
         .catch(e => fail(e));
   });

   it('#getMaxDataItemsPerScene', async () => {
      expect(dbAccess.getMaxDataItemsPerScene()).toBe(10_000);
   });

   it('#deleteDatabase should be rejected when system database', async () => {

      // when
      await dbAccess.deleteDatabase('_users')
         .then(() => fail('should have been rejected'))
         .catch(e => {

            // then
            expect(e).toBe('You have no permission to delete the system database _users');
         });
   });

   it('#deleteDatabase should be accepted when non-system database', async () => {

      // given
      await dbAccess.createDatabase('db1');
      await dbAccess.createDatabase('db2');

      // when
      await dbAccess.deleteDatabase('db1')
         .then(() => expect(true).toBeTrue()); // prevents 'has no expectations' warning
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
         })
         .catch(e => fail(e));
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
      await dbAccess.find(DB, query).toPromise()
         .then(docs => {

            // then
            expect(docs).toBeDefined();
            expect(docs.length).toBe(1);
            checkDocument(docs[0], '1', 'ab');
         })
         .catch(e => fail(e));
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
      await dbAccess.find(DB, query).toPromise()
         .then(docs => {

            // then
            expect(docs).toBeDefined();
            expect(docs.length).toBe(2);
            checkDocument(docs[0], '1', 'abc');
            checkDocument(docs[1], '2', 'bcd');
         })
         .catch(e => fail(e));
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
         .then(d => checkDocument(d, '1', 'a'))
         .catch(e => fail(e));
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
      await dbAccess.insert(DB, documents[0])
         .then(() => fail('should have thrown error'))
         .catch(err => {

            // then
            expect(err.message).toEqual('Document update conflict');
         });
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
      await dbAccess.find(DB, query).toPromise()
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
      const documents = [
         { _id: '1', name: 'a' },
         { _id: '2', name: 'b' },
         { _id: '3', name: 'c' }
      ]
      await dbAccess.createDatabase(DB);
      await dbAccess.insertBulk(DB, documents.slice(1)).then(() => null);

      // when
      await dbAccess.insertBulk(DB, documents)
         .then(() => fail('should have thrown error'))
         .catch(err => {

            // then
            expect(err).toBe(
               'id: 2, error: conflict, reason: Document update conflict\n' +
               'id: 3, error: conflict, reason: Document update conflict');
         });
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
      await dbAccess.find(DB, query).toPromise()
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
         .then(n => expect(n).toBe(2))
         .catch(e => fail(e));
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
