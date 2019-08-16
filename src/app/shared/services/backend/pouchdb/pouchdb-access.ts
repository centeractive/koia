import { Observable, from } from 'rxjs';
import { DB } from '../db.type';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb';
import { ArrayUtils } from 'app/shared/utils';
import { Document } from 'app/shared/model';

PouchDB.plugin(PouchFind);

export class PouchDBAccess implements DB {

  private static MAX_DATA_ITEMS_PER_SCENE = 10_000;

  private databases: string[] = [];

  createDatabase(database: string): Promise<any> {
    console.log('create database ' + database);
    this.databases.push(database);
    return Promise.resolve();
  }

  getMaxDataItemsPerScene(): number {
    return PouchDBAccess.MAX_DATA_ITEMS_PER_SCENE;
  }

  createIndex(database: string, columnName: string): Promise<any> {
    const index = {
      index: {
        fields: [columnName]
      }
    };
    console.log('createIndex ' + database + ' ' + JSON.stringify(index));
    return new PouchDB(database).createIndex(index);
  }

  deleteDatabase(database: string): Promise<any> {
    if (database.startsWith('_')) {
      return Promise.reject('You have no permission to delete the system database ' + database);
    }
    console.log('deleteDatabase ' + database);
    ArrayUtils.removeElement(this.databases, database);
    return new PouchDB(database).destroy();
  }

  async findById(database: string, id: string): Promise<Document> {
    console.log('findById ' + database + ' ' + id);
    return new PouchDB(database).get(id)
      .then(doc => <Document> doc);
  }

  find(database: string, mangoQuery: any): Observable<Document[]> {
    console.log('find ' + database + ' ' + JSON.stringify(mangoQuery));
    return from(new PouchDB(database).find(mangoQuery).then(r => r.docs.map(doc => <Document>doc)));
  }

  async insert(database: string, document: Document): Promise<Document> {
    console.log('insert ' + database + ' ' + document);
    return new PouchDB(database).post(document)
      .then(r => {
        document._id = r.id;
        document._rev = r.rev;
      })
      .then(() => document);
  }

  async insertBulk(database: string, documents: Document[]): Promise<void> {
    console.log('insertBulk ' + database + ' ' + documents.length);
    return new PouchDB(database).bulkDocs(documents)
      .then(resp => {
        const errors = resp.filter(r => r['error']).map(e => 'id: ' + e.id + ', error: ' + e['name'] + ', reason: ' + e['message']);
        if (errors.length > 0) {
          return Promise.reject(errors.join('\n'));
        }
      });
  }

  async update(database: string, document: Document): Promise<Document> {
    console.log('update ' + database + ' id:' + document._id);
    return new PouchDB(database).put(document)
      .then(r => {
        document._rev = r.rev;
      })
      .then(() => document);
  }

  delete(database: string, document: Document): Promise<any> {
    console.log('delete ' + database + ' id:' + document._id);
    return new PouchDB(database).remove(document._id, document._rev);
  }

  async countDocuments(database: string): Promise<number> {
    return new PouchDB(database).info()
      .then(info => info.doc_count);
  }

  async clear(): Promise<any> {
    const promises = this.databases.map(db => new PouchDB(db).destroy());
    this.databases = [];
    return Promise.all(promises);
  }
}
