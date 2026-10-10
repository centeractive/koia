import { Document } from '../document.type';
import { ConfigRecord } from './config-record.type';
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

export interface SceneTabs extends Document {
   tabs: TabDef[];
}
