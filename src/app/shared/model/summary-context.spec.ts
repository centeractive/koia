import { StringUtils } from '../utils/string-utils';
import { Aggregation } from './aggregation.enum';
import { Column } from './column.type';
import { DataType } from './data-type.enum';
import { ExportFormat } from './export-format.enum';
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
      expect(title).toBe(StringUtils.quote('Location'));
   });

   it('#getTitle when aggregation count', () => {

      // given
      context.dataColumns = [column('Location')];
      context.aggregations = [Aggregation.COUNT];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe('Distinct values of ' + StringUtils.quote('Location'));
   });

   it('#getTitle when aggregation other than count', () => {

      // given
      context.dataColumns = [column('Location')];
      context.aggregations = [Aggregation.MIN, Aggregation.MAX];

      // when
      const title = context.getTitle();

      // then
      expect(title).toBe(StringUtils.quote('Location'));
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
