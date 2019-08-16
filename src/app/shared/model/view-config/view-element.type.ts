import { Aggregation, Column } from '..';
import { ElementType } from './element-type.enum';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';

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
