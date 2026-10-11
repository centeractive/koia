import { DatePipe } from '@angular/common';
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

   it('#formatValue should return formatted string using current locale if NUMBER', () => {
      const column: Column = { name: 'X', dataType: DataType.NUMBER, width: 90 };

      expect(formatter.formatValue(column, -1_000_000.5)).toBe((-1_000_000.5).toLocaleString());
      expect(formatter.formatValue(column, -95.5132)).toBe((-95.5132).toLocaleString(undefined, { minimumFractionDigits: 4 }));
      expect(formatter.formatValue(column, -0.1)).toBe((-0.1).toLocaleString());
      expect(formatter.formatValue(column, 0)).toBe('0');
      expect(formatter.formatValue(column, 0.1)).toBe((0.1).toLocaleString());
      expect(formatter.formatValue(column, 95.5132)).toBe((95.5132).toLocaleString(undefined, { minimumFractionDigits: 4 }));
      expect(formatter.formatValue(column, 1_000_000.5)).toBe((1_000_000.5).toLocaleString());
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

   it('#formatValue should use default datetime format when column has no format', () => {

      // given
      const column: Column = { name: 'X', dataType: DataType.TIME, width: 10 };

      // when
      const formatted = formatter.formatValue(column, 0);

      // then
      expect(formatted).toBe(new DatePipe('en-US').transform(0, ValueFormatter.DEFAULT_DATETIME_FORMAT));
   });

   it('#formatCell should return empty string when object value is null', () => {

      // given
      const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
      const entry = { ID: 1, Nested: null };

      // when
      const formatted = formatter.formatCell(column, entry, false);

      // then
      expect(formatted).toBe('');
   });

   it('#formatCell should return ellipsis when object value is defined', () => {

      // given
      const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
      const entry = { ID: 1, Nested: '{ a: \'x\' }' };

      // when
      const formatted = formatter.formatCell(column, entry, false);

      // then
      expect(formatted).toBe('...');
   });

   it('#formatCell should return object value when nested objects shown', () => {

      // given
      const column: Column = { name: 'Nested', dataType: DataType.OBJECT, width: 100 };
      const entry = { ID: 1, Nested: '{ a: \'x\' }' };

      // when
      const formatted = formatter.formatCell(column, entry, true);

      // then
      expect(formatted).toBe('{ a: \'x\' }');
   });

   it('#formatCell should return empty string when number value is null', () => {

      // given
      const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
      const entry = { ID: 1, Amount: null };

      // when
      const formatted = formatter.formatCell(column, entry, false);

      // then
      expect(formatted).toBe('');
   });

   it('#formatCell should return formatted time using column format', () => {

      // given
      const column: Column = { name: 'Time', dataType: DataType.TIME, width: 100, format: 'yyyy-MM-dd HH:mm:ss SSS' };
      const time = new Date('2019-01-30T18:24:17').getTime() + 557;
      const entry = { ID: 1, Time: time };

      // when
      const formatted = formatter.formatCell(column, entry, false);

      // then
      expect(formatted).toBe('2019-01-30 18:24:17 557');
   });

   it('#formatCell should return formatted number using current locale', () => {

      // given
      const column: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 100 };
      const entry = { ID: 1, Amount: 15_000 };

      // when
      const formatted = formatter.formatCell(column, entry, false);

      // then
      expect(formatted).toBe((15_000).toLocaleString());
   });

   it('#formatCell should return value when value is text', () => {

      // given
      const column: Column = { name: 'Host', dataType: DataType.TEXT, width: 100 };
      const entry = { ID: 1, Host: 'server1' };

      // when
      const formatted = formatter.formatCell(column, entry, false);

      // then
      expect(formatted).toBe('server1');
   });
});
