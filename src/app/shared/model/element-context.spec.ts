import { Column } from './column.type';
import { DataType } from './data-type.enum';
import { ElementContext } from './element-context';
import { ExportFormat } from './export-format.enum';
import { ValueGrouping } from './value-grouping.type';
import { ValueRange } from './value-range.type';
import { fakeAsync, flush } from '@angular/core/testing';
import { ChangeEvent } from './change-event.enum';

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
   let eventHandlerSpy: jasmine.Spy;

   beforeAll(() => {
      columns = [
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
   });

   beforeEach(() => {
      context = new TestContext(columns);
      eventHandlerSpy = jasmine.createSpy('eventHandler').and.callFake(e => null);
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#isAnyColumnWithValueGroupingInUse should return false when no value grouping exists', () => {
      expect(context.isAnyColumnWithValueGroupingInUse()).toBeFalsy();
   });

   it('#isAnyColumnWithValueGroupingInUse should return false when column with value grouping is not in use', () => {
      context.valueGroupings = [valueGrouping('Percent')];

      expect(context.isAnyColumnWithValueGroupingInUse()).toBeFalsy();
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
      expect(context.hasValueGrouping('Amount')).toBeTruthy();
   }));

   it('#addValueGrouping should fire structure change event when column is in use', fakeAsync(() => {

      // given
      context.dataColumns = [column('Amount')];
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.addValueGrouping(valueGrouping('Amount'));
      flush();

      // then
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.STRUCTURE);
      expect(context.hasValueGrouping('Amount')).toBeTruthy();
   }));

   it('#removeValueGrouping should not fire structure change when column is not in use', fakeAsync(() => {

      // given
      const amountValueGrouping = valueGrouping('Amount');
      context.valueGroupings = [amountValueGrouping];
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.removeValueGrouping(amountValueGrouping);
      flush();

      // then
      expect(eventHandlerSpy).not.toHaveBeenCalled();
      expect(context.hasValueGrouping('Amount')).toBeFalsy();
   }));

   it('#removeValueGrouping should fire structure change when column is in use', fakeAsync(() => {

      // given
      context.dataColumns = [column('Amount')];
      const amountValueGrouping = valueGrouping('Amount');
      context.valueGroupings = [amountValueGrouping];
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.removeValueGrouping(amountValueGrouping);
      flush();

      // then
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(context.hasValueGrouping('Amount')).toBeFalsy();
   }));

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }

   function valueGrouping(columnName: string): ValueGrouping {
      const ranges: ValueRange[] = [{ max: 10, active: true }, { max: 20, active: true }, { max: 30, active: true }]
      return { columnName: columnName, ranges: ranges };
   }
});
