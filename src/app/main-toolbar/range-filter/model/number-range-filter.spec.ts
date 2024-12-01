import { DataType, Query, TimeUnit } from 'app/shared/model';
import { NumberRangeFilter } from './number-range-filter';
import { LabelType } from '@angular-slider/ngx-slider';

describe('NumberRangeFilter', () => {

   it('#constructor should create inactive filter when selected value range is null', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const start = 0;
      const end = 10;

      // when
      const filter = new NumberRangeFilter(column, start, end, null, false);

      // then
      expect(filter.start).toBe(start);
      expect(filter.end).toBe(end);
      expect(filter.selValueRange.min).toBe(start);
      expect(filter.selValueRange.max).toBe(end);
      expect(filter.isFiltered()).toBeFalse();
   });

   it('#constructor should create inactive filter when selected values are undefined', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const start = 0;
      const end = 10;

      // when
      const filter = new NumberRangeFilter(column, start, end, { min: undefined, max: undefined }, false);

      // then
      expect(filter.start).toBe(start);
      expect(filter.end).toBe(end);
      expect(filter.selValueRange.min).toBe(start);
      expect(filter.selValueRange.max).toBe(end);
      expect(filter.isFiltered()).toBeFalse();
   });

   it('#constructor should create active filter when selected start time is defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, 0, 10, { min: 1, max: null }, false);

      // then
      expect(filter.start).toBe(0);
      expect(filter.end).toBe(10);
      expect(filter.selValueRange.min).toBe(1);
      expect(filter.selValueRange.max).toBe(10);
      expect(filter.isFiltered()).toBeTrue();
   });

   it('#constructor should create non-inverted filter when inverted is not defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, 0, 10, { min: null, max: 9 }, undefined);

      // then
      expect(filter.inverted).toBeFalse();
   });

   it('#constructor should create active filter when selected end time is defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, 0, 10, { min: null, max: 9 }, false);

      // then
      expect(filter.start).toBe(0);
      expect(filter.end).toBe(10);
      expect(filter.selValueRange.min).toBe(0);
      expect(filter.selValueRange.max).toBe(9);
      expect(filter.isFiltered()).toBeTrue();
   });

   it('#constructor should create active filter when start and end value are defined', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const query = new Query();
      query.addValueRangeFilter('X', 1, 9);

      // when
      const filter = new NumberRangeFilter(column, 0, 10, query.findValueRangeFilter('X').valueRange, false);

      // then
      expect(filter.start).toBe(0);
      expect(filter.end).toBe(10);
      expect(filter.selValueRange.min).toBe(1);
      expect(filter.selValueRange.max).toBe(9);
      expect(filter.isFiltered()).toBeTrue();
   });

   it('#constructor should init slider steps when values range from zero to positive', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, 0, 5_000_000, null, false);

      // then
      expect(filter.selectedStep).toBe(100_000);
      expect(filter.selectedStepAbbrev).toBe('n');
      expect(filter.availableSteps).toEqual([1, 10, 100, 1_000, 10_000, 100_000, 1_000_000]);
   });

   it('#constructor should init slider steps when values are both positive', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, 8_000, 28_000, null, false);

      // then
      expect(filter.selectedStep).toBe(100);
      expect(filter.selectedStepAbbrev).toBe('n');
      expect(filter.availableSteps).toEqual([0.01, 0.1, 1, 10, 100, 1_000]);
   });

   it('#constructor should init slider steps when values range negative to zero', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, -5_000_000, 0, null, false);

      // then
      expect(filter.selectedStep).toBe(100_000);
      expect(filter.selectedStepAbbrev).toBe('n');
      expect(filter.availableSteps).toEqual([1, 10, 100, 1_000, 10_000, 100_000, 1_000_000]);
   });

   it('#constructor should init slider steps when values are both negative', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, -28_000, -8_000, null, false);

      // then
      expect(filter.selectedStep).toBe(100);
      expect(filter.selectedStepAbbrev).toBe('n');
      expect(filter.availableSteps).toEqual([0.01, 0.1, 1, 10, 100, 1_000]);
   });

   it('#constructor should init slider steps when values range from negative to positive', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };

      // when
      const filter = new NumberRangeFilter(column, -755, 266, null, false);

      // then
      expect(filter.selectedStep).toBe(10);
      expect(filter.selectedStepAbbrev).toBe('n');
      expect(filter.availableSteps).toEqual([0.001, 0.01, 0.1, 1, 10, 100]);
   });

   it('#constructor should create slider options', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const start = -10;
      const end = 10;

      // when
      const filter = new NumberRangeFilter(column, start, end, null, false);

      // then
      const options = filter.sliderOptions;
      expect(options.floor).toBe(start);
      expect(options.ceil).toBe(end);
      expect(options.step).toBe(0.1);
      expect(options.enforceStep).toBeFalse();
      expect(options.draggableRange).toBeTrue();
      expect(options.translate(start, LabelType.Ceil)).toBe('-10');
      expect(options.combineLabels('-5', '8')).toBe('-5 - 8');
   });

   it('#onStepChanged should re-create slider options', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const start = 7;
      const end = 7_584_511;
      const filter = new NumberRangeFilter(column, start, end, null, false);

      // when
      filter.onStepChanged(1_000);

      // then
      const options = filter.sliderOptions;
      expect(options.floor).toBe(start);
      expect(options.ceil).toBe(end);
      expect(options.step).toBe(1_000);
      expect(options.enforceStep).toBeFalse();
      expect(options.draggableRange).toBeTrue();
      expect(options.translate(start, LabelType.Ceil)).toBe('7');
      expect(options.combineLabels('10', '200')).toBe('10 - 200');
   });

   it('#formatStep should not format time unit', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const filter = new NumberRangeFilter(column, 0, new Date().getTime(), null, false);

      // when
      const formatted = filter.formatStep(TimeUnit.MINUTE);

      // then
      expect(formatted).toBe(TimeUnit.MINUTE);
   });

   it('#formatStep should not format small number', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const filter = new NumberRangeFilter(column, 0, 1, null, false);
      const num = 0.000001;

      // when
      const formatted = filter.formatStep(num);

      // then
      expect(formatted).toBe(num);
   });

   it('#formatStep should format large number', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const filter = new NumberRangeFilter(column, 0, 5_000_000, null, false);
      const num = 3_000_000;

      // when
      const formatted = filter.formatStep(num);

      // then
      expect(formatted).toBe(num.toLocaleString());
   });

   it('#reset should reset selected start and end value', () => {

      // given
      const column = { name: 'X', dataType: DataType.NUMBER, width: 10 };
      const start = -5;
      const end = 151;
      const filter = new NumberRangeFilter(column, start, end, { min: -2, max: 84 }, false);

      // when
      filter.reset();

      // then
      expect(filter.start).toBe(start);
      expect(filter.end).toBe(end);
      expect(filter.selValueRange.min).toBe(start);
      expect(filter.selValueRange.max).toBe(end);
      expect(filter.isFiltered()).toBeFalse();
   });
});
