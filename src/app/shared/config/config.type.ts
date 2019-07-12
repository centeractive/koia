import { View } from './view.type';
import { ConfigRecord } from './config.record.type';

export interface Config {
   records: ConfigRecord[];
   views: View[];
}
