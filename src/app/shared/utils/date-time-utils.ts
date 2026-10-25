import { DateTime, Duration, DurationLikeObject } from 'luxon';
import { Column, DataType, TimeUnit } from '../model';
import { ArrayUtils } from './array-utils';

export class DateTimeUtils {

  private static readonly ISO_DATE_START = /^[+-]?\d{4}/;

  static maxTimeUnit(...timeUnits: TimeUnit[]): TimeUnit {
    if (!timeUnits.length) {
      return undefined;
    }
    const sortedTimeUnits = DateTimeUtils.sortTimeUnits(timeUnits.filter(tu => tu), 'desc');
    return sortedTimeUnits.length ? sortedTimeUnits[0] : undefined;
  }

  /**
   * @returns a sorted array of all [[TimeUnit]]s
   */
  static allTimeUnits(sortDirection: 'asc' | 'desc'): TimeUnit[] {
    const timeUnits = Object.keys(TimeUnit).map(key => TimeUnit[key]);
    return sortDirection === 'asc' ? timeUnits : timeUnits.reverse();
  }

  /**
   * @returns a sorted array of [[TimeUnit]]s of higher weight than the specified timeUnit
   */
  static timeUnitsAbove(timeUnit: TimeUnit): TimeUnit[] {
    const timeUnits = DateTimeUtils.allTimeUnits('asc');
    const i = timeUnits.indexOf(timeUnit);
    return timeUnits.slice(i + 1);
  }

  /**
   * adds the specified number of time units to given time
   *
   * @returns computed new time
   */
  static addTimeUnits(time: number, numberOfTimeUnit: number, timeUnit: TimeUnit): number {
    return this.add(time, timeUnit, numberOfTimeUnit);
  }

  /**
   * @param msDuraton duration in milliseconds
   * @param minNumberOfUnits minimum number of units contained in duration to be considered a match
   * @returns TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND or TimeUnit.MILLISECOND
   */
  static largestMatchingTimeUnit(msDuraton: number, minNumberOfUnits: number): TimeUnit {
    for (const timeUnit of [TimeUnit.YEAR, TimeUnit.MONTH, TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND]) {
      if (this.countTimeUnits(msDuraton, timeUnit) >= minNumberOfUnits) {
        return timeUnit;
      }
    }
    return TimeUnit.MILLISECOND;
  }

  /**
   * computes the number of time units contained in the specified duration,
   * note that the result for TimeUnit.DAY, TimeUnit.MONTH and TimeUnit.YEAR is approximative
   * since it varies depending on the point in time (for example, when the time change takes place 
   * on a certain day)
   *
   * @param msDuraton duration in milliseconds
   * @returns the number of the specified timeunit included in given duration
   */
  static countTimeUnits(msDuraton: number, timeUnit: TimeUnit): number {
    return msDuraton / this.durationOf(timeUnit);
  }

  static abbreviationOf(timeUnit: TimeUnit): string {
    switch (timeUnit) {
      case TimeUnit.MILLISECOND:
        return 'ms';
      case TimeUnit.MONTH:
        return 'mo';
      default:
        return timeUnit.toString().charAt(0);
    }
  }

  /**
   * @param value string representation of the date/time that must match the specified [[ngFormat]] or, when [[ngFormat]]
   * is missing, an ISO 8601 date with optional time (date/times without offset are interpreted in local time)
   * @param ngFormat Angular date/time format according to https://angular.io/api/common/DatePipe
   * @returns the parsed [[Date]] or [[undefined]] when parsing fails
   */
  static parseDate(value: string, ngFormat: string, locale?: string): Date {
    if (value) {
      const dateTime = ngFormat ?
        DateTime.fromFormat(value, ngFormat, { locale: locale ? locale : 'en' }) : DateTimeUtils.fromISODate(value);
      return dateTime?.isValid ? dateTime.toJSDate() : undefined;
    }
    return undefined;
  }

  /**
   * luxon also accepts a time without date, which would silently become a time of today
   */
  private static fromISODate(value: string): DateTime | undefined {
    return DateTimeUtils.ISO_DATE_START.test(value) ? DateTime.fromISO(value) : undefined;
  }

  /**
   * @returns a time unit down-rounded date or [[undefined]] when time is missing or not a number
   */
  static toBaseDate(time: number, timeUnit: TimeUnit): Date {
    if (time == undefined || isNaN(time)) {
      return undefined;
    }
    const date = new Date(time);
    if (timeUnit === TimeUnit.MILLISECOND) {
      return date;
    }
    date.setMilliseconds(0);
    if (timeUnit === TimeUnit.SECOND) {
      return date;
    }
    date.setSeconds(0);
    if (timeUnit === TimeUnit.MINUTE) {
      return date;
    }
    date.setMinutes(0);
    if (timeUnit === TimeUnit.HOUR) {
      return date;
    }
    date.setHours(0);
    if (timeUnit === TimeUnit.DAY) {
      return date;
    }
    date.setDate(1)
    if (timeUnit === TimeUnit.MONTH) {
      return date;
    }
    date.setMonth(0);
    return date;
  }

