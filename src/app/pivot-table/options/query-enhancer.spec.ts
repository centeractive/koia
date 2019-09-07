import { QueryEnhancer } from './query-enhancer';
import { DataType, TimeUnit, Query, Column, PropertyFilter, Operator } from 'app/shared/model';
import { ValueRange, ValueGrouping, ValueRangeFilter } from 'app/shared/value-range/model';
import { DateTimeUtils, ColumnNameConverter } from 'app/shared/utils';
import { TimeGroupingService } from 'app/shared/services';

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

   it('#addDataFilters should add empty filter', () => {

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

   it('#addDataFilters should add value filter when standard column', () => {

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

   it('#addDataFilters should add value filter when time column with no grouping timeunit', () => {

      // given
      column('Time').groupingTimeUnit = TimeUnit.MILLISECOND;
      const filters = { Time: now };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Time', Operator.EQUAL, now, DataType.TIME)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addDataFilters should add range filter when time column with grouping timeunit', () => {

      // given
      column('Time').groupingTimeUnit = TimeUnit.SECOND;
      const label = ColumnNameConverter.toLabel(column('Time'), TimeUnit.SECOND);
      const nowFormatted = DateTimeUtils.formatTime(now, TimeUnit.SECOND);
      const filters = { [label]: nowFormatted };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      const min = DateTimeUtils.toDate(now, TimeUnit.SECOND).getTime();
      const expectedFilter = new ValueRangeFilter('Time', { min: min, max: min + 1_000, maxExcluding: undefined }, false);
      expect(query.getValueRangeFilters()).toEqual([expectedFilter]);
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#addDataFilters should add empty value filter for empty value grouping', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const filters = { Amount: TimeGroupingService.EMPTY };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, filters);

      // when
      queryEnhancer.addBasicFilters();

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Amount', Operator.EMPTY, '', DataType.NUMBER)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addDataFilters should add value range filter for value grouping', () => {

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

   it('#addLocalFilters should not change query when no exclusions exist', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices(undefined, { colAttrs: ['Level'], rowAttrs: [] }, {});

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addLocalFilters should add value filter for excluded values', () => {

      // given
      const filters = { Amount: 12 };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, [], filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ Level: ['DEBUG', 'INFO'] }, { colAttrs: ['Level'], rowAttrs: [] },
         { colAttrs: ['Amount'], rowAttrs: ['Level'] });

      // then
      const query = queryEnhancer.getQuery();
      expect(query.getPropertyFilters()).toEqual([new PropertyFilter('Level', Operator.NONE_OF, 'DEBUG,INFO', DataType.TEXT)]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#addLocalFilters should add NOT EMPTY filter when empty value group is excluded', () => {

      // given
      const valueGroupings = [createValueGrouping('Percent')];
      const filters = { Amount: TimeGroupingService.EMPTY };
      const queryEnhancer = new QueryEnhancer(new Query(), columns, valueGroupings, filters);

      // when
      queryEnhancer.addFiltersForValueChoices({ Percent: [TimeGroupingService.EMPTY] }, { colAttrs: ['Level'], rowAttrs: ['Percent'] },
         { colAttrs: ['Amount'], rowAttrs: ['Percent'] });

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
