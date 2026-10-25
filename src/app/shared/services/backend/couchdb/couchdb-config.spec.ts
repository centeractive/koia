import { CouchDBConfig } from './couchdb-config';
import { ConnectionInfo, Protocol } from 'app/shared/model';

describe('CouchDBConfig', () => {

   const defaultConnInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'admin', password: 'admin' };
   const localConnInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: '127.0.0.1', port: 5985, user: 'local', password: 'secret' };
   const remoteConnInfo: ConnectionInfo = { protocol: Protocol.HTTPS, host: 'couch.example.com', port: 6984, user: 'remote', password: 'secret' };
   const couchDBConfig = new CouchDBConfig();

   function savedConnInfo(): ConnectionInfo | null {
      return JSON.parse(localStorage.getItem(CouchDBConfig.CONN_INFO_NAME));
   }

   function sessionConnInfo(): ConnectionInfo | null {
      return JSON.parse(sessionStorage.getItem(CouchDBConfig.SESSION_CONN_INFO_NAME));
   }

   beforeEach(() => {
      couchDBConfig.reset();
   });

   afterEach(() => {
      couchDBConfig.reset();
   });

   it('#defaultPortOf should return port', () => {
      expect(CouchDBConfig.defaultPortOf(Protocol.HTTP)).toEqual(CouchDBConfig.DEFAULT_HTTP_PORT);
      expect(CouchDBConfig.defaultPortOf(Protocol.HTTPS)).toEqual(CouchDBConfig.DEFAULT_HTTPS_PORT);
   });

   it('#urlOf should return the base URL with trailing slash', () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTPS, host: 'server1', port: 6984, user: 'test', password: 'secret' };

      // when
      const url = CouchDBConfig.urlOf(connInfo);

      // then
      expect(url).toBe('https://server1:6984/');
   });

   it('#readConnectionInfo should return default when no connection was saved', () => {

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(defaultConnInfo);
   });

   it('#readConnectionInfo should return last saved connection', () => {

      // given
      const connInfo: ConnectionInfo = { protocol: Protocol.HTTP, host: 'server1', port: 9999, user: 'test', password: 'secret' };
      couchDBConfig.saveConnectionInfo(connInfo);

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(connInfo);
   });

   it.each(['localhost', 'LOCALHOST', '127.0.0.1', '127.1.2.3', '::1', '[::1]'])('#isLocalHost should accept local host %s', host => {
      expect(CouchDBConfig.isLocalHost(host)).toBe(true);
   });

   it.each(['couch.example.com', 'localhost.example.com', '128.0.0.1', '10.0.0.1', ''])('#isLocalHost should reject remote host "%s"', host => {
      expect(CouchDBConfig.isLocalHost(host)).toBe(false);
   });

   it('#readConnectionInfo should prefer connection of session', () => {

      // given
      couchDBConfig.saveConnectionInfo(localConnInfo);
      couchDBConfig.saveLaunchConnectionInfo(remoteConnInfo);

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(remoteConnInfo);
   });

   it('#readConnectionInfo should return saved connection when session has none', () => {

      // given
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(localConnInfo));

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(localConnInfo);
   });

   it('#readConnectionInfo should remove unconsented password of remote host', () => {

      // given
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(remoteConnInfo));

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      const withoutPassword = { ...remoteConnInfo, password: '' };
      expect(actualConnInfo).toEqual(withoutPassword);
      expect(savedConnInfo()).toEqual(withoutPassword);
   });

   it('#readConnectionInfo should keep remembered password of remote host', () => {

      // given
      const remembered = { ...remoteConnInfo, rememberPassword: true };
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(remembered));

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(remembered);
      expect(savedConnInfo()).toEqual(remembered);
   });

   it('#readConnectionInfo should keep password of local host', () => {

      // given
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(localConnInfo));

      // when
      couchDBConfig.readConnectionInfo();

      // then
      expect(savedConnInfo()).toEqual(localConnInfo);
   });

   it('#readConnectionInfo should not rewrite saved connection of remote host without password', () => {

      // given
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify({ ...remoteConnInfo, password: '' }));
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      // when
      couchDBConfig.readConnectionInfo();

      // then
      expect(setItemSpy).not.toHaveBeenCalled();
   });

   it('#saveConnectionInfo should store password of local host', () => {

      // when
      couchDBConfig.saveConnectionInfo(localConnInfo);

      // then
      expect(savedConnInfo()).toEqual(localConnInfo);
      expect(sessionConnInfo()).toBeNull();
   });

   it('#saveConnectionInfo should store remembered password of remote host and discard session connection', () => {

      // given
      couchDBConfig.saveLaunchConnectionInfo(localConnInfo);
      const remembered = { ...remoteConnInfo, rememberPassword: true };

      // when
      couchDBConfig.saveConnectionInfo(remembered);

      // then
      expect(savedConnInfo()).toEqual(remembered);
      expect(sessionConnInfo()).toBeNull();
   });

   it('#saveConnectionInfo should keep unremembered password of remote host in session only', () => {

      // when
      couchDBConfig.saveConnectionInfo(remoteConnInfo);

      // then
      expect(savedConnInfo()).toEqual({ ...remoteConnInfo, password: '' });
      expect(sessionConnInfo()).toEqual(remoteConnInfo);
   });

   it('#saveLaunchConnectionInfo should keep saved connection', () => {

      // given
      couchDBConfig.saveConnectionInfo(localConnInfo);

      // when
      couchDBConfig.saveLaunchConnectionInfo(remoteConnInfo);

      // then
      expect(savedConnInfo()).toEqual(localConnInfo);
      expect(sessionConnInfo()).toEqual(remoteConnInfo);
   });

   it('#reset should remove saved and session connection', () => {

      // given
      couchDBConfig.saveConnectionInfo(localConnInfo);
      couchDBConfig.saveLaunchConnectionInfo(remoteConnInfo);

      // when
      couchDBConfig.reset();

      // then
      expect(savedConnInfo()).toBeNull();
      expect(sessionConnInfo()).toBeNull();
   });

   it('#readConnectionInfo should return default when config was reset connection', () => {

      // given
      couchDBConfig.saveConnectionInfo({ protocol: Protocol.HTTP, host: 'server1', port: 9999, user: 'test', password: 'secret' });
      couchDBConfig.reset();

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(defaultConnInfo);
   });

   it('#hasSavedConnectionInfo should return false when no connection is saved', () => {
      expect(couchDBConfig.hasSavedConnectionInfo()).toBe(false);
   });

   it('#hasSavedConnectionInfo should return true when connection is saved', () => {

      // given
      couchDBConfig.saveConnectionInfo(localConnInfo);

      // when
      const saved = couchDBConfig.hasSavedConnectionInfo();

      // then
      expect(saved).toBe(true);
   });

   it('#hasSavedConnectionInfo should return true when connection of session is saved', () => {

      // given
      couchDBConfig.saveLaunchConnectionInfo(remoteConnInfo);

      // when
      const saved = couchDBConfig.hasSavedConnectionInfo();

      // then
      expect(saved).toBe(true);
   });

});
