import { Column, DataType, TimeUnit, Query, PropertyFilter, Operator } from 'app/shared/model';
import { RawDataRevealService, TimeGroupingService } from 'app/shared/services';
import { CellClickHandler } from './cell-click-handler';
import { ValueRangeFilter, ValueGrouping, ValueRange } from 'app/shared/value-range/model';
import { QueryProvider } from './query-provider';
import type { Mock } from 'vitest';

describe('CellClickHandler', () => {

   let columns: Column[];
   let rawDataRevealService: RawDataRevealService;
   let baseQueryProvider: QueryProvider;
   let cellClickHandler: CellClickHandler;
   let showSpy: Mock;

   beforeEach(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.MINUTE, indexed: true },
         { name: 'Level', dataType: DataType.TEXT, width: 60, indexed: true },
         { name: 'Host', dataType: DataType.TEXT, width: 80, indexed: true },
         { name: 'Path', dataType: DataType.TEXT, width: 200, indexed: true },
         { name: 'Amount', dataType: DataType.NUMBER, width: 70, indexed: true },
         { name: 'Percent', dataType: DataType.NUMBER, width: 20, indexed: true }
      ];
      rawDataRevealService = new RawDataRevealService(null, null, null, null);
      baseQueryProvider = { provide: () => new Query() };
      cellClickHandler = new CellClickHandler(columns, baseQueryProvider, rawDataRevealService);
      showSpy = vi.spyOn(rawDataRevealService, 'show').mockImplementation(() => null);
   });

   it('#onCellClicked should show raw data with single empty filter', () => {

      // given
      const filters = { Percent: 'null' };

      // when
      cellClickHandler.onCellClicked([], filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Percent', Operator.EMPTY, '', DataType.NUMBER));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single TEXT filter', () => {

      // given
      const filters = { Level: 'ERROR' };

      // when
      cellClickHandler.onCellClicked([], filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single NUMBER filter', () => {

      // given
      const filters = { Amount: 12 };

      // when
      cellClickHandler.onCellClicked([], filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Amount', Operator.EQUAL, 12, DataType.NUMBER));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single filter for empty value range', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const filters = { Amount: TimeGroupingService.EMPTY };

      // when
      cellClickHandler.onCellClicked(valueGroupings, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Amount', Operator.EMPTY, '', DataType.NUMBER));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single filter for value range', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const filters = { Amount: '10 - 20' };

      // when
      cellClickHandler.onCellClicked(valueGroupings, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      const valueRangeFilters = query.getValueRangeFilters();
      expect(valueRangeFilters.length).toBe(1);
      expect(valueRangeFilters[0]).toEqual(new ValueRangeFilter('Amount', { min: 10, max: 20, maxExcluding: true }));
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with filters from base query', () => {

      // given
      const baseQuery = new Query(new PropertyFilter('Level', Operator.EQUAL, 'WARN', DataType.TEXT));
      baseQuery.addValueRangeFilter('Amount', 11, 22);
      vi.spyOn(baseQueryProvider, 'provide').mockReturnValue(baseQuery);
      const filters = { Percent: 10 };

      // when
      cellClickHandler.onCellClicked([], filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(2);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Level', Operator.EQUAL, 'WARN', DataType.TEXT));
      expect(propertyFilters[1]).toEqual(new PropertyFilter('Percent', Operator.EQUAL, 10, DataType.NUMBER));
      const valueRangeFilters = query.getValueRangeFilters();
      expect(valueRangeFilters.length).toBe(1);
      expect(valueRangeFilters[0]).toEqual(new ValueRangeFilter('Amount', { min: 11, max: 22, maxExcluding: undefined }));
   });

   it('#onCellClicked should show raw data with multiple filters', () => {

      // given
      const valueGroupings = [createValueGrouping('Amount')];
      const filters = { Level: 'INFO', Host: 'server1', Amount: 'min - 20', Percent: 'null' };

      // when
      cellClickHandler.onCellClicked(valueGroupings, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];

      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(3);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Level', Operator.EQUAL, 'INFO', DataType.TEXT));
      expect(propertyFilters[1]).toEqual(new PropertyFilter('Host', Operator.EQUAL, 'server1', DataType.TEXT));
      expect(propertyFilters[2]).toEqual(new PropertyFilter('Percent', Operator.EMPTY, '', DataType.NUMBER));

      const valueRangeFilters = query.getValueRangeFilters();
      expect(valueRangeFilters.length).toBe(1);
      expect(valueRangeFilters[0]).toEqual(new ValueRangeFilter('Amount', { min: undefined, max: 20, maxExcluding: true }));
   });

   it('#onCellClicked should show raw data of all rows when cell pins no attribute', () => {

      // when
      cellClickHandler.onCellClicked([], {}, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      expect(query.getPropertyFilters()).toEqual([]);
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should explain row total against base query reduced by exclusions of all attributes', () => {

      // given
      baseQueryProvider.provide = () => new Query(new PropertyFilter('Path', Operator.EQUAL, '/', DataType.TEXT));
      const exclusions = { Level: ['DEBUG'], Host: ['server9'], Path: ['/x'] };

      // when
      cellClickHandler.onCellClicked([], { Level: 'ERROR' }, exclusions);

      // then
      const explainBase: Query = vi.mocked(showSpy).mock.lastCall[1];
      expect(explainBase.getPropertyFilters()).toEqual([
         new PropertyFilter('Path', Operator.EQUAL, '/', DataType.TEXT),
         new PropertyFilter('Level', Operator.NONE_OF, 'DEBUG', DataType.TEXT, true),
         new PropertyFilter('Host', Operator.NONE_OF, 'server9', DataType.TEXT, true),
         new PropertyFilter('Path', Operator.NONE_OF, '/x', DataType.TEXT, true)
      ]);
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Path', Operator.EQUAL, '/', DataType.TEXT),
         new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT),
         new PropertyFilter('Host', Operator.NONE_OF, 'server9', DataType.TEXT, true),
         new PropertyFilter('Path', Operator.NONE_OF, '/x', DataType.TEXT, true)
      ]);
   });

   it('#onCellClicked should exclude values of unpinned attributes and explain against base query with exclusions of all attributes', () => {

      // when
      cellClickHandler.onCellClicked([], { Level: 'ERROR', Host: 'server1' }, { Host: ['server9'], Path: ['/x'] });

      // then
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      expect(query.getPropertyFilters()).toEqual([
         new PropertyFilter('Level', Operator.EQUAL, 'ERROR', DataType.TEXT),
         new PropertyFilter('Host', Operator.EQUAL, 'server1', DataType.TEXT),
         new PropertyFilter('Path', Operator.NONE_OF, '/x', DataType.TEXT, true)
      ]);
      const explainBase: Query = vi.mocked(showSpy).mock.lastCall[1];
      expect(explainBase.getPropertyFilters()).toEqual([
         new PropertyFilter('Host', Operator.NONE_OF, 'server9', DataType.TEXT, true),
         new PropertyFilter('Path', Operator.NONE_OF, '/x', DataType.TEXT, true)
      ]);
   });

   it('#onCellClicked should explain against base query when there are no value choices', () => {

      // when
      cellClickHandler.onCellClicked([], { Level: 'ERROR' }, {});

      // then
      const explainBase: Query = vi.mocked(showSpy).mock.lastCall[1];
      expect(explainBase.getPropertyFilters()).toEqual([]);
      expect(explainBase.getValueRangeFilters()).toEqual([]);
   });

   function createValueGrouping(columnName: string): ValueGrouping {
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      return { columnName: columnName, ranges: ranges };
   }
});
