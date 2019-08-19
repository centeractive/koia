import { ValueGrouping } from '../value-range/model/value-grouping.type';
import { Column } from './column.type';
import { Query } from '@angular/core';

export interface PivotContext {
  timeColumns: Column[];
  negativeColor: string;
  positiveColor: string;
  showRowTotals: boolean;
  showColumnTotals: boolean;
  valueGroupings: ValueGrouping[];
  autoGenerateValueGroupings: boolean;
  pivotOptions: Object;
}
