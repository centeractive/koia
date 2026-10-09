import { DatePipe } from '@angular/common';
import { DataFrame } from 'data-forge';
import { Column, DataType, SummaryContext, TimeUnit } from 'app/shared/model';
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
         { Count: 3 }
      ]);
   });
});
