import { fakeAsync, flush } from '@angular/core/testing';
import { ColorProviderFactory } from '../color';
import { ValueGrouping } from '../value-range/model/value-grouping.type';
import { ValueRange } from '../value-range/model/value-range.type';
import { Aggregation } from './aggregation.enum';
import { ChangeEvent } from './change-event.enum';
import { Column } from './column.type';
import { DataType } from './data-type.enum';
import { ElementContext } from './element-context';
import { ExportFormat } from './export-format.enum';
import { ElementType, ViewElement } from './view-config';
import type { Mock } from 'vitest';

class TestContext extends ElementContext {

   constructor(columns: Column[]) {
      super(columns);
   }

   getTitle(): string {
      return 'test title';
   }

   getSupportedExportFormats(): ExportFormat[] {
      return [ExportFormat.JSON];
   }
}

describe('ElementContext', () => {

   let columns: Column[];
   let context: ElementContext;
   let eventHandlerSpy: Mock;

   beforeAll(() => {
      columns = [
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
   });

   beforeEach(() => {
      context = new TestContext(columns);
      eventHandlerSpy = vi.fn().mockImplementation(e => null);
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#dataColumns should replace missing value with empty array', fakeAsync(() => {

      // when
      context.dataColumns = undefined;
      flush();

      // then
      expect(context.dataColumns).toEqual([]);
   }));

   it('#gridColumnSpan should not fire size change event when row span is not changed', fakeAsync(() => {

      // when
      context.gridColumnSpan = context.gridColumnSpan;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#gridColumnSpan should fire size change event when row span is changed', fakeAsync(() => {

      // when
      context.gridColumnSpan = 9;
      flush();

      // then
      expect(context.gridColumnSpan).toBe(9);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.SIZE);
   }));

   it('#gridRowSpan should not fire size change event when row span is not changed', fakeAsync(() => {

      // when
      context.gridRowSpan = context.gridRowSpan;
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#gridRowSpan should fire size change event when row span is changed', fakeAsync(() => {

      // when
      context.gridRowSpan = 9;
      flush();

      // then
      expect(context.gridRowSpan).toBe(9);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.SIZE);
   }));

   it('#copyAttributes should copy grid spans', () => {

      // when
      context.copyAttributes(viewElement(2, 3));

      // then
      expect(context.gridColumnSpan).toBe(2);
      expect(context.gridRowSpan).toBe(3);
   });

   it('#copyAttributes should replace missing grid spans with 1', () => {

      // when
      context.copyAttributes(viewElement(null, undefined));

      // then
      expect(context.gridColumnSpan).toBe(1);
      expect(context.gridRowSpan).toBe(1);
   });

   it('#copyAttributes should keep default width when width is max safe integer', () => {

      // when
      context.copyAttributes({ ...viewElement(1, 1), width: Number.MAX_SAFE_INTEGER });

      // then
      expect(context.width).toBe(600);
   });

   it('#splitColumns should replace missing value with empty array', () => {

      // when
      context.splitColumns = undefined;

      // then
      expect(context.splitColumns).toEqual([]);
   });

   it('#colorProvider should not fire look change event when options are equal', fakeAsync(() => {

      // when
      context.colorProvider = ColorProviderFactory.create({ ...context.colorProvider.options });
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#colorProvider should fire look change event when options are different', fakeAsync(() => {

      // given
      const options = context.colorProvider.options;
      const colorProvider = ColorProviderFactory.create({ ...options, bgColorOpacity: options.bgColorOpacity / 2 });

      // when
      context.colorProvider = colorProvider;
      flush();

      // then
      expect(context.colorProvider).toBe(colorProvider);
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.LOOK);
   }));

   it('#groupByColumns should return empty array when no group by columns are defined', () => {
      context.groupByColumns = null;

      expect(context.groupByColumns).toEqual([]);
   });

   it('#aggregations should return empty array when no aggregation is defined', () => {
      context.aggregations = null;

      expect(context.aggregations).toEqual([]);
   });

   it('#aggregations should throw error when COUNT with other aggregation is provided', () => {
      expect(() => context.aggregations = [Aggregation.COUNT, Aggregation.MAX]).toThrow(expect.objectContaining({ message: 'Count must not be combined with other aggregations' }));
   });

   it('#valueGroupings should return empty array when no value groupings are defined', () => {
      context.valueGroupings = null;

      expect(context.valueGroupings).toEqual([]);
   });

   it('#isAnyColumnWithValueGroupingInUse should return false when no value grouping exists', () => {
      expect(context.isAnyColumnWithValueGroupingInUse()).toBe(false);
   });

   it('#isAnyColumnWithValueGroupingInUse should return false when column with value grouping is not in use', () => {
      context.valueGroupings = [valueGrouping('Percent')];

      expect(context.isAnyColumnWithValueGroupingInUse()).toBe(false);
   });

   it('#isAnyColumnWithValueGroupingInUse should return true when column with value grouping is in use', () => {
      context.dataColumns = [column('Percent')];
      context.valueGroupings = [valueGrouping('Percent')];

      expect(context.isAnyColumnWithValueGroupingInUse()).toBeTruthy();
   });

   it('#addValueGrouping should not fire structure change event when column is not in use', fakeAsync(() => {

      // when
      context.addValueGrouping(valueGrouping('Amount'));
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
      expect(context.hasValueGrouping('Amount')).toBe(true);
   }));

   it('#addValueGrouping should fire structure change event when column is in use', fakeAsync(() => {

      // given
      context.dataColumns = [column('Amount')];
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.addValueGrouping(valueGrouping('Amount'));
      flush();

      // then
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
      expect(context.hasValueGrouping('Amount')).toBe(true);
   }));

   it('#removeValueGrouping should not fire structure change when column is not in use', fakeAsync(() => {

      // given
      const amountValueGrouping = valueGrouping('Amount');
      context.valueGroupings = [amountValueGrouping];
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.removeValueGrouping(amountValueGrouping);
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
      expect(context.hasValueGrouping('Amount')).toBe(false);
   }));

   it('#removeValueGrouping should fire structure change when column is in use', fakeAsync(() => {

      // given
      context.dataColumns = [column('Amount')];
      const amountValueGrouping = valueGrouping('Amount');
      context.valueGroupings = [amountValueGrouping];
      flush();
      vi.mocked(eventHandlerSpy).mockClear();

      // when
      context.removeValueGrouping(amountValueGrouping);
      flush();

      // then
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(context.hasValueGrouping('Amount')).toBe(false);
   }));

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function viewElement(gridColumnSpan: number, gridRowSpan: number): ViewElement {
      return {
         elementType: ElementType.SUMMARY, title: 'T', gridColumnSpan, gridRowSpan, width: 300, height: 200, dataColumns: [],
         splitColumns: [], groupByColumns: [], aggregations: [Aggregation.COUNT], valueGroupings: [], colorOptions: undefined
      };
   }

   function valueGrouping(columnName: string): ValueGrouping {
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      return { columnName: columnName, ranges: ranges };
   }
});
