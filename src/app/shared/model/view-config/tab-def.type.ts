import { Document } from '../document.type';
import { ConfigRecord } from './config-record.type';
import { QueryDef } from './query/query-def.type';
import { View } from './view.type';

export enum ViewType {
   PIVOT = 'pivot',
   DASHBOARD = 'dashboard'
}

export interface TabDef {
   id: string;
   type: ViewType;
   title: string;
   view?: View;
   record?: ConfigRecord;
}

export type TabContent = Pick<TabDef, 'view' | 'record'>;

/**
 * filters shared by all tabs of a scene
 */
export interface LinkedFilters {
   /** the shared filters, without sort and page definition */
   query: QueryDef;
   /** set once unlinked: keys of the views (tab ids, 'rawdata' for raw data) that still have to take the filters over */
   pendingKeys?: string[];
}

export interface SceneTabs extends Document {
   tabs: TabDef[];
   linkedFilters?: LinkedFilters;
}

export type SceneTabsContent = Omit<SceneTabs, keyof Document>;
