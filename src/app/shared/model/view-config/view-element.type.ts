import { Aggregation, ValueGrouping, Column } from '..';
import { ElementType } from './element-type.enum';

export interface ViewElement {
   elementType: ElementType;
   title: string;
   gridColumnSpan: number;
   gridRowSpan: number;
   width: number;
   height: number;
   dataColumns: Column[];
   groupByColumns: Column[];
   aggregations: Aggregation[];
   valueGroupings: ValueGrouping[];
}
