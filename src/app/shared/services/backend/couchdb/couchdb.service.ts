import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, lastValueFrom } from 'rxjs';
import { DocChangeResponse } from '../doc-change-response.type';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { DB } from '../db.type';
import { ConnectionInfo } from '../../../model/connection-info.type';
import { CommonUtils, LogUtils } from 'app/shared/utils';
import { CouchDBConfig } from './couchdb-config';
import { Scene, Document, HTTPMethod } from 'app/shared/model';

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
  private httpOptions: object;

  constructor(private http: HttpClient) {
    this.initConnection(this.config.readConnectionInfo());
  }

  async initConnection(connectionInfo: ConnectionInfo): Promise<string> {
    this.connectionInfo = connectionInfo;
    this.config.saveConnectionInfo(connectionInfo);
    this.httpOptions = this.createHttpOptions();
    this.baseURL = connectionInfo.protocol.toLowerCase() + '://' + connectionInfo.host + ':' + connectionInfo.port + '/';
    return this.listDatabases()
      .then(() => 'Connection to CouchDB at ' + this.baseURL + ' established');
  }

  getConnectionInfo(): ConnectionInfo {
    return <ConnectionInfo>CommonUtils.clone(this.connectionInfo);
  }

  private createHttpOptions(): any {
    let httpHeaders = new HttpHeaders();

    // trying to fix failing tests on Azure >>

    httpHeaders = httpHeaders.set('Access-Control-Allow-Origin', 'localhost:5984');

    // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< 

    httpHeaders = httpHeaders.set('Accept', 'application/json');
    httpHeaders = httpHeaders.set('Content-type', 'application/json');
    httpHeaders = httpHeaders.set('Authorization', 'Basic ' + btoa(this.connectionInfo.user + ':' + this.connectionInfo.password));
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

  createDatabase(database: string): Promise<any> {
    const url = this.url(database);
    LogUtils.logHttpRequest(HTTPMethod.PUT, url);
    return lastValueFrom(this.http.put<string>(url, '', this.httpOptions));
  }

  getMaxDataItemsPerScene(): number {
    return CouchDBService.MAX_DATA_ITEMS_PER_SCENE;
  }

  createIndex(database: string, columnName: string): Promise<any> {
    const index = {
      index: {
        fields: [columnName]
      },
      ddoc: 'index_' + columnName
    };
    const url = this.url(database, '_index');
    LogUtils.logHttpRequest(HTTPMethod.POST, url, index);
    return lastValueFrom(this.http.post<any>(url, index, this.httpOptions));
  }

  deleteDatabase(database: string): Promise<any> {
    if (database.startsWith('_')) {
      return Promise.reject('You have no permission to delete the system database ' + database);
    }
    const url = this.url(database);
    LogUtils.logHttpRequest(HTTPMethod.DELETE, url);
    return lastValueFrom(this.http.delete<any>(url, this.httpOptions));
  }

  findById(database: string, id: string): Promise<Document> {
    const url = this.url(database, id);
    LogUtils.logHttpRequest(HTTPMethod.GET, url);
    return lastValueFrom(this.http.get<Scene>(url, this.httpOptions));
  }

  find(database: string, mangoQuery: any): Observable<Document[]> {
    const url = this.baseURL + database + '/_find';
    LogUtils.logHttpRequest(HTTPMethod.POST, url, mangoQuery);
    return this.http.post<any>(url, mangoQuery, this.httpOptions).pipe(
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
    LogUtils.logHttpRequest(HTTPMethod.POST, url, { docs: documents });
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

  delete(database: string, document: Document): Promise<any> {
    const url = this.url(database, document._id + '?rev=' + document._rev);
    LogUtils.logHttpRequest(HTTPMethod.DELETE, url);
    return lastValueFrom(this.http.delete<any>(url, this.httpOptions));
  }

  async countDocuments(database: string): Promise<number> {
    const url = this.url(database);
    LogUtils.logHttpRequest(HTTPMethod.GET, url);
    return lastValueFrom(this.http.get<any>(url, this.httpOptions))
      .then(info => info['doc_count']);
  }

  async clear(prefix?: string): Promise<any> {
    return this.listDatabases()
      .then(dbs => Promise.all(dbs
        .filter(db => prefix ? db.startsWith(prefix) : db)
        .map(db => this.deleteDatabase(db)))
      );
  }

  private url(database: string, properties?: string): string {
    return this.baseURL + database + (properties ? '/' + properties : '');
  }

}
