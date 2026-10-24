import { NgZone } from '@angular/core';
import { Observable, from } from 'rxjs';
import { DB } from '../db.type';
import PouchFind from 'pouchdb-find';
import PouchDB from 'pouchdb';
import { ArrayUtils } from 'app/shared/utils';
import { Document } from 'app/shared/model';
import { deleteUnlessSystemDatabase, indexQueryOf } from '../db-utils';

PouchDB.plugin(PouchFind);

export class PouchDBAccess implements DB {

  private static MAX_DATA_ITEMS_PER_SCENE = 10_000;

  private databases: string[] = [];

  constructor(private readonly zone: NgZone) { }

  createDatabase(database: string): Promise<void> {
    console.log('create database', database);
    this.databases.push(database);
    return Promise.resolve();
  }

  getMaxDataItemsPerScene(): number {
    return PouchDBAccess.MAX_DATA_ITEMS_PER_SCENE;
  }

  createIndex(database: string, columnName: string): Promise<PouchDB.Find.CreateIndexResponse<object>> {
    const query = indexQueryOf(columnName);
    console.log('createIndex', database, query);
    return this.run(database, db => db.createIndex(query));
  }

  deleteDatabase(database: string): Promise<void> {
    return deleteUnlessSystemDatabase(database, () => {
      console.log('deleteDatabase', database);
      ArrayUtils.removeElement(this.databases, database);
      return this.run(database, db => db.destroy());
    });
  }

  async findById(database: string, id: string): Promise<Document> {
    console.log('findById', database, id);
    return this.run(database, db => db.get(id))
      .then(doc => <Document>doc);
  }

  find(database: string, mangoQuery: object): Observable<Document[]> {
    console.log('find', database, mangoQuery);
    return from(this.run(database, db => db.find(mangoQuery as PouchDB.Find.FindRequest<object>)).then(r => r.docs.map(doc => <Document>doc)));
  }

  async insert(database: string, document: Document): Promise<Document> {
    console.log('insert', database, document);
    return this.run(database, db => db.post(document))
      .then(r => {
        document._id = r.id;
        document._rev = r.rev;
      })
      .then(() => document);
  }

  async insertBulk(database: string, documents: Document[]): Promise<void> {
    console.log('insertBulk', database, documents.length + ' documents');
    return this.run(database, db => db.bulkDocs(documents))
      .then(resp => {
        const errors = resp.filter(r => r['error']).map(e => 'id: ' + e.id + ', error: ' + e['name'] + ', reason: ' + e['message']);
        if (errors.length > 0) {
          return Promise.reject(errors.join('\n'));
        }
      });
  }

  async update(database: string, document: Document): Promise<Document> {
    console.log('update', database, 'id:' + document._id);
    return this.run(database, db => db.put(document))
      .then(r => {
        document._rev = r.rev;
      })
      .then(() => document);
  }

  delete(database: string, document: Document): Promise<PouchDB.Core.Response> {
    console.log('delete', database, 'id:' + document._id);
    return this.run(database, db => db.remove(document._id, document._rev));
  }

  async countDocuments(database: string): Promise<number> {
    return this.run(database, db => db.info())
      .then(info => info.doc_count);
  }

  async clear(): Promise<void[]> {
    const promises = this.databases.map(db => this.run(db, d => d.destroy()));
    this.databases = [];
    return Promise.all(promises);
  }

  /**
   * runs the operation outside Angular's zone, PouchDB's IndexedDB callbacks would trigger change detection for every request
   */
  private run<T>(database: string, operation: (db: PouchDB.Database) => Promise<T>): Promise<T> {
    return this.zone.runOutsideAngular(() => operation(new PouchDB(database)));
  }
}
