import { ValueFormatter } from './value-formatter';
import { Column, DataType } from '../model';

describe('ValueFormatter', () => {

   const formatter = new ValueFormatter();

   it('#formatValue should return blank when value is missing', () => {
      const column: Column = { name: 'X', dataType: DataType.TEXT, width: 90 };

      expect(formatter.formatValue(column, null)).toBe('');
      expect(formatter.formatValue(column, undefined)).toBe('');
   });

   it('#formatValue should return same value if TEXT', () => {
      const column: Column = { name: 'X', dataType: DataType.TEXT, width: 90 };

      expect(formatter.formatValue(column, '')).toBe('');
      expect(formatter.formatValue(column, 'abc')).toBe('abc');
      expect(formatter.formatValue(column, '123')).toBe('123');
   });

   it('#formatValue should return formatted string if NUMBER', () => {
      const column: Column = { name: 'X', dataType: DataType.NUMBER, width: 90 };

      const ts = Number(1000).toLocaleString().charAt(1); // Thousands separator
      expect(formatter.formatValue(column, -1_000_000.5)).toBe('-1' + ts + '000' + ts + '000.5');
      expect(formatter.formatValue(column, -0.1)).toBe('-0.1');
      expect(formatter.formatValue(column, 0)).toBe('0');
      expect(formatter.formatValue(column, 0.1)).toBe('0.1');
      expect(formatter.formatValue(column, 1_000_000.5)).toBe('1' + ts + '000' + ts + '000.5');
   });

   it('#formatValue should return formatted string if TIME', () => {
      const column: Column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy' };

      expect(formatter.formatValue(column, 0)).toBe('1970');
   });

   it('#formatValue should return same invalid TIME', () => {
      const column: Column = { name: 'X', dataType: DataType.TIME, width: 10, format: 'yyyy' };

      expect(formatter.formatValue(column, '-')).toBe('-');
   });

   it('#formatValue should return string if BOOLEAN', () => {
      const column: Column = { name: 'X', dataType: DataType.BOOLEAN, width: 10 };

      expect(formatter.formatValue(column, true)).toBe('true');
      expect(formatter.formatValue(column, false)).toBe('false');
      expect(formatter.formatValue(column, 'true')).toBe('true');
      expect(formatter.formatValue(column, 'false')).toBe('false');
   });
});
