import { DatePipe } from '@angular/common';
import { Column, DataType, TimeUnit } from 'app/shared/model';
import { SummaryValueFormatter } from './summary-value-formatter';

describe('SummaryValueFormatter', () => {

  const now = new Date().setSeconds(0, 0);
  const timeColumn: Column = { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true };
  const numberColumn: Column = { name: 'n1', dataType: DataType.NUMBER, width: 80, indexed: true };
  const datePipe = new DatePipe('en-US');
  const formatter = new SummaryValueFormatter();

  it('#format should return null when value is null', () => {

    // when
    const formattedValue = formatter.format([], 0, null);

    // then
    expect(formattedValue).toBeNull();
  });

  it('#format should return undefined when value is undefined', () => {

    // when
    const formattedValue = formatter.format([], 0, undefined);

    // then
    expect(formattedValue).toBeUndefined();
  });

  it('#format should return string when value is text', () => {

    // when
    const formattedValue = formatter.format([], 0, 'abc');

    // then
    expect(formattedValue).toBe('abc');
  });

  it('#format should return boolean when value is boolean', () => {

    // when
    const formattedValue = formatter.format([], 0, true);

    // then
    expect(formattedValue).toBe(true);
  });

  it('#format should return formatted number when value of data column is number', () => {

    // when
    const formattedValue = formatter.format([], 0, -1_000_000.5);

    // then
    expect(formattedValue).toBe((-1_000_000.5).toLocaleString());
  });

  it('#format should return formatted number when value of hierarchy column is number', () => {

    // when
    const formattedValue = formatter.format([numberColumn], 0, -1_000_000.5);

    // then
    expect(formattedValue).toBe((-1_000_000.5).toLocaleString());
  });

  it('#format should return formatted time when hierarchy column is time', () => {

    // when
    const formattedValue = formatter.format([timeColumn], 0, now);

    // then
    expect(formattedValue).toBe(datePipe.transform(now, 'd MMM yyyy HH:mm'));
  });

  it('#format should return time formatted by column format when hierarchy time column has no time unit', () => {

    // given
    const column = { ...timeColumn, groupingTimeUnit: undefined, format: 'yyyy-MM-dd HH:mm' };

    // when
    const formattedValue = formatter.format([column], 0, now);

    // then
    expect(formattedValue).toBe(datePipe.transform(now, 'yyyy-MM-dd HH:mm'));
  });

  it('#format should return formatted number when hierarchy time column has neither time unit nor format', () => {

    // given
    const column = { ...timeColumn, groupingTimeUnit: undefined };

    // when
    const formattedValue = formatter.format([column], 0, now);

    // then
    expect(formattedValue).toBe(now.toLocaleString());
  });
});
