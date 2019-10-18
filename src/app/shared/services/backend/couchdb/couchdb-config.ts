import { CommonUtils } from 'app/shared/utils';
import { ConnectionInfo, Protocol } from 'app/shared/model';

export class CouchDBConfig {

   public static readonly DEFAULT_HTTP_PORT = 5984;
   public static readonly DEFAULT_HTTPS_PORT = 6984;

   private static readonly DEFAULT_CONN_INFO: ConnectionInfo = {
      protocol: Protocol.HTTP,
      host: 'localhost',
      port: CouchDBConfig.DEFAULT_HTTP_PORT,
      user: 'admin',
      password: 'admin'
   };
   private static readonly CONN_INFO_NAME = 'CouchDBConnectionInfo';

   static defaultPortOf(protocol: Protocol): number {
      return protocol === Protocol.HTTP ? CouchDBConfig.DEFAULT_HTTP_PORT : CouchDBConfig.DEFAULT_HTTPS_PORT;
   }

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
