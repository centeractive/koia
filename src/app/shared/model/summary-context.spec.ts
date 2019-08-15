import { fakeAsync, flush } from '@angular/core/testing';
import { ChangeEvent } from './change-event.enum';
import { Column } from './column.type';
import { DataType } from './data-type.enum';
import { ChartType } from './chart-type';
import { ExportFormat } from './export-format.enum';
import { Aggregation } from './aggregation.enum';
import { SummaryContext } from './summary-context';

describe('SummaryContext', () => {

   let columns: Column[];
   let context: SummaryContext;
   let eventHandlerSpy: jasmine.Spy;

   beforeAll(() => {
      columns = [
         { name: 'Time', dataType: DataType.TIME, width: 1 },
         { name: 'Location', dataType: DataType.TEXT, width: 1 },
         { name: 'Name', dataType: DataType.TEXT, width: 1 },
         { name: 'Amount', dataType: DataType.NUMBER, width: 1 },
         { name: 'Percent', dataType: DataType.NUMBER, width: 1 }
      ];
   });

   beforeEach(() => {
      context = new SummaryContext(columns);
      eventHandlerSpy = jasmine.createSpy('eventHandler').and.callFake(e => null);
      context.subscribeToChanges(eventHandlerSpy);
   });

   it('#setUnlimitedWidth should not fire structure change event when width was unlimited', fakeAsync(() => {

      // when
      context.setUnlimitedWidth();
      flush();

      // then
      expect(context.hasUnlimitedWidth()).toBeTruthy();
      expect(eventHandlerSpy).not.toHaveBeenCalled();
   }));

   it('#setUnlimitedWidth should fire structure change event when width was no limited', fakeAsync(() => {

      // context
      context.setSize(1_000, 600);
      flush();
      eventHandlerSpy.calls.reset();

      // when
      context.setUnlimitedWidth();
      flush();

      // then
      expect(context.hasUnlimitedWidth()).toBeTruthy();
      expect(eventHandlerSpy).toHaveBeenCalledTimes(1);
      expect(eventHandlerSpy).toHaveBeenCalledWith(ChangeEvent.SIZE);
   }));

   it('#getTitle when no data column defined', () => {
      expect(context.getTitle()).toBe('Data: to be defined');
   });

   it('#getTitle when no aggregation', () => {

      // given
      context.dataColumns = [column('Location')];
      context.aggregations = [];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('"Location"');
   });

   it('#getTitle when aggregation count', () => {

      // given
      context.dataColumns = [column('Location')];
      context.aggregations = [Aggregation.COUNT];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Distinct values of "Location"');
   });

   it('#getTitle when aggregation other than count', () => {

      // given
      context.dataColumns = [column('Location')];
      context.aggregations = [Aggregation.MIN, Aggregation.MAX];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('"Location"');
   });

   it('#getTitle when user-defined', () => {

      // given
      context.title = 'test title';

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('test title');
   });

   it('#getSupportedExportFormats should return CSV, JSON and EXCEL', () => {
      expect(context.getSupportedExportFormats()).toEqual([ExportFormat.CSV, ExportFormat.JSON, ExportFormat.EXCEL]);
   });

   function column(name: string): Column {
      return columns.find(c => c.name === name);
   }
});
