import { ConnectionInfo, Protocol } from 'app/shared/model';
import { CommonUtils } from 'app/shared/utils';

export class CouchDBConfig {

   private static readonly DEFAULT_CONN_INFO: ConnectionInfo =
      { protocol: Protocol.HTTP, host: 'localhost', port: 5984, user: 'admin', password: 'admin' };
   private static readonly CONN_INFO_NAME = 'CouchDBConnectionInfo';

   readConnectionInfo(): ConnectionInfo {
      const connInfo = localStorage.getItem(CouchDBConfig.CONN_INFO_NAME);
      return connInfo ? JSON.parse(connInfo) : CommonUtils.clone(CouchDBConfig.DEFAULT_CONN_INFO);
   }

   saveConnectionInfo(connectionInfo: ConnectionInfo): void {
      localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(connectionInfo));
   }

   reset(): void {
      localStorage.removeItem(CouchDBConfig.CONN_INFO_NAME);
   }
}
