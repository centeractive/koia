import { Document } from 'app/shared/model';
import { Observable } from 'rxjs';
import { DocChangeResponse } from './doc-change-response.type';

export interface DB {

   createDatabase(database: string): Promise<unknown>;

   /**
    * @returns the maximum number of data items that can be stored for an individual [[Scene]]
    */
   getMaxDataItemsPerScene(): number;

   createIndex(database: string, columnName: string): Promise<unknown>;

   deleteDatabase(database: string): Promise<unknown>;

   findById(database: string, id: string): Promise<Document>;

   find(database: string, mangoQuery: object): Observable<Document[]>;

   insert(database: string, document: Document): Promise<Document>;

   insertBulk(database: string, documents: Document[]): Promise<void>;

   update(database: string, document: Document): Promise<Document>;

   delete(database: string, document: Document): Promise<DocChangeResponse>;

   /**
    * @return the number of all (design and non-design) documents contained in the specified database
    */
   countDocuments(database: string): Promise<number>;

   /**
    * deletes all or matching non-system databases
    *
    * @param prefix if defined, database names must match in order to be deleted (relevant only for CouchDB only, which may be shared for
    * other purpose than testing)
    */
   clear(prefix?: string): Promise<unknown[]>;
}
