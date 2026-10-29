import { Column } from './column.type';

export interface ColumnPair {
   source: Column,
   target: Column,
   skip?: boolean,
   warning?: string,
   /**
    * the target values are the sequence numbers of the stored entries instead of source values
    */
   sequence?: boolean
}
