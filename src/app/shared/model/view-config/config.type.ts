import { ConfigRecord } from './config-record.type';
import { View } from './view.type';

export interface Config {
   records: ConfigRecord[];
   views: View[];
}
