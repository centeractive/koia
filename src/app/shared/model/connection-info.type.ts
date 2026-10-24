import { Protocol } from './protocol.enum';

export interface ConnectionInfo {
   protocol: Protocol;
   host: string;
   port: number;
   user: string;
   password: string;
   /**
    * user allowed to store the password of a remote host in the browser
    */
   rememberPassword?: boolean;
}
