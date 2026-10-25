/// <reference types="zone.js" />
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConnectionInfo, Protocol } from 'app/shared/model';
import { lastValueFrom } from 'rxjs';
import { CouchDBConfig } from './couchdb-config';
import { CouchDBService } from './couchdb.service';

const config = new CouchDBConfig();
const saved: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'saved', password: 'secret' };

function savedConnInfo(): ConnectionInfo | null {
   return JSON.parse(localStorage.getItem(CouchDBConfig.CONN_INFO_NAME));
}

function sessionConnInfo(): ConnectionInfo | null {
   return JSON.parse(sessionStorage.getItem(CouchDBConfig.SESSION_CONN_INFO_NAME));
}

function configureTestingModule(): void {
   TestBed.configureTestingModule({
      providers: [CouchDBService, provideHttpClient(), provideHttpClientTesting()]
   });
}

function nextTask(): Promise<void> {
   return new Promise(resolve => setTimeout(resolve));
}

/**
 * zone.js reports unhandled rejections to the zone they occur in instead of dispatching unhandledrejection events
 *
 * @returns the reasons of the rejections the action leaves unhandled, a marker rejection that follows the action proves they're collected
 */
async function unhandledRejectionsOf(action: () => void): Promise<unknown[]> {
   const marker = new Error('marker');
   const reasons: unknown[] = [];
   const zone = Zone.current.fork({
      name: 'unhandled rejections',
      onHandleError: (_delegate, _current, _target, error) => {
         reasons.push(error);
         return false;
      }
   });
   zone.run(action);
   await nextTask();
   zone.run(() => void Promise.reject(marker));
   await nextTask();
   expect(reasons.pop()).toBe(marker);
   return reasons;
}

