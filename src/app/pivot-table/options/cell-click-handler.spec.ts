import { Column, DataType, TimeUnit, Query, PropertyFilter, Operator } from 'app/shared/model';
import { RawDataRevealService } from 'app/shared/services';
import { CellClickHandler } from './cell-click-handler';
import { DateTimeUtils, ColumnNameConverter } from 'app/shared/utils';
import { ValueRangeFilter, ValueGrouping, ValueRange } from 'app/shared/value-range/model';

describe('CellClickHandler', () => {

   const now = new Date().getTime();
   let columns: Column[];
   let rawDataRevealService: RawDataRevealService;
   let cellClickHandler: CellClickHandler;
   let showSpy: jasmine.Spy; 

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
      cellClickHandler = new CellClickHandler(rawDataRevealService);
      spyOn(rawDataRevealService, 'ofIDs').and.callFake(q => null);
      showSpy = spyOn(rawDataRevealService, 'show').and.callFake(q => null);
   });

   it('#onCellClicked should show raw data with single empty filter', () => {

      // given
      const mouseEvent = createMouseEvent('any');
      const filters = { Percent: 'null' };

      // when
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
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
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
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
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Amount', Operator.EQUAL, 12, DataType.NUMBER));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single TIME filter', () => {

      // given
      column('Time').groupingTimeUnit = TimeUnit.MILLISECOND;
      const mouseEvent = createMouseEvent('any');
      const filters = { Time: now };

      // when
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Time', Operator.EQUAL, now, DataType.TIME));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single TIME range filter', () => {

      // given
      const mouseEvent = createMouseEvent('any');
      const timeColumn = column('Time');
      const label = ColumnNameConverter.toLabel(timeColumn, timeColumn.groupingTimeUnit);
      const nowFormatted = DateTimeUtils.formatTime(now, timeColumn.groupingTimeUnit);
      const filters = { [label]: nowFormatted };

      // when
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
      const valueRangeFilters = query.getValueRangeFilters();
      expect(valueRangeFilters.length).toBe(1);
      const min = DateTimeUtils.toDate(now, timeColumn.groupingTimeUnit).getTime();
      expect(valueRangeFilters[0]).toEqual(new ValueRangeFilter('Time', { min: min, max: min + 60_000 }));
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single filter for empty value range', () => {

      // given
      const valueGroupings = [ createValueGrouping('Amount')];
      const mouseEvent = createMouseEvent('any');
      const filters = { Amount: 'empty' };

      // when
      cellClickHandler.onCellClicked(columns, valueGroupings, mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(1);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Amount', Operator.EMPTY, '', DataType.NUMBER));
      expect(query.getValueRangeFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with single filter for value range', () => {

      // given
      const valueGroupings = [ createValueGrouping('Amount')];
      const mouseEvent = createMouseEvent('any');
      const filters = { Amount: '10 - 20' };

      // when
      cellClickHandler.onCellClicked(columns, valueGroupings, mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];
      const valueRangeFilters = query.getValueRangeFilters();
      expect(valueRangeFilters.length).toBe(1);
      expect(valueRangeFilters[0]).toEqual(new ValueRangeFilter('Amount', { min: 10, max: 20 }));
      expect(query.getPropertyFilters()).toEqual([]);
   });

   it('#onCellClicked should show raw data with multiple filters', () => {

      // given
      const valueGroupings = [ createValueGrouping('Amount')];
      const mouseEvent = createMouseEvent('any');
      const filters = { Level: 'INFO', Host: 'server1', Amount: 'min - 20', Percent: 'null' };

      // when
      cellClickHandler.onCellClicked(columns, valueGroupings, mouseEvent, filters, {});

      // then
      expect(showSpy).toHaveBeenCalled();
      const query: Query = showSpy.calls.mostRecent().args[0];

      const propertyFilters = query.getPropertyFilters();
      expect(propertyFilters.length).toBe(3);
      expect(propertyFilters[0]).toEqual(new PropertyFilter('Level', Operator.EQUAL, 'INFO', DataType.TEXT));
      expect(propertyFilters[1]).toEqual(new PropertyFilter('Host', Operator.EQUAL, 'server1', DataType.TEXT));
      expect(propertyFilters[2]).toEqual(new PropertyFilter('Percent', Operator.EMPTY, '', DataType.NUMBER));

      const valueRangeFilters = query.getValueRangeFilters();
      expect(valueRangeFilters.length).toBe(1);
      expect(valueRangeFilters[0]).toEqual(new ValueRangeFilter('Amount', { min: undefined, max: 20 }));
   });

   it('#onCellClicked should reveal raw data by IDs when total cell', () => {

      // given
      const mouseEvent = createMouseEvent('pvtTotal');
      const filters = { Level: 'ERROR' };

      // when
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, new PivotData(true));

      // then
      expect(rawDataRevealService.ofIDs).toHaveBeenCalledWith(['1', '4', '8']);
   });

   it('#onCellClicked should not reveal raw data by IDs when total cell but no data', () => {

      // given
      const mouseEvent = createMouseEvent('pvtTotal');
      const filters = { Level: 'ERROR' };

      // when
      cellClickHandler.onCellClicked(columns, [], mouseEvent, filters, new PivotData(false));

      // then
      expect(rawDataRevealService.ofIDs).not.toHaveBeenCalled();
   });

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function createValueGrouping(columnName: string): ValueGrouping {
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      return { columnName: columnName, ranges: ranges };
   }

   function createMouseEvent(cssClass: string): Object {
      const classList = document.createElement('TD').classList;
      classList.add(cssClass);
      return { srcElement: { classList: classList } };
   }

   class PivotData {

      private entries = [
         { _id: '1' },
         { _id: '4' },
         { _id: '8' },
      ];

      constructor(private hasData: boolean) { }

      forEachMatchingRecord(filters: any, callback: (entry: any) => any): void {
         if (this.hasData) {
            this.entries.forEach(entry => callback(entry));
         }
      }
   }

});
