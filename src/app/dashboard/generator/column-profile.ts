import { DataType, TimeUnit } from 'app/shared/model';

export enum ColumnRole {
  CATEGORY = 'category',
  MEASURE = 'measure',
  TIME = 'time'
}

export interface ColumnProfile {
  readonly name: string;
  readonly dataType: DataType;
  readonly role: ColumnRole;
  readonly distinctCount: number;
  readonly presentCount: number;
  /** highest number of occurrences of one value, defined for CATEGORY and TIME only */
  readonly maxValueCount?: number;
  readonly groupingTimeUnit?: TimeUnit;
  readonly timeBucketCount?: number;
}
