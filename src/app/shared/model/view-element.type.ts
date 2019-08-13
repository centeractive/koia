import { ElementType } from '../services/view-persistence/element-type.enum';
import { Aggregation, ValueGrouping, Column } from '.';

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
