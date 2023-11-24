import { DatePipe } from '@angular/common';
import { timeFormat } from 'd3';
import { DateTime, Settings } from 'luxon';
import { Column, DataType, TimeUnit } from '../model';
import { DateTimeUtils } from './date-time-utils';

describe('DateTimeUtils', () => {

  const datePipe = new DatePipe('en-US');
  const now = new Date().getTime();
  const sec = 1_000;
  const min = 60 * sec;
  const hour = 60 * min;
  const day = 24 * hour;

  it('#maxTimeUnit should return undefined when no time unit is provided', () => {
    expect(DateTimeUtils.maxTimeUnit()).toBeUndefined();
    expect(DateTimeUtils.maxTimeUnit(undefined)).toBeUndefined();
    expect(DateTimeUtils.maxTimeUnit(null)).toBeUndefined();
  });

  it('#maxTimeUnit should return existing time unit when any unit is missing', () => {
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.SECOND, undefined)).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.HOUR, null)).toBe(TimeUnit.HOUR);
    expect(DateTimeUtils.maxTimeUnit(undefined, TimeUnit.SECOND)).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.maxTimeUnit(null, TimeUnit.HOUR)).toBe(TimeUnit.HOUR);
  });

  it('#maxTimeUnit should return first time unit when first time unit is bigger', () => {
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.SECOND, TimeUnit.MILLISECOND)).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.MINUTE, TimeUnit.SECOND)).toBe(TimeUnit.MINUTE);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.HOUR, TimeUnit.MINUTE)).toBe(TimeUnit.HOUR);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.DAY, TimeUnit.HOUR)).toBe(TimeUnit.DAY);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.MONTH, TimeUnit.DAY)).toBe(TimeUnit.MONTH);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.YEAR, TimeUnit.MONTH)).toBe(TimeUnit.YEAR);
  });

  it('#maxTimeUnit should return second time unit when second time unit is bigger', () => {
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.MILLISECOND, TimeUnit.SECOND)).toEqual(TimeUnit.SECOND);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.SECOND, TimeUnit.MINUTE)).toEqual(TimeUnit.MINUTE);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.MINUTE, TimeUnit.HOUR)).toEqual(TimeUnit.HOUR);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.HOUR, TimeUnit.DAY)).toEqual(TimeUnit.DAY);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.DAY, TimeUnit.MONTH)).toEqual(TimeUnit.MONTH);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.MONTH, TimeUnit.YEAR)).toEqual(TimeUnit.YEAR);
  });

  it('#maxTimeUnit should return max time unit', () => {
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.MILLISECOND, TimeUnit.SECOND, TimeUnit.HOUR, TimeUnit.DAY)).toBe(TimeUnit.DAY);
    expect(DateTimeUtils.maxTimeUnit(TimeUnit.SECOND, TimeUnit.YEAR, TimeUnit.DAY, TimeUnit.MONTH)).toBe(TimeUnit.YEAR);
  });

  it('#allTimeUnits should return ascending sorted time units', () => {

    // when
    const timeUnits = DateTimeUtils.allTimeUnits('asc');

    // then
    const expected = [
      TimeUnit.MILLISECOND,
      TimeUnit.SECOND,
      TimeUnit.MINUTE,
      TimeUnit.HOUR,
      TimeUnit.DAY,
      TimeUnit.MONTH,
      TimeUnit.YEAR
    ];
    expect(timeUnits).toEqual(expected);
  });

  it('#allTimeUnits should return descending sorted time units', () => {

    // when
    const timeUnits = DateTimeUtils.allTimeUnits('desc');

    // then
    const expected = [
      TimeUnit.YEAR,
      TimeUnit.MONTH,
      TimeUnit.DAY,
      TimeUnit.HOUR,
      TimeUnit.MINUTE,
      TimeUnit.SECOND,
      TimeUnit.MILLISECOND
    ];
    expect(timeUnits).toEqual(expected);
  });

  it('#timeUnitsAbove', () => {
    const timeUnits = [
      TimeUnit.MILLISECOND,
      TimeUnit.SECOND,
      TimeUnit.MINUTE,
      TimeUnit.HOUR,
      TimeUnit.DAY,
      TimeUnit.MONTH,
      TimeUnit.YEAR
    ];

    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.MILLISECOND)).toEqual(timeUnits.slice(1));
    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.SECOND)).toEqual(timeUnits.slice(2));
    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.MINUTE)).toEqual(timeUnits.slice(3));
    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.HOUR)).toEqual(timeUnits.slice(4));
    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.DAY)).toEqual(timeUnits.slice(5));
    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.MONTH)).toEqual([TimeUnit.YEAR]);
    expect(DateTimeUtils.timeUnitsAbove(TimeUnit.YEAR)).toEqual([]);
  });

  it('#largestMatchingTimeUnit should return time unit', () => {
    expect(DateTimeUtils.largestMatchingTimeUnit(1_000, 2)).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.largestMatchingTimeUnit(1_000, 1)).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.largestMatchingTimeUnit(60_000, 1)).toBe(TimeUnit.MINUTE);
    expect(DateTimeUtils.largestMatchingTimeUnit(3_600_000, 1)).toBe(TimeUnit.HOUR);
    expect(DateTimeUtils.largestMatchingTimeUnit(86_400_000, 1)).toBe(TimeUnit.DAY);
  });

  it('#countTimeUnits should return one fixed timeunit', () => {
    expect(DateTimeUtils.countTimeUnits(1, TimeUnit.MILLISECOND)).toBe(1);
    expect(DateTimeUtils.countTimeUnits(1_000, TimeUnit.SECOND)).toBe(1);
    expect(DateTimeUtils.countTimeUnits(60_000, TimeUnit.MINUTE)).toBe(1);
    expect(DateTimeUtils.countTimeUnits(3_600_000, TimeUnit.HOUR)).toBe(1);
    expect(DateTimeUtils.countTimeUnits(86_400_000, TimeUnit.DAY)).toBe(1);
  });

  it('#countTimeUnits should return many fixed timeunit', () => {
    expect(DateTimeUtils.countTimeUnits(3, TimeUnit.MILLISECOND)).toBe(3);
    expect(DateTimeUtils.countTimeUnits(4 * 1_000, TimeUnit.SECOND)).toBe(4);
    expect(DateTimeUtils.countTimeUnits(5 * 60_000, TimeUnit.MINUTE)).toBe(5);
    expect(DateTimeUtils.countTimeUnits(6 * 3_600_000, TimeUnit.HOUR)).toBe(6);
    expect(DateTimeUtils.countTimeUnits(7 * 86_400_000, TimeUnit.DAY)).toBe(7);
  });

  it('#addTimeUnits should add single timeunit to given time', () => {
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.MILLISECOND)).toBe(now + 1);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.SECOND)).toBe(now + 1_000);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.MINUTE)).toBe(now + 60_000);
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.HOUR)).toBe(fromNow(1, TimeUnit.HOUR));
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.DAY)).toBe(fromNow(1, TimeUnit.DAY));
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.MONTH)).toBe(fromNow(1, TimeUnit.MONTH));
    expect(DateTimeUtils.addTimeUnits(now, 1, TimeUnit.YEAR)).toBe(fromNow(1, TimeUnit.YEAR));
  });

  it('#addTimeUnits should add many timeunit to given time', () => {
    expect(DateTimeUtils.addTimeUnits(now, 3, TimeUnit.MILLISECOND)).toBe(now + 3);
    expect(DateTimeUtils.addTimeUnits(now, 4, TimeUnit.SECOND)).toBe(now + 4 * 1_000);
    expect(DateTimeUtils.addTimeUnits(now, 5, TimeUnit.MINUTE)).toBe(now + 5 * 60_000);
    expect(DateTimeUtils.addTimeUnits(now, 6, TimeUnit.HOUR)).toBe(fromNow(6, TimeUnit.HOUR));
    expect(DateTimeUtils.addTimeUnits(now, 7, TimeUnit.DAY)).toBe(fromNow(7, TimeUnit.DAY));
    expect(DateTimeUtils.addTimeUnits(now, 7, TimeUnit.MONTH)).toBe(fromNow(7, TimeUnit.MONTH));
    expect(DateTimeUtils.addTimeUnits(now, 12, TimeUnit.YEAR)).toBe(fromNow(12, TimeUnit.YEAR));
  });

  it('#addTimeUnits should add single month to given time', () => {

    // given
    const d = new Date(2019, 0);

    // when
    const time = DateTimeUtils.addTimeUnits(d.getTime(), 1, TimeUnit.MONTH);

    // then
    const date = new Date(time);
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(1);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('#addTimeUnits should add many months to given time', () => {

    // given
    const d = new Date(2005, 8);

    // when
    const time = DateTimeUtils.addTimeUnits(d.getTime(), 27, TimeUnit.MONTH);

    // then
    const date = new Date(time);
    expect(date.getFullYear()).toBe(2007);
    expect(date.getMonth()).toBe(11);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('#addTimeUnits should add single year to given time', () => {

    // given
    const d = new Date(2019, 4);

    // when
    const time = DateTimeUtils.addTimeUnits(d.getTime(), 1, TimeUnit.YEAR);

    // then
    const date = new Date(time);
    expect(date.getFullYear()).toBe(2020);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('#addTimeUnits should add many years to given time', () => {

    // given
    const d = new Date(1954, 0);

    // when
    const time = DateTimeUtils.addTimeUnits(d.getTime(), 67, TimeUnit.YEAR);

    // then
    const date = new Date(time);
    expect(date.getFullYear()).toBe(2021);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
    expect(date.getHours()).toBe(0);
    expect(date.getMinutes()).toBe(0);
    expect(date.getSeconds()).toBe(0);
    expect(date.getMilliseconds()).toBe(0);
  });

  it('#abbreviationOf should return abbreviation of timeunit', () => {
    expect(DateTimeUtils.abbreviationOf(TimeUnit.MILLISECOND)).toBe('ms');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.SECOND)).toBe('s');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.MINUTE)).toBe('m');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.HOUR)).toBe('h');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.DAY)).toBe('d');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.MONTH)).toBe('mo');
    expect(DateTimeUtils.abbreviationOf(TimeUnit.YEAR)).toBe('y');
  });

  it('#parseDate should return undefined when date is not present', () => {
    expect(DateTimeUtils.parseDate(null, 'dd.MM.yyyy')).toBeUndefined();
    expect(DateTimeUtils.parseDate(undefined, 'dd.MM.yyyy')).toBeUndefined();
  });

  it('#parseDate should return undefined when date is invalid and format is not present', () => {
    expect(DateTimeUtils.parseDate('X', undefined)).toBeUndefined();
    expect(DateTimeUtils.parseDate('A', null)).toBeUndefined();
  });

  it('#parseDate should return undefined when date cannot be parsed', () => {

    // when
    const date = DateTimeUtils.parseDate('xyz', 'dd.MM.yyyy');

    // then
    expect(date).toBeUndefined();
  });

  it('#parseDate should return undefined when date is followed by text', () => {

    // given
    const value = '2021.01.30 11:25:16 abcdef';

    // when
    const date = DateTimeUtils.parseDate(value, 'yyyy-MM-dd HH:mm:ss');

    // then
    expect(date).toBeUndefined();
  });

  it('#parseDate should return undefined when date is among text', () => {

    // given
    const value = 'abcdef 2021.01.30 11:25:16 opyrst';

    // when
    const date = DateTimeUtils.parseDate(value, 'yyyy-MM-dd HH:mm:ss');

    // then
    expect(date).toBeUndefined();
  });

  it('#parseDate should return date when ISO-8601 compliant date but no format is provided', () => {

    // when
    const date = DateTimeUtils.parseDate('01 Jan 1970 00:00:00 GMT', undefined);

    // then
    expect(date.getTime()).toBe(0);
  });

  it('#parseDate should return date when ISO-8601 compliant date and format', () => {

    // when
    const date = DateTimeUtils.parseDate('01 Jan 1970 00:00:00 GMT', 'd MMM yyyy HH:mm:ss z');

    // then
    expect(date.getTime()).toBe(0);
  });

  it('#parseDate should return date when non ISO-8601 with format are provided', () => {

    // when
    const date = DateTimeUtils.parseDate('23.07.2005', 'dd.MM.yyyy');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2005);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(23);
  });

  it('#parseDate should return date when year with format and locale are provided', () => {

    // when
    const date = DateTimeUtils.parseDate('2019', 'yyyy', 'en');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it('#parseDate should return date when non ISO-8601 date with format and locale are provided', () => {

    // when
    const date = DateTimeUtils.parseDate('01 Januar 2019', 'dd MMMM yyyy', 'de');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(1);
  });

  it('#parseDate should return full date and time when day is leading', () => {

    // when
    const date = DateTimeUtils.parseDate('06.05.2019 11:25:16 123', 'dd.MM.yyyy HH:mm:ss SSS');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(6);
    expect(date.getHours()).toBe(11);
    expect(date.getMinutes()).toBe(25);
    expect(date.getSeconds()).toBe(16);
    expect(date.getMilliseconds()).toBe(123);
  });

  it('#parseDate should return full date and time when year is leading', () => {

    // when
    const date = DateTimeUtils.parseDate('2019.05.06 11:22:33 444', 'yyyy.MM.dd HH:mm:ss SSS');

    // then
    expect(date).toBeDefined();
    expect(date.getFullYear()).toBe(2019);
    expect(date.getMonth()).toBe(4);
    expect(date.getDate()).toBe(6);
    expect(date.getHours()).toBe(11);
    expect(date.getMinutes()).toBe(22);
    expect(date.getSeconds()).toBe(33);
    expect(date.getMilliseconds()).toBe(444);
  });

  it('#toBaseDate should return undefined when time is undefined', () => {
    expect(DateTimeUtils.toBaseDate(undefined, TimeUnit.MILLISECOND)).toBeUndefined();
  });

  it('#toBaseDate should return undefined when time is not a number', () => {
    expect(DateTimeUtils.toBaseDate(Number('x'), TimeUnit.MILLISECOND)).toBeUndefined();
  });

  it('#toBaseDate should return time specific down-rounded date', () => {
    const roundNowDown = (f: number) => new Date(Math.floor(now / f) * f);

    expect(DateTimeUtils.toBaseDate(now, TimeUnit.MILLISECOND)).toEqual(new Date(now));
    expect(DateTimeUtils.toBaseDate(now, TimeUnit.SECOND)).toEqual(roundNowDown(1_000));
    expect(DateTimeUtils.toBaseDate(now, TimeUnit.MINUTE)).toEqual(roundNowDown(60_000));
    expect(DateTimeUtils.toBaseDate(now, TimeUnit.HOUR)).toEqual(roundNowDown(3_600_000));
  });

  it('#toBaseDate should return down-rounded day', () => {

    // when
    const d = DateTimeUtils.toBaseDate(now, TimeUnit.DAY)

    // then
    const today = new Date(now);
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    expect(d).toEqual(today);
  });

  it('#toBaseDate should return down-rounded month', () => {

    // when
    const month = DateTimeUtils.toBaseDate(now, TimeUnit.MONTH)

    // then
    const today = new Date(now);
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    today.setDate(1);
    expect(month).toEqual(today);
  });

  it('#toBaseDate should return down-rounded year', () => {

    // when
    const year = DateTimeUtils.toBaseDate(now, TimeUnit.YEAR)

    // then
    const today = new Date(now);
    today.setMilliseconds(0);
    today.setSeconds(0);
    today.setMinutes(0);
    today.setHours(0);
    today.setDate(1);
    today.setMonth(0);
    expect(year).toEqual(today);
  });

  it('#formatTime should return formatted date/time', () => {
    const time = new Date('2019-01-29T18:24:17').getTime() + 557;

    expect(DateTimeUtils.formatTime(time, TimeUnit.MILLISECOND)).toBe('29 Jan 2019 18:24:17 557');
    expect(DateTimeUtils.formatTime(time, TimeUnit.SECOND)).toBe('29 Jan 2019 18:24:17');
    expect(DateTimeUtils.formatTime(time, TimeUnit.MINUTE)).toBe('29 Jan 2019 18:24');
    expect(DateTimeUtils.formatTime(time, TimeUnit.HOUR)).toBe('29 Jan 2019 18');
    expect(DateTimeUtils.formatTime(time, TimeUnit.DAY)).toBe('29 Jan 2019');
    expect(DateTimeUtils.formatTime(time, TimeUnit.MONTH)).toBe('Jan 2019');
    expect(DateTimeUtils.formatTime(time, TimeUnit.YEAR)).toBe('2019');
  });

  it('#formatTime should return formatted date/time (verified with angular DatePipe)', () => {
    const ngFormat = (timeunit: TimeUnit) => datePipe.transform(now, DateTimeUtils.ngFormatOf(timeunit));

    expect(DateTimeUtils.formatTime(now, TimeUnit.MILLISECOND)).toBe(ngFormat(TimeUnit.MILLISECOND));
    expect(DateTimeUtils.formatTime(now, TimeUnit.SECOND)).toBe(ngFormat(TimeUnit.SECOND));
    expect(DateTimeUtils.formatTime(now, TimeUnit.MINUTE)).toBe(ngFormat(TimeUnit.MINUTE));
    expect(DateTimeUtils.formatTime(now, TimeUnit.HOUR)).toBe(ngFormat(TimeUnit.HOUR));
    expect(DateTimeUtils.formatTime(now, TimeUnit.DAY)).toBe(ngFormat(TimeUnit.DAY));
    expect(DateTimeUtils.formatTime(now, TimeUnit.MONTH)).toBe(ngFormat(TimeUnit.MONTH));
    expect(DateTimeUtils.formatTime(now, TimeUnit.YEAR)).toBe(ngFormat(TimeUnit.YEAR));
  });

  it('#timeUnitFromNgFormat should return MILLISECOND when ngFormat is missing', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat(null)).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat(undefined)).toBe(TimeUnit.MILLISECOND);
  });

  it('#timeUnitFromNgFormat should return MILLISECOND when ngFormat is blank', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat('')).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat('  ')).toBe(TimeUnit.MILLISECOND);
  });

  it('#timeUnitFromNgFormat should return MILLISECOND when ngFormat is unknown', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat('dd/MM/yyyy')).toBe(TimeUnit.MILLISECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat('dd MMMM yyyy')).toBe(TimeUnit.MILLISECOND);
  });

  it('#timeUnitFromNgFormat should return matching time unit', () => {
    expect(DateTimeUtils.timeUnitFromNgFormat('yyyy')).toBe(TimeUnit.YEAR);
    expect(DateTimeUtils.timeUnitFromNgFormat('MMM yyyy')).toBe(TimeUnit.MONTH);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy')).toBe(TimeUnit.DAY);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH')).toBe(TimeUnit.HOUR);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH:mm')).toBe(TimeUnit.MINUTE);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH:mm:ss')).toBe(TimeUnit.SECOND);
    expect(DateTimeUtils.timeUnitFromNgFormat('d MMM yyyy HH:mm:ss SSS')).toBe(TimeUnit.MILLISECOND);
  });

  it('#ngFormatOf and #luxonFormatOf should return compatible date/time format each', () => {
    const ngFormatter = (timeunit: TimeUnit) => datePipe.transform(now, DateTimeUtils.ngFormatOf(timeunit));
    const luxonFormatter = (timeunit: TimeUnit) => DateTime.fromMillis(now).toFormat(DateTimeUtils.luxonFormatOf(timeunit));

    expect(ngFormatter(TimeUnit.MILLISECOND)).toBe(luxonFormatter(TimeUnit.MILLISECOND));
    expect(ngFormatter(TimeUnit.SECOND)).toBe(luxonFormatter(TimeUnit.SECOND));
    expect(ngFormatter(TimeUnit.MINUTE)).toBe(luxonFormatter(TimeUnit.MINUTE));
    expect(ngFormatter(TimeUnit.HOUR)).toBe(luxonFormatter(TimeUnit.HOUR));
    expect(ngFormatter(TimeUnit.DAY)).toBe(luxonFormatter(TimeUnit.DAY));
    expect(ngFormatter(TimeUnit.MONTH)).toBe(luxonFormatter(TimeUnit.MONTH));
    expect(ngFormatter(TimeUnit.YEAR)).toBe(luxonFormatter(TimeUnit.YEAR));
  });

  it('#d3FormatOf and #ngFormatOf should return compatible date/time format each', () => {
    const d3Formatter = (timeunit: TimeUnit) => timeFormat(DateTimeUtils.d3FormatOf(timeunit))(new Date(now));
    const ngFormatter = (timeunit: TimeUnit) => datePipe.transform(now, DateTimeUtils.ngFormatOf(timeunit));

    expect(d3Formatter(TimeUnit.MILLISECOND)).toBe(ngFormatter(TimeUnit.MILLISECOND));
    expect(d3Formatter(TimeUnit.SECOND)).toBe(ngFormatter(TimeUnit.SECOND));
    expect(d3Formatter(TimeUnit.MINUTE)).toBe(ngFormatter(TimeUnit.MINUTE));
    expect(d3Formatter(TimeUnit.HOUR)).toBe(ngFormatter(TimeUnit.HOUR));
    expect(d3Formatter(TimeUnit.DAY)).toBe(ngFormatter(TimeUnit.DAY));
    expect(d3Formatter(TimeUnit.MONTH)).toBe(ngFormatter(TimeUnit.MONTH));
    expect(d3Formatter(TimeUnit.YEAR)).toBe(ngFormatter(TimeUnit.YEAR));
  });

  it('#sortTimeUnits should return same when array is missing', () => {
    expect(DateTimeUtils.sortTimeUnits(null)).toBeNull();
    expect(DateTimeUtils.sortTimeUnits(undefined)).toBeUndefined();
    expect(DateTimeUtils.sortTimeUnits(null, 'asc')).toBeNull();
    expect(DateTimeUtils.sortTimeUnits(undefined, 'asc')).toBeUndefined();
    expect(DateTimeUtils.sortTimeUnits(null, 'desc')).toBeNull();
    expect(DateTimeUtils.sortTimeUnits(undefined, 'desc')).toBeUndefined();
  });

  it('#sortTimeUnits should return unchanged array when it contains single entry', () => {
    const timeUnits: TimeUnit[] = [TimeUnit.YEAR];
    expect(DateTimeUtils.sortTimeUnits(timeUnits)).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits)).toEqual([TimeUnit.YEAR]);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toEqual([TimeUnit.YEAR]);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toBe(timeUnits);
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toEqual([TimeUnit.YEAR]);
  });

  it('#sortTimeUnits should return the same array', () => {
    let timeUnits = [TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY];
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'asc')).toBe(timeUnits);
    timeUnits = [TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY];
    expect(DateTimeUtils.sortTimeUnits(timeUnits, 'desc')).toBe(timeUnits);
  });

  it('#sortTimeUnits should return ascending sorted time units', () => {
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY]))
      .toEqual([TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY, TimeUnit.YEAR]);
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.SECOND, TimeUnit.MILLISECOND]))
      .toEqual([TimeUnit.MILLISECOND, TimeUnit.SECOND, TimeUnit.HOUR, TimeUnit.DAY]);
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.MILLISECOND, TimeUnit.HOUR, TimeUnit.SECOND, TimeUnit.MINUTE]))
      .toEqual([TimeUnit.MILLISECOND, TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR]);

    expect(DateTimeUtils.sortTimeUnits([TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY], 'asc'))
      .toEqual([TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY, TimeUnit.YEAR]);
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.SECOND, TimeUnit.MILLISECOND], 'asc'))
      .toEqual([TimeUnit.MILLISECOND, TimeUnit.SECOND, TimeUnit.HOUR, TimeUnit.DAY]);
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.MILLISECOND, TimeUnit.HOUR, TimeUnit.SECOND, TimeUnit.MINUTE], 'asc'))
      .toEqual([TimeUnit.MILLISECOND, TimeUnit.SECOND, TimeUnit.MINUTE, TimeUnit.HOUR]);
  });

  it('#sortTimeUnits should return descending sorted time units', () => {
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.YEAR, TimeUnit.MILLISECOND, TimeUnit.MINUTE, TimeUnit.DAY], 'desc'))
      .toEqual([TimeUnit.YEAR, TimeUnit.DAY, TimeUnit.MINUTE, TimeUnit.MILLISECOND]);
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MONTH, TimeUnit.MILLISECOND], 'desc'))
      .toEqual([TimeUnit.MONTH, TimeUnit.DAY, TimeUnit.HOUR, TimeUnit.MILLISECOND]);
    expect(DateTimeUtils.sortTimeUnits([TimeUnit.MINUTE, TimeUnit.MILLISECOND, TimeUnit.SECOND], 'desc'))
      .toEqual([TimeUnit.MINUTE, TimeUnit.SECOND, TimeUnit.MILLISECOND]);
  });

  it('#defineTimeUnits should not set time unit when column is not time', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TEXT, width: 10 }
    ];
    const entries = [
      { X: now - sec },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when entries are null', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, null);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when entries are undefined', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, undefined);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when entries are empty', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, []);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should not set time unit when no entry contains time value', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [{ A: 1 }, { A: 2 }];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBeUndefined();
  });

  it('#defineTimeUnits should set MILLISECOND', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - sec },
      { A: 'test' },
      { X: now }
    ];

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MILLISECOND);
  });

  it('#defineTimeUnits should set SECOND', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - min },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.SECOND);
  });

  it('#defineTimeUnits should set MINUTE', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - hour },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.MINUTE);
  });

  it('#defineTimeUnits should set HOUR', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - day },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.HOUR);
  });

  it('#defineTimeUnits should set DAY', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { X: now - (10 * day) },
      { A: 'test' },
      { X: now }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.DAY);
  });

  it('#defineTimeUnits should set distinct time units when multiple time columns are present', () => {

    // given
    const timeColumns: Column[] = [
      { name: 'X', dataType: DataType.TIME, width: 10 },
      { name: 'Y', dataType: DataType.TIME, width: 10 },
      { name: 'Z', dataType: DataType.TIME, width: 10 }
    ];
    const entries = [
      { A: 1, X: now, Y: now - (10 * hour) },
      { A: 2, Y: now, Z: now },
      { A: 3, X: now - (10 * day), Z: now - (10 * min) }
    ]

    // when
    DateTimeUtils.defineTimeUnits(timeColumns, entries);

    // then
    expect(timeColumns[0].groupingTimeUnit).toBe(TimeUnit.DAY);
    expect(timeColumns[1].groupingTimeUnit).toBe(TimeUnit.HOUR);
    expect(timeColumns[2].groupingTimeUnit).toBe(TimeUnit.MINUTE);
  });

  it('#diff when time unit has fixed length', () => {
    expect(DateTimeUtils.diff(now, now + 12, TimeUnit.MILLISECOND)).toBe(12);
    expect(DateTimeUtils.diff(now, now + (sec * 12), TimeUnit.SECOND)).toBe(12);
    expect(DateTimeUtils.diff(now, now + (min * 12), TimeUnit.MINUTE)).toBe(12);
    expect(DateTimeUtils.diff(now, now + (hour * 12), TimeUnit.HOUR)).toBe(12);
  });

  it('#diff when clock change between start and end time', () => {
    try {
      // given
      Settings.defaultZone = 'Europe/Paris';
      const format = 'dd.MM.yyyy';
      const start = toDateTime('25.03.2023', format).toMillis();
      const end = toDateTime('27.03.2023', format).toMillis();

      expect(DateTimeUtils.diff(start, end, TimeUnit.HOUR)).toBe(47);
      expect(DateTimeUtils.diff(start, end, TimeUnit.DAY)).toBe(2);
    } finally {
      Settings.defaultZone = null;
    }
  });

  it('#add should return start time when count is missing or zero', () => {
    expect(DateTimeUtils.add(now, TimeUnit.MILLISECOND, null)).toBe(now);
    expect(DateTimeUtils.add(now, TimeUnit.MILLISECOND, undefined)).toBe(now);
    expect(DateTimeUtils.add(now, TimeUnit.MILLISECOND, 0)).toBe(now);
  });

  it('#add when time unit has fixed length', () => {
    expect(DateTimeUtils.add(now, TimeUnit.MILLISECOND, 3)).toBe(now + 3);
    expect(DateTimeUtils.add(now, TimeUnit.SECOND, 3)).toBe(now + (3 * sec));
    expect(DateTimeUtils.add(now, TimeUnit.MINUTE, 3)).toBe(now + (3 * min));
    expect(DateTimeUtils.add(now, TimeUnit.HOUR, 3)).toBe(now + (3 * hour));
  });

  it('#add when clock change is involved', () => {
    try {
      // given
      Settings.defaultZone = 'Europe/Paris';
      const format = 'dd.MM.yyyy HH';
      const start = toDateTime('25.03.2023 12', format).toMillis();

      // when
      const time = DateTimeUtils.add(start, TimeUnit.HOUR, 47);

      // then
      expect(DateTime.fromMillis(time).toFormat(format)).toBe('27.03.2023 12');
    } finally {
      Settings.defaultZone = null;
    }
  });

  it('#startOf MILLISECOND', () => {
    expect(DateTimeUtils.startOf(now, TimeUnit.MILLISECOND)).toBe(now);
  });

  it('#startOf SECOND', () => {
    // given
    const format = 'dd.MM.yyyy HH:mm:ss SSS';
    const time = toTime('02.05.2023 06:15:23 153', format);

    // when
    const result = DateTimeUtils.startOf(time, TimeUnit.SECOND);

    // then
    expect(toFormat(result, format)).toBe('02.05.2023 06:15:23 000');
  });

  it('#startOf MINUTE', () => {
    // given
    const format = 'dd.MM.yyyy HH:mm:ss SSS';
    const time = toTime('02.05.2023 06:15:23 153', format);

    // when
    const result = DateTimeUtils.startOf(time, TimeUnit.MINUTE);

    // then
    expect(toFormat(result, format)).toBe('02.05.2023 06:15:00 000');
  });

  it('#startOf HOUR', () => {
    // given
    const format = 'dd.MM.yyyy HH:mm:ss SSS';
    const time = toTime('02.05.2023 06:15:23 153', format);

    // when
    const result = DateTimeUtils.startOf(time, TimeUnit.HOUR);

    // then
    expect(toFormat(result, format)).toBe('02.05.2023 06:00:00 000');
  });

  it('#startOf DAY', () => {
    // given
    const format = 'dd.MM.yyyy HH:mm:ss SSS';
    const time = toTime('02.05.2023 06:15:23 153', format);

    // when
    const result = DateTimeUtils.startOf(time, TimeUnit.DAY);

    // then
    expect(toFormat(result, format)).toBe('02.05.2023 00:00:00 000');
  });

  it('#startOf MONTH', () => {
    // given
    const format = 'dd.MM.yyyy HH:mm:ss SSS';
    const time = toTime('02.05.2023 06:15:23 153', format);

    // when
    const result = DateTimeUtils.startOf(time, TimeUnit.MONTH);

    // then
    expect(toFormat(result, format)).toBe('01.05.2023 00:00:00 000');
  });

  it('#startOf YEAR', () => {
    // given
    const format = 'dd.MM.yyyy HH:mm:ss SSS';
    const time = toTime('02.05.2023 06:15:23 153', format);

    // when
    const result = DateTimeUtils.startOf(time, TimeUnit.YEAR);

    // then
    expect(toFormat(result, format)).toBe('01.01.2023 00:00:00 000');
  });

  function toFormat(time: number, format): string {
    return DateTime.fromMillis(time).toFormat(format);
  }

  function fromNow(numberOfTimeUnit: number, timeUnit: TimeUnit): number {
    return DateTime.fromMillis(now).plus({ [timeUnit]: numberOfTimeUnit }).toMillis();
  }

  function toTime(value: string, format: string): number {
    return toDateTime(value, format).toMillis();
  }

  function toDateTime(value: string, format: string): DateTime {
    return DateTime.fromFormat(value, format);
  }
});
