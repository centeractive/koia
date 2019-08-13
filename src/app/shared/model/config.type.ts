import { View } from './view.type';
import { ConfigRecord } from '../services/view-persistence/config.record.type';

export interface Config {
   records: ConfigRecord[];
   views: View[];
}
