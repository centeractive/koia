import * as moment from 'moment';
import 'moment/min/locales';
import { TimeUnit, Column, DataType } from '../model';
import { ArrayUtils } from './array-utils';

export class DateTimeUtils {

  static maxTimeUnit(tu1: TimeUnit, tu2: TimeUnit): TimeUnit {
    if (!tu1) {
      return tu2;
    } else if (!tu2) {
      return tu1;
    }
    const allTimeUnits = DateTimeUtils.allTimeUnits('asc');
    return allTimeUnits.indexOf(tu1) > allTimeUnits.indexOf(tu2) ? tu1 : tu2;
  }

  /**
   * @returns a sorted array of all [[TimeUnit]]s
   */
  static allTimeUnits(sortDirection: 'asc' | 'desc'): TimeUnit[] {
    const timeUnits = Object.keys(TimeUnit).map(key => TimeUnit[key]);
    return sortDirection === 'asc' ? timeUnits : timeUnits.reverse();
  }

  /**
   * adds the specified number of time units to given time
   *
   * @returns computed new time
   */
  static addTimeUnits(time: number, numberOfTimeUnit: number, timeUnit: TimeUnit): number {
    return moment(time).add(numberOfTimeUnit, <moment.unitOfTime.DurationConstructor>timeUnit.toString()).valueOf();
  }

  /**
   * computes the number of milliseconds included in the specified number of fixed time units
   *
   * @param numberOfTimeUnit number of time units
   * @param timeUnit TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND or TimeUnit.MILLISECOND
   * @returns number of milliseconds
   */
  static toMilliseconds(numberOfTimeUnit: number, timeUnit: TimeUnit): number {
    switch (timeUnit) {
      case TimeUnit.MILLISECOND:
        return numberOfTimeUnit;
      case TimeUnit.SECOND:
      case TimeUnit.MINUTE:
      case TimeUnit.HOUR:
      case TimeUnit.DAY:
        return moment.duration(numberOfTimeUnit, <moment.unitOfTime.DurationConstructor>timeUnit.toString())
          .asMilliseconds();
      default:
        throw new Error(timeUnit + ' of variable duration cannot be converted to milliseconds');
    }
  }

  static isOfFixedDuration(timeUnit: TimeUnit) {
    return [TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND, TimeUnit.MILLISECOND].includes(timeUnit);
  }

  /**
   * @param msDuraton duration in milliseconds
   * @param minNumberOfUnits minimum number of units contained in duration to be considered a match
   * @returns TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND or TimeUnit.MILLISECOND
   */
  static largestMatchingTimeUnit(msDuraton: number, minNumberOfUnits: number): TimeUnit {
    for (const timeUnit of [TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND]) {
      if (this.countTimeUnits(msDuraton, timeUnit) >= minNumberOfUnits) {
        return timeUnit;
      }
    }
    return TimeUnit.MILLISECOND;
  }

