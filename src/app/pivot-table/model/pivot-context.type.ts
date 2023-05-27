import { Column } from 'app/shared/model';
import { ValueGrouping } from 'app/shared/value-range/model';

export interface PivotContext {
  timeColumns: Column[];
  negativeColor: string;
  positiveColor: string;
  showRowTotals: boolean;
  showColumnTotals: boolean;
  valueGroupings: ValueGrouping[];
  pivotOptions: object;
}
