import { QueryEnhancer } from './query-enhancer';
import { DataType, TimeUnit, Query, Column, PropertyFilter, Operator } from 'app/shared/model';
import { ValueRange, ValueGrouping, ValueRangeFilter } from 'app/shared/value-range/model';
import { DateTimeUtils } from 'app/shared/utils';
import { TimeGroupingService } from 'app/shared/services';
import { ValueRangeConverter } from 'app/shared/value-range';
import { Settings } from 'luxon';

describe('QueryEnhancer', () => {

   const now = new Date().getTime();
   let columns: Column[];

   beforeEach(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
         { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
         { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
         { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
         { name: 'Percent', dataType: DataType.NUMBER, width: 20, indexed: true }
      ];
   });

   it('#addBasicFilters should add empty filter', () => {

      // given
      const filters = { Level: 'null' };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.EMPTY, '', DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addBasicFilters should add value filter when standard column', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Amount', Operator.EQUAL, 12, DataType.NUMBER)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addBasicFilters should add value filter when time column with non-grouping timeunit', () => {

      // given
      column('Time').groupingTimeUnit = TimeUnit.MILLISECOND;
      const downroundedTime = DateTimeUtils.toBaseDate(now, TimeUnit.DAY).getTime();
      const formattedTime = DateTimeUtils.formatTime(downroundedTime, TimeUnit.MILLISECOND);
      const filters = { Time: formattedTime };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      const expectedFilter = new ValueRangeFilter('Time', { min: downroundedTime, max: downroundedTime + 1, maxExcluding: true }, false);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addBasicFilters should add value filter when time column with grouping timeunit', () => {

      // given
      column('Time').groupingTimeUnit = TimeUnit.SECOND;
      const downroundedTime = DateTimeUtils.toBaseDate(now, TimeUnit.SECOND).getTime();
      const formattedTime = DateTimeUtils.formatTime(downroundedTime, TimeUnit.SECOND);
      const filters = { Time: formattedTime };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      const expectedFilter = new ValueRangeFilter('Time', {
         min: downroundedTime, max: downroundedTime + 1_000,
         maxExcluding: true
      }, false);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addBasicFilters should add empty value filter for empty time', () => {

      // given
      const filters = { Time: TimeGroupingService.EMPTY };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Time', Operator.EMPTY, '', DataType.TIME)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addBasicFilters should add empty value filter for empty value grouping', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const filters = { Amount: ValueRangeConverter.EMPTY };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Amount', Operator.EMPTY, '', DataType.NUMBER)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addBasicFilters should add value range filter for value grouping', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const filters = { Amount: '1000 - 2000' };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      const expectedFilter = new ValueRangeFilter('Amount', { min: 1000, max: 2000, maxExcluding: true }, false);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addBasicFilters should add not-empty filter for value group without bounds', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, { Amount: 'min - max' });

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Amount', Operator.NOT_EMPTY, '', DataType.NUMBER)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addBasicFilters should resolve label naming a text column although it looks like a time label', () => {

      // given
      columns.push({ name: 'Duration', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.DAY });
      columns.push({ name: 'Duration (per day)', dataType: DataType.TEXT, width: 60 });
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], { 'Duration (per day)': 'long' });

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Duration (per day)', Operator.EQUAL, 'long', DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addBasicFilters should add time range filter of second occurrence of hour repeated when clocks are turned back', () => {

      // given
      Settings.defaultZone = 'Europe/Zurich';
      column('Time').groupingTimeUnit = TimeUnit.HOUR;
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], { Time: '27 Oct 2024 02 +01:00' });

      try {
         // when
         queryEnhancer.addBasicFilters();

         // then
         const expectedFilter = new ValueRangeFilter('Time',
            { min: Date.UTC(2024, 9, 27, 1), max: Date.UTC(2024, 9, 27, 2), maxExcluding: true }, false);
         expect(queryEnhancer.getQuery().getValueRangeFilters()).toEqual([expectedFilter]);
      } finally {
         Settings.defaultZone = null;
      }
   });

   it('#addFiltersForValueChoices should not change query when no exclusions exist', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({});

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should add value filter for excluded values', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ Level: ['DEBUG', 'INFO'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.NONE_OF, 'DEBUG;INFO', DataType.TEXT, true)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should skip excluded values of pinned attributes', () => {

      // given
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], { Level: 'ERROR' });

      // when
      queryEnhancer.addFiltersForValueChoices({ Level: ['DEBUG'], Host: ['server9'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Host', Operator.NONE_OF, 'server9', DataType.TEXT, true)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should exclude texts with semicolon or surrounding blanks one by one', () => {

      // given
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], {});

      // when
      queryEnhancer.addFiltersForValueChoices({ Path: ['/a', 'x;y', ' z'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Path', Operator.NONE_OF, '/a', DataType.TEXT, true),
         new PropertyFilter('Path', Operator.NOT_EQUAL, 'x;y', DataType.TEXT, true),
         new PropertyFilter('Path', Operator.NOT_EQUAL, ' z', DataType.TEXT, true)
      ]);
   });

   it('#addFiltersForValueChoices should add inverted time range keeping empty values when time is excluded', () => {

      // given
      const filters = { Amount: 12 };
      const baseTime = DateTimeUtils.toBaseDate(now, TimeUnit.MINUTE).getTime();
      const formattedTime = DateTimeUtils.formatTime(baseTime, TimeUnit.MINUTE);
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ 'Time (per minute)': [formattedTime] });

      // then
      const query = queryEnhancer.getQuery();
      const expectedFilter = new ValueRangeFilter('Time', { min: baseTime, max: baseTime + 60_000, maxExcluding: true },
         true, true);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should resolve suffixed time label when a column is named like the time label', () => {

      // given
      columns.push({ name: 'Time (per minute)', dataType: DataType.TEXT, width: 60 });
      const baseTime = DateTimeUtils.toBaseDate(now, TimeUnit.MINUTE).getTime();
      const formattedTime = DateTimeUtils.formatTime(baseTime, TimeUnit.MINUTE);
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], {});

      // when
      queryEnhancer.addFiltersForValueChoices({ 'Time (per minute)': ['x'], 'Time (per minute) #': [formattedTime] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Time (per minute)', Operator.NONE_OF, 'x', DataType.TEXT, true)]);
      const expectedFilter = new ValueRangeFilter('Time', { min: baseTime, max: baseTime + 60_000, maxExcluding: true },
         true, true);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
   });

   it('#addFiltersForValueChoices should exclude first occurrence of minute repeated when clocks are turned back', () => {

      // given
      Settings.defaultZone = 'Europe/Zurich';
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], { Amount: 12 });

      try {
         // when
         queryEnhancer.addFiltersForValueChoices({ 'Time (per minute)': ['27 Oct 2024 02:30 +02:00'] });

         // then
         const expectedFilter = new ValueRangeFilter('Time',
            { min: Date.UTC(2024, 9, 27, 0, 30), max: Date.UTC(2024, 9, 27, 0, 31), maxExcluding: true }, true, true);
         expect(queryEnhancer.getQuery().getValueRangeFilters()).toEqual([expectedFilter]);
      } finally {
         Settings.defaultZone = null;
      }
   });

   it('#addFiltersForValueChoices should add non-empty value filter when empty time is exclued', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ 'Time (per minute)': ['empty'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Time', Operator.NOT_EMPTY, '', DataType.TIME )]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should add NOT EMPTY filter when empty value group is excluded', () => {

      // given
      const valueGroupings = [createValueGrouping('Percent')];
      const filters = { Amount: ValueRangeConverter.EMPTY };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ Percent: [TimeGroupingService.EMPTY] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Percent', Operator.NOT_EMPTY, '', DataType.NUMBER)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should add inverted range keeping empty values when value group is excluded', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, {});

      // when
      queryEnhancer.addFiltersForValueChoices({ Amount: ['10 - 20'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getValueRangeFilters()).toEqual([new ValueRangeFilter('Amount', { min: 10, max: 20, maxExcluding: true }, true, true)]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should exclude all values but keep empty ones when value group without bounds is excluded', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, {});

      // when
      queryEnhancer.addFiltersForValueChoices({ Amount: ['min - max'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getValueRangeFilters()).toEqual([
         new ValueRangeFilter('Amount', { min: undefined, max: undefined, maxExcluding: true }, true, true)
      ]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should exclude numbers one by one as exact numbers', () => {

      // given
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], {});

      // when
      queryEnhancer.addFiltersForValueChoices({ Amount: ['1e-7', '1234.5'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Amount', Operator.NOT_EQUAL, 1e-7, DataType.NUMBER, true),
         new PropertyFilter('Amount', Operator.NOT_EQUAL, 1234.5, DataType.NUMBER, true)
      ]);
   });

   it('#addFiltersForValueChoices should add not-empty filter when null is excluded from number column', () => {

      // given
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], {});
      const excludedValues = ['null', '5'];

      // when
      queryEnhancer.addFiltersForValueChoices({ Amount: excludedValues });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Amount', Operator.NOT_EMPTY, '', DataType.NUMBER),
         new PropertyFilter('Amount', Operator.NOT_EQUAL, 5, DataType.NUMBER, true)
      ]);
      expect(excludedValues).toEqual(['null', '5']);
   });

   it('#addFiltersForValueChoices should add not-empty filter only when null is the only excluded text value', () => {

      // given
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], {});

      // when
      queryEnhancer.addFiltersForValueChoices({ Level: ['null'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.NOT_EMPTY, '', DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function createValueGrouping(columnName: string): ValueGrouping {
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      return { columnName: columnName, ranges: ranges };
   }
})