  /**
   * computes the number of fixed timeunits (up to [[TimeUnit#DAY]]) contained in the specified duration
   *
   * @param msDuraton duration in milliseconds
   * @param timeUnit TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MINUTE, TimeUnit.SECOND or TimeUnit.MILLISECOND
   * @returns the number of the specified timeunit included in given duration
   */
  static countTimeUnits(msDuraton: number, timeUnit: TimeUnit): number {
    const duration = moment.duration(msDuraton);
    switch (timeUnit) {
      case TimeUnit.MILLISECOND:
        return duration.asMilliseconds();
      case TimeUnit.SECOND:
        return duration.asSeconds();
      case TimeUnit.MINUTE:
        return duration.asMinutes();
      case TimeUnit.HOUR:
        return duration.asHours();
      case TimeUnit.DAY:
        return duration.asDays();
      default:
        throw new Error('cannot count number of ' + timeUnit + 's with variable duration');
    }
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
   * @param value string representation of the date/time that must match the specified [[ngFormat]]
   * or a simplification of the ISO 8601 calendar date extended format when [[ngFormat]] is missing
   * @param ngFormat Angular date/time format according to https://angular.io/api/common/DatePipe
   * @returns the parsed [[Date]] or [[undefined]] when parsing fails
   */
  static parseDate(value: string, ngFormat: string, locale?: string): Date {
    if (value) {
      if (ngFormat) {
        const mnt = moment(value, this.ngToMomentFormat(ngFormat), locale ? locale : 'en', true);
        return mnt.isValid() ? mnt.toDate() : undefined;
      }
      const date = new Date(value);
      return isNaN(date.getTime()) ? undefined : date;
    }
    return undefined;
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

  static formatTime(time: number, timeUnit: TimeUnit): string {
    return moment(time).format(this.momentFormatOf(timeUnit));
  }

  static ngToMomentFormat(ngFormat: string): string {
    if (ngFormat) {
      return ngFormat.replace(/d/g, 'D').replace(/y/g, 'Y');
    }
    return undefined;
  }

  /**
   * @param ngFormat Angular date/time format that is returned by the method [[#ngFormatOf]]
   * @returns the time unit that matches the specified Angular date/time format or [[TimeUnit#MILLISECOND]] when no matching time
   * unit is found
   */
  static timeUnitFromNgFormat(ngFormat: string): TimeUnit {
    switch (ngFormat) {
      case 'd MMM yyyy HH:mm:ss':
        return TimeUnit.SECOND;
      case 'd MMM yyyy HH:mm':
        return TimeUnit.MINUTE;
      case 'd MMM yyyy HH':
        return TimeUnit.HOUR;
      case 'd MMM yyyy':
        return TimeUnit.DAY;
      case 'MMM yyyy':
        return TimeUnit.MONTH;
      case 'yyyy':
        return TimeUnit.YEAR;
      default:
        return TimeUnit.MILLISECOND;
    }
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
   * @returns all available moment.js locals
   */
  static listMomentLocals(): string[] {
    return moment.locales();
  }

  /**
   * @returns the moment.js date/time format for the specified time unit
   */
  static momentFormatOf(timeUnit: TimeUnit): string {
    switch (timeUnit) {
      case (TimeUnit.SECOND):
        return 'D MMM YYYY HH:mm:ss';
      case (TimeUnit.MINUTE):
        return 'D MMM YYYY HH:mm';
      case (TimeUnit.HOUR):
        return 'D MMM YYYY HH';
      case (TimeUnit.DAY):
        return 'D MMM YYYY';
      case (TimeUnit.MONTH):
        return 'MMM YYYY';
      case (TimeUnit.YEAR):
        return 'YYYY';
      default:
        return 'D MMM YYYY HH:mm:ss SSS';
    }
  }

  /**
   * @returns the D3.js date/time format for the specified time unit
   */
  static d3FormatOf(timeUnit: TimeUnit): string {
    switch (timeUnit) {
      case (TimeUnit.SECOND):
        return '%-d %b %Y %H:%M:%S';
      case (TimeUnit.MINUTE):
        return '%-d %b %Y %H:%M';
      case (TimeUnit.HOUR):
        return '%-d %b %Y %H';
      case (TimeUnit.DAY):
        return '%-d %b %Y';
      case (TimeUnit.MONTH):
        return '%b %Y';
      case (TimeUnit.YEAR):
        return '%Y';
      default:
        return '%-d %b %Y %H:%M:%S %L';
    }
  }

  /**
   * @returns the same but sorted array
   */
  static sortTimeUnits(timeUnits: TimeUnit[], direction: 'asc' | 'desc'): TimeUnit[] {
    if (!timeUnits || timeUnits.length === 0) {
      return timeUnits;
    }
    timeUnits.sort((u1: TimeUnit, u2: TimeUnit) => {
      const diff = DateTimeUtils.durationOf(u1) - DateTimeUtils.durationOf(u2);
      return direction === 'asc' ? diff : diff * -1;
    });
    return timeUnits;
  }

  /**
   * don't make this public as the duration in milliseconds for months and years is not determined
   *
   * @see [[#toMilliseconds]]
   */
  private static durationOf(timeUnit: TimeUnit): number {
    return moment.duration(1, <moment.unitOfTime.DurationConstructor>timeUnit.toString()).asMilliseconds();
  }

  /**
   * defines the [[TimeUnit]] of given time columns depending on the time span found in the specified entries
   */
  static defineTimeUnits(timeColumns: Column[], entries: Object[]): void {
    if (timeColumns && entries && entries.length > 0) {
      const minNumOfTimeUnits = 10;
      timeColumns
        .filter(c => c.dataType === DataType.TIME)
        .forEach(c => {
          const valueRange = ArrayUtils.numberValueRange(entries, c.name);
          if (valueRange.min !== undefined) {
            c.groupingTimeUnit = <TimeUnit>DateTimeUtils.largestMatchingTimeUnit(valueRange.max - valueRange.min, minNumOfTimeUnits);
          }
        });
    };
  }
}
