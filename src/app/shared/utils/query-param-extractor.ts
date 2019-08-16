import { ParamMap } from '@angular/router';
import { NumberUtils } from './number-utils';
import { Protocol, ConnectionInfo } from '../model';

/**
 * extracts the CouchDB [[ConnectionInfo]] from the specified [[ParamMap]] in case the web-app was invoked by a third-party
 * program with a query string that carries corresponding information
 */
export class QueryParamExtractor {

   static readonly PROTOCOL = 'protocol';
   static readonly HOST = 'host';
   static readonly PORT = 'port';
   static readonly USER = 'user';
   static readonly PASSWORD = 'pw';
   static readonly SCENE_ID = 'scene_id';

   private couchDBConnectionInfo: ConnectionInfo;
   private sceneID: string;

   /**
    * @param params query string parameters (see static definitions of expected names above). the password is expected to be Base64 encoded.
    * Note that an encoded password is not an encrypted password, hence it's not secure. This is acceptable since we assume that the Koia
    * web-app is invoked by a third-party program on the same local machine and that its user is aware of the password.
    */
   constructor(params: ParamMap) {
      this.couchDBConnectionInfo = this.extractConnectionInfo(params);
      this.sceneID = params.get(QueryParamExtractor.SCENE_ID);
   }

   private extractConnectionInfo(params: ParamMap): ConnectionInfo | undefined {
      const host = params.get(QueryParamExtractor.HOST);
      const port = params.get(QueryParamExtractor.PORT);
      const user = params.get(QueryParamExtractor.USER);
      const password = params.get(QueryParamExtractor.PASSWORD);
      if (host && port && user && password) {
         return {
            protocol: this.determineProtocol(params),
            host: host,
            port: NumberUtils.asNumber(port),
            user: user,
            password: atob(password)
         };
      }
      return undefined;
   }

   private determineProtocol(params: ParamMap): Protocol {
      const protocol = params.get(QueryParamExtractor.PROTOCOL);
      return protocol === Protocol.HTTPS.toString() ? Protocol.HTTPS : Protocol.HTTP;
   }

   getCouchDBConnectionInfo(): ConnectionInfo | undefined {
      return this.couchDBConnectionInfo;
   }

   getSceneID(): string | undefined {
      return this.sceneID;
   }
}