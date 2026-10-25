import type { ParamMap } from '@angular/router';
import { ConnectionInfo } from '../model/connection-info.type';
import { Protocol } from '../model/protocol.enum';
import { Base64Utils } from './base64-utils';

/**
 * extracts the CouchDB [[ConnectionInfo]] from the specified [[ParamMap]] in case the web-app was invoked by a third-party
 * program with a URL fragment, which never reaches a web server, or query string that carries corresponding information
 */
export class QueryParamExtractor {

   static readonly PROTOCOL = 'protocol';
   static readonly HOST = 'host';
   static readonly PORT = 'port';
   static readonly USER = 'user';
   static readonly PASSWORD = 'pw';
   static readonly SCENE_ID = 'scene_id';
   static readonly MAX_PORT = 65535;

   private params: ParamMap;
   private sceneID: string;

   /**
    * @param params URL fragment, which never reaches a web server, or query string parameters (see static definitions of expected names above). the password is expected to be Base64 encoded.
    * Note that an encoded password is not an encrypted password, hence it's not secure. This is acceptable since we assume that the Koia
    * web-app is invoked by a third-party program on the same local machine and that its user is aware of the password.
    */
   constructor(params: ParamMap) {
      this.params = params;
      this.sceneID = params.get(QueryParamExtractor.SCENE_ID);
   }

   hasCouchDBConnectionParams(): boolean {
      return [QueryParamExtractor.HOST, QueryParamExtractor.PORT, QueryParamExtractor.USER, QueryParamExtractor.PASSWORD]
         .every(name => !!this.params.get(name));
   }

   /**
    * @throws Error when the port or the password is invalid
    */
   getCouchDBConnectionInfo(): ConnectionInfo | undefined {
      if (!this.hasCouchDBConnectionParams()) {
         return undefined;
      }
      return {
         protocol: this.determineProtocol(),
         host: this.params.get(QueryParamExtractor.HOST),
         port: this.portOf(this.params.get(QueryParamExtractor.PORT)),
         user: this.params.get(QueryParamExtractor.USER),
         password: this.passwordOf(this.params.get(QueryParamExtractor.PASSWORD))
      };
   }

   private determineProtocol(): Protocol {
      const protocol = this.params.get(QueryParamExtractor.PROTOCOL);
      return protocol === Protocol.HTTPS.toString() ? Protocol.HTTPS : Protocol.HTTP;
   }

   private portOf(port: string): number {
      const portNumber = parseInt(port);
      if (!/^\d+$/.test(port) || portNumber < 1 || portNumber > QueryParamExtractor.MAX_PORT) {
         throw new Error('invalid port: ' + port);
      }
      return portNumber;
   }

   /**
    * Angular decodes a raw '+' of the URL as space, Base64 contains no space
    */
   private passwordOf(password: string): string {
      try {
         return Base64Utils.decodeText(password.replaceAll(' ', '+'));
      } catch {
         throw new Error('invalid pw: not Base64 encoded');
      }
   }

   getSceneID(): string | undefined {
      return this.sceneID;
   }
}
