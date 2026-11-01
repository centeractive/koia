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
  /** coarsest time unit the values are aligned to, defined for TIME only */
  readonly nativeTimeUnit?: TimeUnit;
  /** number of native time units from the first to the last value, defined for TIME only */
  readonly nativeBucketCount?: number;
}
