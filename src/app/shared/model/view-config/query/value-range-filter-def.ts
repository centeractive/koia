import { ValueRange } from 'app/shared/value-range/model';

export interface ValueRangeFilterDef {
   name: string;
   valueRange: ValueRange;
   inverted: boolean;
}