  static toBaseTime(time: number, timeUnit: TimeUnit): number {
    const date = DateTimeUtils.toBaseDate(time, timeUnit);
    return date ? date.getTime() : undefined;
  }

  /**
   * @param locale English by default, since the formatted times are data (e.g. pivot table values) that are parsed back
   * with English locale, other locales are meant for display only
   */
  static formatTime(time: number, timeUnit: TimeUnit, locale = 'en'): string {
    return DateTime.fromMillis(time, { locale }).toFormat(this.luxonFormatOf(timeUnit));
  }

  /**
   * @param ngFormat Angular date/time format that is returned by the method [[#ngFormatOf]]
   * @returns the time unit that matches the specified Angular date/time format or [[TimeUnit#MILLISECOND]] when no matching time
   * unit is found
   */
  static timeUnitFromNgFormat(ngFormat: string): TimeUnit {
    return DateTimeUtils.allTimeUnits('asc').find(timeUnit => DateTimeUtils.ngFormatOf(timeUnit) === ngFormat) ?? TimeUnit.MILLISECOND;
  }

  /**
   * @returns the luxon date/time format for the specified time unit
   */
  static luxonFormatOf(timeUnit: TimeUnit): string {
    return this.ngFormatOf(timeUnit);
  }

  /**
   * @returns the Angular date/time format for the specified time unit
   */
  static ngFormatOf(timeUnit: TimeUnit): string {
    switch (timeUnit) {
      case (TimeUnit.SECOND):
        return 'd MMM yyyy HH:mm:ss';
      case (TimeUnit.MINUTE):
        return 'd MMM yyyy HH:mm';
      case (TimeUnit.HOUR):
        return 'd MMM yyyy HH';
      case (TimeUnit.DAY):
        return 'd MMM yyyy';
      case (TimeUnit.MONTH):
        return 'MMM yyyy';
      case (TimeUnit.YEAR):
        return 'yyyy';
      default:
        return 'd MMM yyyy HH:mm:ss SSS';
    }
  }

  /**
   * @returns the same but sorted array
   */
  static sortTimeUnits(timeUnits: TimeUnit[], direction: ('asc' | 'desc') = 'asc'): TimeUnit[] {
    if (!timeUnits?.length) {
      return timeUnits;
    }
    return timeUnits.sort((u1: TimeUnit, u2: TimeUnit) => {
      const diff = DateTimeUtils.durationOf(u1) - DateTimeUtils.durationOf(u2);
      return direction === 'asc' ? diff : diff * -1;
    });
  }

  /**
   * don't make this public as the duration in milliseconds for days, months and years is undetermined
   * (due to daylight saving, two days per year have different length than others)
   */
  private static durationOf(timeUnit: TimeUnit): number {
    return Duration.fromDurationLike(this.duration(timeUnit, 1)).toMillis();
  }

  /**
   * defines the [[TimeUnit]] of given time columns depending on the time span found in the specified entries
   */
  static defineTimeUnits(timeColumns: Column[], entries: object[]): void {
    if (timeColumns && entries && entries.length > 0) {
      const minNumOfTimeUnits = 10;
      timeColumns
        .filter(c => c.dataType === DataType.TIME)
        .forEach(c => {
          const valueRange = ArrayUtils.numberValueRange(entries, c.name);
          if (valueRange.min !== undefined) {
            c.groupingTimeUnit = DateTimeUtils.largestMatchingTimeUnit(valueRange.max - valueRange.min, minNumOfTimeUnits);
          }
        });
    }
  }

  static diff(timeStart: number, timeEnd: number, timeUnit: TimeUnit): number {
    const start = DateTime.fromMillis(timeStart);
    const end = DateTime.fromMillis(timeEnd);
    return end.diff(start, timeUnit).get(timeUnit);
  }

  static add(timeStart: number, timeUnit: TimeUnit, count: number): number {
    if (!count) {
      return timeStart;
    }
    const start = DateTime.fromMillis(timeStart);
    const duration = this.duration(timeUnit, count);
    return start.plus(duration).toMillis();
  }

  static duration(timeUnit: TimeUnit, count: number): DurationLikeObject {
    return { [timeUnit]: count };
  }

  static startOf(time: number, timeUnit: TimeUnit): number {
    return DateTime.fromMillis(time).startOf(timeUnit).toMillis();
  }

}