describe('CouchDBService requests', () => {

   const baseURL = 'http://localhost:5984/';
   let couchDBService: CouchDBService;
   let httpTesting: HttpTestingController;

   beforeEach(() => {
      vi.spyOn(console, 'log').mockReturnValue(undefined);
      config.reset();
      configureTestingModule();
      couchDBService = TestBed.inject(CouchDBService);
      httpTesting = TestBed.inject(HttpTestingController);
      httpTesting.expectOne(baseURL + '_all_dbs').flush([]);
   });

   afterEach(() => {
      httpTesting.verify();
      config.reset();
   });

   it('#initLaunchConnection should connect without replacing saved connection', async () => {

      // given
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(saved));
      const launch: ConnectionInfo = { protocol: Protocol.HTTP, host: 'couch.example.com', port: 5984, user: 'launch', password: 'secret' };

      // when
      const connected = couchDBService.initLaunchConnection(launch);
      httpTesting.expectOne('http://couch.example.com:5984/_all_dbs').flush([]);
      await connected;

      // then
      expect(savedConnInfo()).toEqual(saved);
      expect(sessionConnInfo()).toEqual(launch);
      expect(couchDBService.getConnectionInfo()).toEqual(launch);
   });

   it('#initLaunchConnection should keep session unchanged when connection fails', async () => {

      // given
      const launch: ConnectionInfo = { protocol: Protocol.HTTP, host: 'couch.example.com', port: 5984, user: 'launch', password: 'wrong' };

      // when
      const connected = couchDBService.initLaunchConnection(launch);
      httpTesting.expectOne('http://couch.example.com:5984/_all_dbs').flush(null, { status: 401, statusText: 'Unauthorized' });

      // then
      await expect(connected).rejects.toBeTruthy();
      expect(sessionConnInfo()).toBeNull();
   });

   it('#initConnection should replace saved connection', async () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: '127.0.0.1', port: 5985, user: 'u', password: 'p' };

      // when
      const connected = couchDBService.initConnection(connInfo);
      httpTesting.expectOne('http://127.0.0.1:5985/_all_dbs').flush([]);
      await connected;

      // then
      expect(savedConnInfo()).toEqual(connInfo);
   });

   it('#initConnection should authorize with UTF-8 encoded user and password', async () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'ü', password: '日本' };

      // when
      const connected = couchDBService.initConnection(connInfo);

      // then
      const request = httpTesting.expectOne(baseURL + '_all_dbs');
      expect(request.request.headers.get('Authorization')).toBe('Basic w7w65pel5pys');
      request.flush([]);
      await connected;
   });

   it('#initConnection should authorize with ASCII user and password', async () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'test', password: 'secret' };

      // when
      const connected = couchDBService.initConnection(connInfo);

      // then
      const request = httpTesting.expectOne(baseURL + '_all_dbs');
      expect(request.request.headers.get('Authorization')).toBe('Basic dGVzdDpzZWNyZXQ=');
      request.flush([]);
      await connected;
   });

   it('#initLaunchConnection should keep previous connection when launch connection is invalid', async () => {

      // given
      const launch = { host: 'couch.example.com', port: 5984, user: 'launch', password: 'secret' } as ConnectionInfo;

      // when
      const connected = couchDBService.initLaunchConnection(launch);

      // then
      await expect(connected).rejects.toThrow(TypeError);
      expect(couchDBService.getConnectionInfo()).toEqual(CouchDBConfig.DEFAULT_CONN_INFO);
      const listed = couchDBService.listDatabases();
      httpTesting.expectOne(baseURL + '_all_dbs').flush([]);
      await listed;
   });

   it('#isConnectionSaved should return true after connection was initialized', async () => {

      // given
      const connected = couchDBService.initConnection(saved);
      httpTesting.expectOne(baseURL + '_all_dbs').flush([]);
      await connected;

      // when
      const connectionSaved = couchDBService.isConnectionSaved();

      // then
      expect(connectionSaved).toBe(true);
   });

   it('#findById should encode database and id in URL', async () => {

      // when
      const found = couchDBService.findById('x/../_users', '../a b');

      // then
      httpTesting.expectOne(baseURL + 'x%2F..%2F_users/..%2Fa%20b').flush({});
      await found;
   });

   it('#delete should encode id and revision', async () => {

      // when
      const deleted = couchDBService.delete('db', { _id: 'a/b', _rev: '1-x+y' });

      // then
      httpTesting.expectOne(baseURL + 'db/a%2Fb?rev=1-x%2By').flush({});
      await deleted;
   });

   it('#deleteDatabase should encode database containing slash', async () => {

      // when
      const deleted = couchDBService.deleteDatabase('a/b');

      // then
      httpTesting.expectOne(baseURL + 'a%2Fb').flush({});
      await deleted;
   });

   it('#find should encode database', async () => {

      // when
      const found = lastValueFrom(couchDBService.find('a/b', {}));

      // then
      httpTesting.expectOne(baseURL + 'a%2Fb/_find').flush({ docs: [] });
      expect(await found).toEqual([]);
   });
});

describe('CouchDBService construction', () => {

   const session: ConnectionInfo = { protocol: Protocol.HTTP, host: 'couch.example.com', port: 5986, user: 'session', password: 'secret' };

   beforeEach(() => {
      vi.spyOn(console, 'log').mockReturnValue(undefined);
      config.reset();
      sessionStorage.setItem(CouchDBConfig.SESSION_CONN_INFO_NAME, JSON.stringify(session));
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(saved));
      configureTestingModule();
   });

   afterEach(() => {
      TestBed.inject(HttpTestingController).verify();
      config.reset();
   });

   it('#constructor should connect to session connection without saving it', () => {

      // when
      const couchDBService = TestBed.inject(CouchDBService);
      TestBed.inject(HttpTestingController).expectOne('http://' + session.host + ':' + session.port + '/_all_dbs').flush([]);

      // then
      expect(savedConnInfo()).toEqual(saved);
      expect(sessionConnInfo()).toEqual(session);
      expect(couchDBService.getConnectionInfo()).toEqual(session);
   });

   it('#constructor should leave no unhandled rejection when connection fails', async () => {

      // when
      const reasons = await unhandledRejectionsOf(() => {
         TestBed.inject(CouchDBService);
         TestBed.inject(HttpTestingController).expectOne('http://' + session.host + ':' + session.port + '/_all_dbs')
            .flush(null, { status: 401, statusText: 'Unauthorized' });
      });

      // then
      expect(reasons).toEqual([]);
   });
});
