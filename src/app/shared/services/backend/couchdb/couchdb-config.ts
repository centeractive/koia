import { ConnectionInfo } from 'app/shared/model/connection-info.type';
import { Protocol } from 'app/shared/model/protocol.enum';
import { CommonUtils } from 'app/shared/utils/common-utils';

export class CouchDBConfig {

   public static readonly DEFAULT_HTTP_PORT = 5984;
   public static readonly DEFAULT_HTTPS_PORT = 6984;

   static readonly DEFAULT_CONN_INFO: Readonly<ConnectionInfo> = {
      protocol: Protocol.HTTP,
      host: 'localhost',
      port: CouchDBConfig.DEFAULT_HTTP_PORT,
      user: 'admin',
      password: 'admin'
   };
   static readonly CONN_INFO_NAME = 'CouchDBConnectionInfo';
   /**
    * the full connection of the current tab, used when the password must not be stored and for launch connections
    */
   static readonly SESSION_CONN_INFO_NAME = 'CouchDBSessionConnectionInfo';

   static defaultPortOf(protocol: Protocol): number {
      return protocol === Protocol.HTTP ? CouchDBConfig.DEFAULT_HTTP_PORT : CouchDBConfig.DEFAULT_HTTPS_PORT;
   }

   static urlOf(connectionInfo: ConnectionInfo): string {
      return connectionInfo.protocol.toLowerCase() + '://' + connectionInfo.host + ':' + connectionInfo.port + '/';
   }

   static isLocalHost(host: string): boolean {
      return /^localhost$/i.test(host) || /^127(\.\d{1,3}){3}$/.test(host) || host === '::1' || host === '[::1]';
   }

   private static isPasswordStorable(connectionInfo: ConnectionInfo): boolean {
      return CouchDBConfig.isLocalHost(connectionInfo.host) || !!connectionInfo.rememberPassword;
   }

   readConnectionInfo(): ConnectionInfo {
      const sessionConnInfo = sessionStorage.getItem(CouchDBConfig.SESSION_CONN_INFO_NAME);
      if (sessionConnInfo) {
         return JSON.parse(sessionConnInfo);
      }
      const connInfo = localStorage.getItem(CouchDBConfig.CONN_INFO_NAME);
      if (!connInfo) {
         return CommonUtils.clone(CouchDBConfig.DEFAULT_CONN_INFO);
      }
      const connectionInfo: ConnectionInfo = JSON.parse(connInfo);
      if (connectionInfo.password && !CouchDBConfig.isPasswordStorable(connectionInfo)) {
         connectionInfo.password = '';
         localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(connectionInfo));
      }
      return connectionInfo;
   }

   /**
    * saves the connection confirmed by the user, the password of a remote host only goes to the session unless the user allowed to remember it
    */
   saveConnectionInfo(connectionInfo: ConnectionInfo): void {
      if (CouchDBConfig.isPasswordStorable(connectionInfo)) {
         localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify(connectionInfo));
         sessionStorage.removeItem(CouchDBConfig.SESSION_CONN_INFO_NAME);
      } else {
         localStorage.setItem(CouchDBConfig.CONN_INFO_NAME, JSON.stringify({ ...connectionInfo, password: '' }));
         sessionStorage.setItem(CouchDBConfig.SESSION_CONN_INFO_NAME, JSON.stringify(connectionInfo));
      }
   }

   /**
    * saves the connection of an external invocation for the current tab only, it never replaces the connection saved by the user
    */
   saveLaunchConnectionInfo(connectionInfo: ConnectionInfo): void {
      sessionStorage.setItem(CouchDBConfig.SESSION_CONN_INFO_NAME, JSON.stringify(connectionInfo));
   }

   /**
    * the user (or a launch) has chosen a connection, the default connection was never confirmed
    */
   hasSavedConnectionInfo(): boolean {
      return sessionStorage.getItem(CouchDBConfig.SESSION_CONN_INFO_NAME) !== null || localStorage.getItem(CouchDBConfig.CONN_INFO_NAME) !== null;
   }

   reset(): void {
      localStorage.removeItem(CouchDBConfig.CONN_INFO_NAME);
      sessionStorage.removeItem(CouchDBConfig.SESSION_CONN_INFO_NAME);
   }
}
