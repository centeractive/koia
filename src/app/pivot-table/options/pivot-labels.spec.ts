import { Column, DataType, TimeUnit } from 'app/shared/model';
import { columnOfLabel, timeLabelOf } from './pivot-labels';

describe('pivot-labels', () => {

   const time: Column = { name: 'Time', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.DAY };

   it('#timeLabelOf should return time label when no column has its name', () => {

      // when
      const label = timeLabelOf(time, TimeUnit.DAY, [time]);

      // then
      expect(label).toBe('Time (per day)');
   });

   it('#timeLabelOf should suffix label until it differs from all column names', () => {

      // given
      const columns: Column[] = [
         time,
         { name: 'Time (per day)', dataType: DataType.TEXT, width: 10 },
         { name: 'Time (per day) #', dataType: DataType.TEXT, width: 10 }
      ];

      // when
      const label = timeLabelOf(time, TimeUnit.DAY, columns);

      // then
      expect(label).toBe('Time (per day) # #');
   });

   it('#timeLabelOf should return column name for millisecond', () => {

      // when
      const label = timeLabelOf(time, TimeUnit.MILLISECOND, [time]);

      // then
      expect(label).toBe('Time');
   });

   it('#columnOfLabel should resolve label to column of same name although it looks like a time label', () => {

      // given
      const duration: Column = { name: 'Duration', dataType: DataType.TIME, width: 100, groupingTimeUnit: TimeUnit.DAY };
      const text: Column = { name: 'Duration (per day)', dataType: DataType.TEXT, width: 10 };

      // when
      const column = columnOfLabel('Duration (per day)', [duration, text]);

      // then
      expect(column).toBe(text);
   });

   it('#columnOfLabel should resolve suffixed time label to time column', () => {

      // given
      const text: Column = { name: 'Time (per day)', dataType: DataType.TEXT, width: 10 };
      const columns = [time, text];

      // when
      const timeLabelColumn = columnOfLabel('Time (per day) #', columns);
      const textLabelColumn = columnOfLabel('Time (per day)', columns);

      // then
      expect(timeLabelColumn).toBe(time);
      expect(textLabelColumn).toBe(text);
   });

   it('#columnOfLabel should return undefined for unknown label', () => {

      // when
      const column = columnOfLabel('Time (per hour)', [time]);

      // then
      expect(column).toBeUndefined();
   });
});
