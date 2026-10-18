import { Column, DataType, TimeUnit, Query, PropertyFilter, Operator } from 'app/shared/model';
import { RawDataRevealService, TimeGroupingService } from 'app/shared/services';
import { CellClickHandler } from './cell-click-handler';
import { ValueRangeFilter, ValueGrouping, ValueRange } from 'app/shared/value-range/model';
import { flush, fakeAsync } from '@angular/core/testing';
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
      rawDataRevealService = new RawDataRevealService(null, null);
      baseQueryProvider = { provide: () => new Query() };
      cellClickHandler = new CellClickHandler(columns, baseQueryProvider, rawDataRevealService);
      showSpy = vi.spyOn(rawDataRevealService, 'show').mockImplementation(() => null);
   });

   it('#onCellClicked should show raw data with single empty filter', () => {

      // given
      const mouseEvent = createMouseEvent('any');
      const filters = { Percent: 'null' };

      // when
      cellClickHandler.onCellClicked([], mouseEvent, filters, undefined, undefined, {});

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
      const mouseEvent = createMouseEvent('any');
      const filters = { Level: 'ERROR' };

      // when
      cellClickHandler.onCellClicked([], mouseEvent, filters, undefined, undefined, {});

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
      const mouseEvent = createMouseEvent('any');
      const filters = { Amount: 12 };

      // when
      cellClickHandler.onCellClicked([], mouseEvent, filters, undefined, undefined, {});

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
      const mouseEvent = createMouseEvent('any');
      const filters = { Amount: TimeGroupingService.EMPTY };

      // when
      cellClickHandler.onCellClicked(valueGroupings, mouseEvent, filters, undefined, undefined, {});

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
      const mouseEvent = createMouseEvent('any');
      const filters = { Amount: '10 - 20' };

      // when
      cellClickHandler.onCellClicked(valueGroupings, mouseEvent, filters, undefined, undefined, {});

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
      const mouseEvent = createMouseEvent('any');
      const filters = { Percent: 10 };

      // when
      cellClickHandler.onCellClicked([], mouseEvent, filters, undefined, undefined, {});

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
      const mouseEvent = createMouseEvent('any');
      const filters = { Level: 'INFO', Host: 'server1', Amount: 'min - 20', Percent: 'null' };

      // when
      cellClickHandler.onCellClicked(valueGroupings, mouseEvent, filters, undefined, undefined, {});

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

   it('#onCellClicked should show raw data when grand-total cell', fakeAsync(() => {

      // given
      const mouseEvent = createMouseEvent('pvtGrandTotal');

      // when
      cellClickHandler.onCellClicked([], mouseEvent, {}, undefined, undefined, {});
      flush();

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      expect(query.getPropertyFilters()).toEqual([]);
      expect(query.getValueRangeFilters()).toEqual([]);
   }));

   it.each([
      { case: 'total cell', cssClass: 'pvtTotal', expected: [new PropertyFilter('Level', Operator.NONE_OF, 'DEBUG;INFO', DataType.TEXT)] },
      { case: 'value cell', cssClass: 'pvtVal', expected: [] }
   ])('#onCellClicked should consider value choices only when bar chart $case is clicked', ({ cssClass, expected }) => {

      // given
      const cell = document.createElement('TD');
      cell.classList.add(cssClass);
      const bar = cell.appendChild(document.createElement('DIV'));
      const mouseEvent = { target: bar } as Partial<MouseEvent> as MouseEvent;
      const pivotData = { colAttrs: ['Amount'], rowAttrs: ['Level'] };

      // when
      cellClickHandler.onCellClicked([], mouseEvent, {}, { Level: ['DEBUG', 'INFO'] }, {}, pivotData);

      // then
      const query: Query = vi.mocked(showSpy).mock.lastCall[0];
      expect(query.getPropertyFilters()).toEqual(expected);
   });

   function createValueGrouping(columnName: string): ValueGrouping {
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      return { columnName: columnName, ranges: ranges };
   }

   function createMouseEvent(cssClass: string): MouseEvent {
      const cell = document.createElement('TD');
      cell.classList.add(cssClass);
      return { target: cell } as Partial<MouseEvent> as MouseEvent;
   }
});
