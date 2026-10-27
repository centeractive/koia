import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ConnectionInfo, Document, HTTPMethod, Scene } from 'app/shared/model';
import { CommonUtils, LogUtils } from 'app/shared/utils';
import { Base64Utils } from 'app/shared/utils/base64-utils';
import { Observable, lastValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { DB } from '../db.type';
import { DocChangeResponse } from '../doc-change-response.type';
import { CouchDBConfig } from './couchdb-config';
import { deleteUnlessSystemDatabase, indexQueryOf } from '../db-utils';

/**
 * CouchDB needs the following configuration ($COUCHDB_HOME/etc/local.ini)
 *
 * [httpd]
 * enable_cors = true
 *
 * [cors]
 * origins = *
 * methods = GET,POST,PUT,DELETE
 * credentials = true
 */
@Injectable()
export class CouchDBService implements DB {

  static readonly MAX_DATA_ITEMS_PER_SCENE = 100_000;

  private config = new CouchDBConfig();
  private connectionInfo: ConnectionInfo;
  private baseURL: string;
  private httpOptions: HttpOptions;

  constructor(private http: HttpClient) {
    // DBService.initBackend accesses CouchDB itself and handles its failure
    this.connect(this.config.readConnectionInfo()).catch(() => undefined);
  }

  /**
   * connects to the CouchDB the user confirmed and saves its connection
   */
  async initConnection(connectionInfo: ConnectionInfo): Promise<string> {
    this.config.saveConnectionInfo(connectionInfo);
    return this.connect(connectionInfo);
  }

  /**
   * connects to the CouchDB of an external invocation, its connection is saved for the current tab only and only when it is established
   */
  async initLaunchConnection(connectionInfo: ConnectionInfo): Promise<string> {
    return this.connect(connectionInfo)
      .then(msg => {
        this.config.saveLaunchConnectionInfo(connectionInfo);
        return msg;
      });
  }

  private async connect(connectionInfo: ConnectionInfo): Promise<string> {
    const httpOptions = this.createHttpOptions(connectionInfo);
    const baseURL = CouchDBConfig.urlOf(connectionInfo);
    this.connectionInfo = connectionInfo;
    this.httpOptions = httpOptions;
    this.baseURL = baseURL;
    return this.listDatabases()
      .then(() => 'Connection to CouchDB at ' + this.baseURL + ' established');
  }

  getConnectionInfo(): ConnectionInfo {
    return CommonUtils.clone(this.connectionInfo);
  }

  isConnectionSaved(): boolean {
    return this.config.hasSavedConnectionInfo();
  }

  private createHttpOptions(connectionInfo: ConnectionInfo): HttpOptions {
    let httpHeaders = new HttpHeaders();
    httpHeaders = httpHeaders.set('Accept', 'application/json');
    httpHeaders = httpHeaders.set('Content-type', 'application/json');
    httpHeaders = httpHeaders.set('Authorization', 'Basic ' + Base64Utils.encodeUtf8(connectionInfo.user + ':' + connectionInfo.password));
    return { headers: httpHeaders, withCredentials: true };
  }

  /**
    * @return the names of all non-system databases
    */
  listDatabases(): Promise<string[]> {
    const url = this.baseURL + '_all_dbs';
    LogUtils.logHttpRequest(HTTPMethod.GET, url);
    const observable = this.http.get<string[]>(url, this.httpOptions)
      .pipe(
        map(dbs => dbs.filter(db => !db.startsWith('_')))
      );
    return lastValueFrom(observable);
  }

  createDatabase(database: string): Promise<unknown> {
    const url = this.url(database);
    LogUtils.logHttpRequest(HTTPMethod.PUT, url);
    return lastValueFrom(this.http.put<string>(url, '', this.httpOptions));
  }

  getMaxDataItemsPerScene(): number {
    return CouchDBService.MAX_DATA_ITEMS_PER_SCENE;
  }

  createIndex(database: string, columnName: string): Promise<unknown> {
    const query = indexQueryOf(columnName);
    const url = this.url(database, '_index');
    LogUtils.logHttpRequest(HTTPMethod.POST, url, query);
    return lastValueFrom(this.http.post<unknown>(url, query, this.httpOptions));
  }

  deleteDatabase(database: string): Promise<unknown> {
    return deleteUnlessSystemDatabase(database, () => {
      const url = this.url(database);
      LogUtils.logHttpRequest(HTTPMethod.DELETE, url);
      return lastValueFrom(this.http.delete<unknown>(url, this.httpOptions));
    });
  }

  findById(database: string, id: string): Promise<Document> {
    const url = this.url(database, id);
    LogUtils.logHttpRequest(HTTPMethod.GET, url);
    return lastValueFrom(this.http.get<Scene>(url, this.httpOptions));
  }

  find(database: string, mangoQuery: object): Observable<Document[]> {
    const url = this.url(database, '_find');
    LogUtils.logHttpRequest(HTTPMethod.POST, url, mangoQuery);
    return this.http.post<{ docs: Document[] }>(url, mangoQuery, this.httpOptions).pipe(
      map(res => res.docs)
    );
  }

  async insert(database: string, document: Document): Promise<Document> {
    const url = this.url(database);
    LogUtils.logHttpRequest(HTTPMethod.POST, url, document);
    return lastValueFrom(this.http.post<DocChangeResponse>(url, document, this.httpOptions))
      .then(dcr => {
        document._id = dcr.id;
        document._rev = dcr.rev;
      })
      .then(() => document);
  }

  async insertBulk(database: string, documents: Document[]): Promise<void> {
    const url = this.url(database, '_bulk_docs');
    LogUtils.logHttpRequest(HTTPMethod.POST, url, documents.length + ' documents');
    return lastValueFrom(this.http.post<DocChangeResponse[]>(url, { docs: documents }, this.httpOptions))
      .then(r => {
        const errors = r.filter(dcr => dcr.error).map(dcr => 'id: ' + dcr.id + ', error: ' + dcr.error + ', reason: ' + dcr.reason);
        if (errors.length > 0) {
          return Promise.reject(errors.join('\n'));
        }
      });
  }

  async update(database: string, document: Document): Promise<Document> {
    const url = this.url(database, document._id);
    LogUtils.logHttpRequest(HTTPMethod.PUT, url, document);
    return lastValueFrom(this.http.put<DocChangeResponse>(url, document, this.httpOptions))
      .then(r => {
        document._rev = r.rev;
      })
      .then(() => document);
  }

  delete(database: string, document: Document): Promise<DocChangeResponse> {
    const url = this.url(database, document._id) + '?rev=' + encodeURIComponent(document._rev);
    LogUtils.logHttpRequest(HTTPMethod.DELETE, url);
    return lastValueFrom(this.http.delete<DocChangeResponse>(url, this.httpOptions));
  }

  async countDocuments(database: string): Promise<number> {
    const url = this.url(database);
    LogUtils.logHttpRequest(HTTPMethod.GET, url);
    return lastValueFrom(this.http.get<{ doc_count: number }>(url, this.httpOptions))
      .then(info => info['doc_count']);
  }

  async clear(prefix?: string): Promise<unknown[]> {
    return this.listDatabases()
      .then(dbs => Promise.all(dbs
        .filter(db => prefix ? db.startsWith(prefix) : db)
        .map(db => this.deleteDatabase(db)))
      );
  }

  private url(database: string, ...segments: string[]): string {
    return this.baseURL + [database, ...segments].map(encodeURIComponent).join('/');
  }

}

export interface HttpOptions {
  headers: HttpHeaders,
  withCredentials: boolean
}