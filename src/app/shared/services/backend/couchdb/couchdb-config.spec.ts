import { CouchDBConfig } from './couchdb-config';
import { ConnectionInfo } from 'app/shared/model';

describe('CouchDBConfig', () => {

   const defaultConnInfo: ConnectionInfo = { host: 'localhost', port: 5984, user: 'admin', password: 'admin' };
   const couchDBConfig = new CouchDBConfig();

   beforeEach(() => {
      couchDBConfig.reset();
   });

   afterEach(() => {
      couchDBConfig.reset();
   });

   it('#readConnectionInfo should return default when no connection was saved', () => {

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(defaultConnInfo);
   });

   it('#readConnectionInfo should return last saved connection', () => {

      // given
      const connInfo: ConnectionInfo = { host: 'server1', port: 9999, user: 'test', password: 'secret' };
      couchDBConfig.saveConnectionInfo(connInfo);

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(connInfo);
   });

   it('#readConnectionInfo should return default when config was reset connection', () => {

      // given
      couchDBConfig.saveConnectionInfo({ host: 'server1', port: 9999, user: 'test', password: 'secret' });
      couchDBConfig.reset();

      // when
      const actualConnInfo = couchDBConfig.readConnectionInfo();

      // then
      expect(actualConnInfo).toEqual(defaultConnInfo);
   });

});
