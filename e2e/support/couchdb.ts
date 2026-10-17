import type { BrowserContext } from '@playwright/test';
import type { ConnectionInfo } from 'app/shared/model/connection-info.type';
import type { Document } from 'app/shared/model/document.type';
import { CouchDBConfig } from 'app/shared/services/backend/couchdb/couchdb-config';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';

export const COUCHDB_CONNECTION = CouchDBConfig.DEFAULT_CONN_INFO;
export const COUCHDB_URL = CouchDBConfig.urlOf(COUCHDB_CONNECTION);
export const COUCHDB_ORIGIN = new URL(COUCHDB_URL).origin;
export const COUCHDB_STORAGE = 'CouchDB';

const TEST_NAME_PREFIX = 'e2e_';
const NOT_FOUND = 404;
const PRECONDITION_FAILED = 412;

/**
 * @returns a valid CouchDB database name that marks a database or document as created by an end-to-end test
 */
export function uniqueTestName(): string {
   return TEST_NAME_PREFIX + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

export async function presetConnectionInfo(context: BrowserContext, connectionInfo: ConnectionInfo): Promise<void> {
   await context.addInitScript(([key, value]) => localStorage.setItem(key, value),
      [CouchDBConfig.CONN_INFO_NAME, JSON.stringify(connectionInfo)]);
}

/**
 * REST client of the CouchDB Koia uses by default, it deletes nothing but what end-to-end tests created
 */
export class CouchDB {

   private readonly authorization = 'Basic ' + btoa(COUCHDB_CONNECTION.user + ':' + COUCHDB_CONNECTION.password);

   async unusableReason(appOrigin: string): Promise<string | undefined> {
      try {
         const response = await this.send('GET', '_all_dbs', undefined, { Origin: appOrigin });
         if (!response.ok) {
            return `CouchDB at ${COUCHDB_URL} responds with ${response.status} to user ${COUCHDB_CONNECTION.user}`;
         }
         if (response.headers.get('access-control-allow-origin') !== appOrigin) {
            return `CouchDB at ${COUCHDB_URL} does not allow CORS requests from ${appOrigin}`;
         }
         return undefined;
      } catch (err) {
         return `CouchDB at ${COUCHDB_URL} is not reachable: ${err.cause ?? err}`;
      }
   }

   async createDatabase(database: string): Promise<void> {
      await this.request('PUT', database);
   }

   /**
    * @returns true when the database was created, false when it existed already
    */
   async createDatabaseIfAbsent(database: string): Promise<boolean> {
      return (await this.request('PUT', database, undefined, [PRECONDITION_FAILED])).ok;
   }

   /**
    * one design document per field like CouchDBService#createIndex, Koia subtracts one document per indexed column when counting entries
    */
   async createIndex(database: string, field: string): Promise<void> {
      await this.request('POST', database + '/_index', { index: { fields: [field] }, ddoc: CouchDBConstants.INDEX_DDOC_PREFIX + field });
   }

   async insertBulk(database: string, documents: Document[]): Promise<void> {
      await this.request('POST', database + '/_bulk_docs', { docs: documents });
   }

   async putDocument(database: string, document: Document): Promise<void> {
      await this.request('PUT', database + '/' + document._id, document);
   }

   async findDocument<T extends Document>(database: string, id: string): Promise<T | undefined> {
      const response = await this.request('GET', database + '/' + id, undefined, [NOT_FOUND]);
      return response.ok ? response.json() : undefined;
   }

   async deleteDocumentIfExists(database: string, id: string): Promise<void> {
      assertCreatedByTests(id);
      const document = await this.findDocument(database, id);
      if (document) {
         await this.request('DELETE', `${database}/${id}?rev=${document._rev}`);
      }
   }

   async deleteDatabaseIfExists(database: string): Promise<void> {
      assertCreatedByTests(database);
      await this.request('DELETE', database, undefined, [NOT_FOUND]);
   }

   private async request(method: string, path: string, body?: object, toleratedStatuses: number[] = []): Promise<Response> {
      const response = await this.send(method, path, body);
      if (!response.ok && !toleratedStatuses.includes(response.status)) {
         throw new Error(`${method} ${COUCHDB_URL}${path} failed with ${response.status}: ${await response.text()}`);
      }
      return response;
   }

   private send(method: string, path: string, body?: object, headers: Record<string, string> = {}): Promise<Response> {
      return fetch(COUCHDB_URL + path, {
         method,
         headers: { Authorization: this.authorization, 'Content-Type': 'application/json', ...headers },
         body: body ? JSON.stringify(body) : undefined
      });
   }
}

function assertCreatedByTests(name: string): void {
   if (!name.startsWith(TEST_NAME_PREFIX)) {
      throw new Error(name + ' was not created by an end-to-end test and must not be deleted');
   }
}
