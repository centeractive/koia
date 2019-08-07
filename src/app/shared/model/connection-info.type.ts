import { Protocol } from './protocol.enum';

export interface ConnectionInfo {
   protocol: Protocol;
   host: string;
   port: number;
   user: string;
   password: string;
}
