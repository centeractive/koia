import { DataType } from './data-type.enum';
import { TimeUnit } from './time-unit.enum';

export interface Column {
  name: string;
  dataType: DataType;
  width: number;
  format?: string;
  groupingTimeUnit?: TimeUnit;
  indexed?: boolean;
}
