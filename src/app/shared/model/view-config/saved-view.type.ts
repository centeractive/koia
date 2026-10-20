import { QueryDef } from './query/query-def.type';
import { TabDef } from './tab-def.type';

export interface RawDataSettings {
   considerColumnWidths: boolean;
   highlight: boolean;
   multiLine?: boolean;
   columnWidths?: Record<string, number>;
}

export interface RawDataState {
   query: QueryDef;
   data: RawDataSettings;
}

/**
 * all tabs of a scene together with the state of the raw data tab
 */
export interface SavedView {
   name: string;
   modifiedTime: number;
   tabs: TabDef[];
   /** id of the tab shown when the view was saved, undefined when raw data was shown */
   activeTabId?: string;
   rawData: RawDataState;
}
