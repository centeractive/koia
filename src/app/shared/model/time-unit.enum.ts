export enum TimeUnit {
   MILLISECOND = 'millisecond',
   SECOND = 'second',
   MINUTE = 'minute',
   HOUR = 'hour',
   DAY = 'day',
   MONTH = 'month',
   YEAR = 'year'
}

export const GROUPING_TIME_UNITS: readonly TimeUnit[] = [undefined, TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR, TimeUnit.DAY, TimeUnit.MONTH, TimeUnit.YEAR];
