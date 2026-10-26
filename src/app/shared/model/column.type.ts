import { Computation } from './computation.type';
import { DataType } from './data-type.enum';
import { TimeUnit } from './time-unit.enum';

export interface Column {
  name: string;
  dataType: DataType;
  width: number;
  format?: string;
  groupingTimeUnit?: TimeUnit;
  indexed?: boolean;
  computation?: Computation;
  /**
   * name of the column whose values with masked variable tokens make up the values of this pattern column
   */
  patternOf?: string;
}
