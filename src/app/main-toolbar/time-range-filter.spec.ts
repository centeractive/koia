import { DataType, TimeUnit, Query } from 'app/shared/model';
import { TimeRangeFilter } from './time-range-filter';
import { LabelType } from 'ng5-slider';

describe('TimeRangeFilter', () => {

   it('#constructor should create inactive time filter when selected value range is undefined', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      expect(filter.timeStart).toBe(timeStart);
      expect(filter.timeEnd).toBe(timeEnd);
      expect(filter.selTimeStart).toBe(timeStart);
      expect(filter.selTimeEnd).toBe(timeEnd);
      expect(filter.isFiltered()).toBeFalsy();
   });

   it('#constructor should create inactive time filter when selected values are undefined', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, { min: undefined, max: undefined });

      // then
      expect(filter.timeStart).toBe(timeStart);
      expect(filter.timeEnd).toBe(timeEnd);
      expect(filter.selTimeStart).toBe(timeStart);
      expect(filter.selTimeEnd).toBe(timeEnd);
      expect(filter.isFiltered()).toBeFalsy();
   });

   it('#constructor should create active time filter when selected start time is defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), { min: toTime(2001), max: null });

      // then
      expect(filter.timeStart).toBe(toTime(2000));
      expect(filter.timeEnd).toBe(toTime(2010));
      expect(filter.selTimeStart).toBe(toTime(2001));
      expect(filter.selTimeEnd).toBe(toTime(2010));
      expect(filter.isFiltered()).toBeTruthy();
   });

   it('#constructor should create active time filter when selected end time is defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), { min: null, max: toTime(2009) });

      // then
      expect(filter.timeStart).toBe(toTime(2000));
      expect(filter.timeEnd).toBe(toTime(2010));
      expect(filter.selTimeStart).toBe(toTime(2000));
      expect(filter.selTimeEnd).toBe(toTime(2009));
      expect(filter.isFiltered()).toBeTruthy();
   });

   it('#constructor should create active time filter when query start and end time are defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };
      const query = new Query();
      query.addValueRangeFilter('X', toTime(2001), toTime(2009));

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), query.findValueRangeFilter('X').valueRange);

      // then
      expect(filter.timeStart).toBe(toTime(2000));
      expect(filter.timeEnd).toBe(toTime(2010));
      expect(filter.selTimeStart).toBe(toTime(2001));
      expect(filter.selTimeEnd).toBe(toTime(2009));
      expect(filter.isFiltered()).toBeTruthy();
   });

   it('#constructor should predefine day step only when column has YEAR format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('day');
      expect(filter.selectedTimeStepAbbrev).toBe('d');
      expect(filter.availableTimeSteps).toEqual(['day']);
   });

   it('#constructor should predefine day step only when column has MONTH format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'MMM yyyy', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('day');
      expect(filter.selectedTimeStepAbbrev).toBe('d');
      expect(filter.availableTimeSteps).toEqual(['day']);
   });

   it('#constructor should predefine day step only when column has DAY format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('day');
      expect(filter.selectedTimeStepAbbrev).toBe('d');
      expect(filter.availableTimeSteps).toEqual(['day']);
   });

   it('#constructor should predefine hour step with hour/day choice when column has HOUR format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('hour');
      expect(filter.selectedTimeStepAbbrev).toBe('h');
      expect(filter.availableTimeSteps).toEqual(['hour', 'day']);
   });

   it('#constructor should predefine minute step with minute-day choice when column has MINUTE format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('minute');
      expect(filter.selectedTimeStepAbbrev).toBe('m');
      expect(filter.availableTimeSteps).toEqual(['minute', 'hour', 'day']);
   });

   it('#constructor should predefine second step with second-day choice when column has SECOND format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('second');
      expect(filter.selectedTimeStepAbbrev).toBe('s');
      expect(filter.availableTimeSteps).toEqual(['second', 'minute', 'hour', 'day']);
   });

   it('#constructor should predefine millisecond step with millisecond-day choice when column has MILLISECOND format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', timeUnit: TimeUnit.YEAR };

      // when
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // then
      expect(filter.selectedTimeStep).toBe('millisecond');
      expect(filter.selectedTimeStepAbbrev).toBe('ms');
      expect(filter.availableTimeSteps).toEqual(['millisecond', 'second', 'minute', 'hour', 'day']);
   });

   it('#constructor should create slider options when column has YEAR format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(86_400_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000');
      expect(options.combineLabels('1 Jan 2008', '1 Jan 2009')).toBe('1 Jan 2008 - 1 Jan 2009');
   });

   it('#constructor should create slider options when column has MONTH format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'MMM yyyy', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(86_400_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000');
      expect(options.combineLabels('1 Jan 2008', '1 Feb 2008')).toBe('1 Jan 2008 - 1 Feb 2008');
   });

   it('#constructor should create slider options when column has DAY format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(86_400_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000');
      expect(options.combineLabels('1 Jan 2008', '2 Jan 2008')).toBe('1 Jan 2008 - 2 Jan 2008');
   });

   it('#constructor should create slider options when column has HOUR format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(3_600_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000 00');
      expect(options.combineLabels('1 Jan 2008 05', '1 Jan 2008 06')).toBe('1 Jan 2008 05 - 1 Jan 2008 06');
   });

   it('#constructor should create slider options when column has MINUTE format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(60_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000 00:00');
      expect(options.combineLabels('1 Jan 2008 05:00', '1 Jan 2008 05:01')).toBe('1 Jan 2008 05:00 - 1 Jan 2008 05:01');
   });

   it('#constructor should create slider options when column has SECOND format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(1_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000 00:00:00');
      expect(options.combineLabels('1 Jan 2008 05:00:00', '1 Jan 2008 05:00:01')).toBe('1 Jan 2008 05:00:00 - 1 Jan 2008 05:00:01');
   });

   it('#constructor should create slider options when column has MILLISECOND format', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);

      // when
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(1);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000 00:00:00 000');
      expect(options.combineLabels('1 Jan 2008 05:00:00 000', '1 Jan 2008 05:00:00 001'))
         .toBe('1 Jan 2008 05:00:00 000 - 1 Jan 2008 05:00:00 001');
   });

   it('#onTimeStepChanged should change slider step definition', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', timeUnit: TimeUnit.YEAR };
      const filter = new TimeRangeFilter(column, toTime(2000), toTime(2010), null);

      // when
      filter.onTimeStepChanged(TimeUnit.HOUR);

      // then
      expect(filter.selectedTimeStep).toBe('hour');
      expect(filter.selectedTimeStepAbbrev).toBe('h');
      expect(filter.availableTimeSteps).toEqual(['millisecond', 'second', 'minute', 'hour', 'day']);
   });

   it('#onTimeStepChanged should re-create slider options', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'd MMM yyyy HH:mm:ss SSS', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);
      const filter = new TimeRangeFilter(column, timeStart, timeEnd, null);

      // when
      filter.onTimeStepChanged(TimeUnit.HOUR);

      // then
      const options = filter.timeRangeOptions;
      expect(options.floor).toBe(timeStart);
      expect(options.ceil).toBe(timeEnd);
      expect(options.step).toBe(3_600_000);
      expect(options.enforceStep).toBeFalsy();
      expect(options.draggableRange).toBeTruthy();
      expect(options.translate(timeStart, LabelType.Ceil)).toBe('1 Jan 2000 00:00:00 000');
      expect(options.combineLabels('1 Jan 2008 05', '1 Jan 2008 06')).toBe('1 Jan 2008 05 - 1 Jan 2008 06');
   });

   it('#reset should reset selected start and end time', () => {

      // given
      const column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy', timeUnit: TimeUnit.YEAR };
      const timeStart = toTime(2000);
      const timeEnd = toTime(2010);
      const filter = new TimeRangeFilter(column, timeStart, timeEnd,  { min: toTime(2001), max: toTime(2009) });

      // when
      filter.reset();

      // then
      expect(filter.timeStart).toBe(timeStart);
      expect(filter.timeEnd).toBe(timeEnd);
      expect(filter.selTimeStart).toBe(timeStart);
      expect(filter.selTimeEnd).toBe(timeEnd);
      expect(filter.isFiltered()).toBeFalsy();
   });

   function toTime(year: number): number {
      return new Date(year, 0).getTime();
   }
});
