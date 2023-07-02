import { Column } from './column.type';

export interface ColumnPair {
   source: Column,
   target: Column,
   skip?: boolean,
   warning?: string
}
