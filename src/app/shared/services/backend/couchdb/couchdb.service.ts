import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocChangeResponse } from '../doc-change-response.type';
import { map } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { DB } from '../db.type';
import { ConnectionInfo } from '../../../model/connection-info.type';
import { CommonUtils } from 'app/shared/utils';
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
  private httpOptions: {};

  constructor(private http: HttpClient) {
    this.initConnection(this.config.readConnectionInfo());
  }

  async initConnection(connectionInfo: ConnectionInfo): Promise<string> {
    this.connectionInfo = connectionInfo;
    this.config.saveConnectionInfo(connectionInfo);
    this.httpOptions = this.createHttpOptions();
    this.baseURL = connectionInfo.protocol.toLowerCase() + '://' + connectionInfo.host + ':' + connectionInfo.port + '/';
    return this.listDatabases()
      .then(dbs => {
        return 'Connection to CouchDB at ' + this.baseURL + ' established';
      });
  }

  getConnectionInfo(): ConnectionInfo {
    return <ConnectionInfo>CommonUtils.clone(this.connectionInfo);
  }

  private createHttpOptions(): any {
    let httpHeaders = new HttpHeaders();
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
    console.log(HTTPMethod.GET + ' ' + url);
    return this.http.get<string[]>(url, this.httpOptions).pipe(
      map(dbs => dbs.filter(db => !db.startsWith('_')))
    ).toPromise();
  }

  createDatabase(database: string): Promise<any> {
    return this.http.put<string>(this.url(HTTPMethod.PUT, database), '', this.httpOptions).toPromise();
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
    return this.http.post<any>(this.url(HTTPMethod.POST, database, '_index'), index, this.httpOptions).toPromise();
  }

  deleteDatabase(database: string): Promise<any> {
    if (database.startsWith('_')) {
      return Promise.reject('You have no permission to delete the system database ' + database);
    }
    return this.http.delete<any>(this.url(HTTPMethod.DELETE, database), this.httpOptions).toPromise();
  }

  findById(database: string, id: string): Promise<Document> {
    return this.http.get<Scene>(this.url(HTTPMethod.GET, database, id), this.httpOptions).toPromise();
  }

  find(database: string, mangoQuery: any): Observable<Document[]> {
    const url = this.baseURL + database + '/_find';
    console.log(HTTPMethod.POST + ' ' + url + ' ' + JSON.stringify(mangoQuery));
    return this.http.post<any>(url, mangoQuery, this.httpOptions).pipe(
      map(res => res.docs)
    );
  }

  async insert(database: string, document: Document): Promise<Document> {
    return this.http.post<DocChangeResponse>(this.url(HTTPMethod.POST, database), document, this.httpOptions).toPromise()
      .then(dcr => {
        document._id = dcr.id;
        document._rev = dcr.rev;
      })
      .then(() => document);
  }

  async insertBulk(database: string, documents: Document[]): Promise<void> {
    console.log(JSON.stringify(documents));
    return this.http.post<DocChangeResponse[]>(this.url(HTTPMethod.POST, database, '_bulk_docs'),
      { docs: documents }, this.httpOptions).toPromise()
      .then(r => {
        const errors = r.filter(dcr => dcr.error).map(dcr => 'id: ' + dcr.id + ', error: ' + dcr.error + ', reason: ' + dcr.reason);
        if (errors.length > 0) {
          return Promise.reject(errors.join('\n'));
        }
      });
  }

  async update(database: string, document: Document): Promise<Document> {
    return this.http.put<DocChangeResponse>(this.url(HTTPMethod.PUT, database, document._id), document, this.httpOptions).toPromise()
      .then(r => {
        document._rev = r.rev;
      })
      .then(() => document);
  }

  delete(database: string, document: Document): Promise<any> {
    const url = this.url(HTTPMethod.DELETE, database, document._id + '?rev=' + document._rev);
    return this.http.delete<any>(url, this.httpOptions).toPromise();
  }

  async countDocuments(database: string): Promise<number> {
    return this.http.get<any>(this.url(HTTPMethod.GET, database), this.httpOptions).toPromise()
      .then(info => info['doc_count']);
  }

  async clear(prefix?: string): Promise<any> {
    return this.listDatabases()
      .then(dbs => Promise.all(dbs
        .filter(db => prefix ? db.startsWith(prefix) : db)
        .map(db => this.deleteDatabase(db)))
      );
  }

  private url(method: HTTPMethod, database: string, properties?: string): string {
    const url = this.baseURL + database + (properties ? '/' + properties : '');
    console.log(method + ' ' + url);
    return url;
  }
}
