import { ValueRange } from './value-range.type';

export interface ValueGrouping {
   columnName: string;
   ranges: ValueRange[];
   minMaxValues?: ValueRange;
}
