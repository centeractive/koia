import { ConfigRecord } from './config-record.type';
import { SavedView } from './saved-view.type';
import { View } from './view.type';

export interface Config {
   savedViews?: SavedView[];
   /** legacy pivot and raw data views, converted into savedViews when read and removed when the scene is updated */
   records?: ConfigRecord[];
   /** legacy dashboard views, converted into savedViews when read and removed when the scene is updated */
   views?: View[];
}
