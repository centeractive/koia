import { ColumnNameConverter } from './column-name-converter';
import { Column, DataType, TimeUnit } from '../model';

describe('ColumnNameConverter', () => {

   it('#toLabel should return column name when text column', () => {
      const column: Column = { name: 'A', dataType: DataType.TEXT, width: 100 };
      const label = ColumnNameConverter.toLabel(column, undefined);

      expect(label).toBe('A');
   });

   it('#toLabel should return column name when number column', () => {
      const column: Column = { name: 'A', dataType: DataType.NUMBER, width: 100 };
      const label = ColumnNameConverter.toLabel(column, undefined);

      expect(label).toBe('A');
   });

   it('#toLabel should return column name when boolean column', () => {
      const column: Column = { name: 'A', dataType: DataType.BOOLEAN, width: 100 };
      const label = ColumnNameConverter.toLabel(column, undefined);

      expect(label).toBe('A');
   });

   it('#toLabel should return column name when time column but time unit null', () => {
      const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
      const label = ColumnNameConverter.toLabel(column, null);

      expect(label).toBe('A');
   });

   it('#toLabel should return column name when time column but time unit undefined', () => {
      const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
      const label = ColumnNameConverter.toLabel(column, undefined);

      expect(label).toBe('A');
   });

   it('#toLabel should return column name when time column and time unit is millisecond', () => {
      const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
      const label = ColumnNameConverter.toLabel(column, TimeUnit.MILLISECOND);

      expect(label).toBe('A');
   });

   it('#toLabel should return "<column name> (per <time unit>)" when time column and time unit are present', () => {
      const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
      const label = ColumnNameConverter.toLabel(column, TimeUnit.DAY);

      expect(label).toBe('A (per day)');
   });

   it('#toColumnName should return column name when not of relevant time unit', () => {
      expect(ColumnNameConverter.toColumnName('X')).toBe('X');
   });

   it('#toColumnName should return column name when of relevant time unit', () => {
      for (const timeUnit of ColumnNameConverter.RELEVANT_TIME_UNITS) {
         const column: Column = { name: 'X', dataType: DataType.TIME, width: 100 };
         const label = ColumnNameConverter.toLabel(column, timeUnit);

         expect(ColumnNameConverter.toColumnName(label)).toBe('X');
      }
   });
});
