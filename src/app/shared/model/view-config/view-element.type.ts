import { Aggregation, Column } from '..';
import { ElementType } from './element-type.enum';
import { ValueGrouping } from 'app/shared/value-range/model/value-grouping.type';
import { ColorScheme } from 'app/shared/color';

export interface ViewElement {
   elementType: ElementType;
   title: string;
   gridColumnSpan: number;
   gridRowSpan: number;
   width: number;
   height: number;
   dataColumns: Column[];
   splitColumns: Column[];
   groupByColumns: Column[];
   aggregations: Aggregation[];
   valueGroupings: ValueGrouping[];
   colorScheme: ColorScheme;
}
