import { ElementType } from './element-type.enum';
import { Aggregation, ValueGrouping, Column } from '../model';

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
