import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { DataFrame } from 'data-forge';
import { Aggregation, Column, DataType, SummaryContext, TimeUnit } from 'app/shared/model';
import { LanguageService } from 'app/shared/services/language';
import { ExportDataGenerator } from './export-data-generator';

describe('ExportDataGenerator', () => {

   const datePipe = new DatePipe('en-US');
   const format = 'd MMM yyyy HH:mm';
   const t0 = new Date(2020, 1, 3, 10, 25).getTime();
   const t1 = new Date(2020, 1, 3, 10, 26).getTime();
   const timeCol: Column = { name: 'Time', dataType: DataType.TIME, width: 10, groupingTimeUnit: TimeUnit.MINUTE };
   const generator = new ExportDataGenerator();
   let context: SummaryContext;

   beforeEach(() => {
      context = new SummaryContext([timeCol]);
      context.groupByColumns = [timeCol];
   });

   it('#generate should format time column values and append overall row', () => {

      // given
      const dataFrame = new DataFrame([
         { 'Time (per minute)': t0, Count: 2 },
         { 'Time (per minute)': t1, Count: 1 }
      ]);

      // when
      const data = generator.generate(context, dataFrame, [3]);

      // then
      expect(data).toEqual([
         { 'Time (per minute)': datePipe.transform(t0, format), Count: 2 },
         { 'Time (per minute)': datePipe.transform(t1, format), Count: 1 },
         { 'Time (per minute)': 'Overall', Count: 3 }
      ]);
   });

   it('#generate should label overall row in current language', async () => {

      // given
      vi.spyOn(Storage.prototype, 'setItem').mockReturnValue(undefined);
      await TestBed.inject(LanguageService).use('de');
      const dataFrame = new DataFrame([{ 'Time (per minute)': t0, Count: 2 }]);

      // when
      const data = generator.generate(context, dataFrame, [2]);

      // then
      expect(data[1]).toEqual({ 'Time (per minute)': 'Gesamt', Count: 2 });
      document.documentElement.lang = 'en';
   });

   it('#generate should format time column values when time is missing in first row', () => {

      // given
      const dataFrame = new DataFrame<number, object>([
         { Count: 1 },
         { 'Time (per minute)': t0, Count: 2 }
      ]);

      // when
      const data = generator.generate(context, dataFrame, [3]);

      // then
      expect(data).toEqual([
         { Count: 1, 'Time (per minute)': '' },
         { 'Time (per minute)': datePipe.transform(t0, format), Count: 2 },
         { 'Time (per minute)': 'Overall', Count: 3 }
      ]);
   });

   it('#generate should export aggregation under suffixed name when data column has its name', () => {

      // given
      context.dataColumns = [{ name: 'Count', dataType: DataType.NUMBER, width: 10 }];
      const dataFrame = new DataFrame([{ 'Time (per minute)': t0, Count: 5, 'Count (2)': 2 }]);

      // when
      const data = generator.generate(context, dataFrame, [2]);

      // then
      expect(data).toEqual([
         { 'Time (per minute)': datePipe.transform(t0, format), Count: 5, 'Count (2)': 2 },
         { 'Time (per minute)': '', Count: 'Overall', 'Count (2)': 2 }
      ]);
   });

   it('#generate should format time column under suffixed name when group-by column has its label', () => {

      // given
      context.groupByColumns = [timeCol, { name: 'Time (per minute)', dataType: DataType.TEXT, width: 10 }];
      const dataFrame = new DataFrame([{ 'Time (per minute) (2)': t0, 'Time (per minute)': 'x', Count: 2 }]);

      // when
      const data = generator.generate(context, dataFrame, [2]);

      // then
      expect(data).toEqual([
         { 'Time (per minute) (2)': datePipe.transform(t0, format), 'Time (per minute)': 'x', Count: 2 },
         { 'Time (per minute) (2)': '', 'Time (per minute)': 'Overall', Count: 2 }
      ]);
   });

   it('#columnsOf should return columns keyed by their name except time columns', () => {

      // given
      const level: Column = { name: 'Level', dataType: DataType.TEXT, width: 10 };
      const stamp: Column = { name: 'Stamp', dataType: DataType.TIME, width: 10 };
      const amount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
      const count: Column = { name: 'Count', dataType: DataType.TIME, width: 10 };
      const sum: Column = { name: 'Sum', dataType: DataType.OBJECT, width: 10 };
      context.groupByColumns = [timeCol, level, stamp];
      context.dataColumns = [amount];

      // when
      const columns = generator.columnsOf(context, [timeCol, level, stamp, amount, count, sum]);

      // then
      expect(columns).toEqual([level, amount]);
   });

   it('#columnsOf should exclude data column when aggregating values', () => {

      // given
      const level: Column = { name: 'Level', dataType: DataType.TEXT, width: 10 };
      const stamp: Column = { name: 'Stamp', dataType: DataType.TIME, width: 10 };
      const amount: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
      const count: Column = { name: 'Count', dataType: DataType.TIME, width: 10 };
      const sum: Column = { name: 'Sum', dataType: DataType.OBJECT, width: 10 };
      context.groupByColumns = [timeCol, level, stamp];
      context.dataColumns = [amount];
      context.aggregations = [Aggregation.SUM];

      // when
      const columns = generator.columnsOf(context, [timeCol, level, stamp, amount, count, sum]);

      // then
      expect(columns).toEqual([level]);
   });
});
