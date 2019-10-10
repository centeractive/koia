import { QueryEnhancer } from './query-enhancer';
import { DataType, TimeUnit, Query, Column, PropertyFilter, Operator } from 'app/shared/model';
import { ValueRange, ValueGrouping, ValueRangeFilter } from 'app/shared/value-range/model';
import { DateTimeUtils } from 'app/shared/utils';
import { TimeGroupingService } from 'app/shared/services';
import { DatePipe } from '@angular/common';
import { ValueRangeConverter } from 'app/shared/value-range';

describe('QueryEnhancer', () => {

   const now = new Date().getTime();
   const datePipe = new DatePipe('en-us')
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

   it('#addFiltersForValueChoices should not change query when no exclusions exist', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices(undefined, undefined, { colAttrs: ['Level'], rowAttrs: [] });

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
      queryEnhancer.addFiltersForValueChoices({ Level: ['DEBUG', 'INFO'] }, {}, { colAttrs: ['Amount'], rowAttrs: ['Level'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.NONE_OF, 'DEBUG;INFO', DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should add time range filter when time is exclued', () => {

      // given
      const filters = { Amount: 12 };
      const baseTime = DateTimeUtils.toBaseDate(now, TimeUnit.MINUTE).getTime();
      const formattedTime = DateTimeUtils.formatTime(baseTime, TimeUnit.MINUTE);
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ 'Time (per minute)': [formattedTime] }, {}, {
         colAttrs: ['Time (per minute)'],
         rowAttrs: ['Amount']
      });

      // then
      const query = queryEnhancer.getQuery();
      const expectedFilter = new ValueRangeFilter('Time', { min: baseTime, max: baseTime + 60_000, maxExcluding: true },
         true);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addFiltersForValueChoices should add non-empty value filter when empty time is exclued', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ 'Time (per minute)': ['empty'] }, {}, {
         colAttrs: ['Time (per minute)'],
         rowAttrs: ['Amount']
      });

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
      queryEnhancer.addFiltersForValueChoices({ Percent: [TimeGroupingService.EMPTY] }, {},
         { colAttrs: ['Level', 'Amount'], rowAttrs: ['Percent'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Percent', Operator.NOT_EMPTY, '', DataType.NUMBER)]);
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
