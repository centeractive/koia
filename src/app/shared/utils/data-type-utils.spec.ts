import { DataType, Column } from '../model';
import { DataTypeUtils } from './data-type-utils';

describe('DataTypeUtils', () => {

   it('#typeOf should return undefined when value is not present', () => {
      expect(DataTypeUtils.typeOf(null, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.typeOf(undefined, 'en-US')).toBeUndefined();
   });

   it('#typeOf should return BOOLEAN when value is boolean', () => {
      expect(DataTypeUtils.typeOf(true, 'en-US')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf(false, 'en-US')).toEqual(DataType.BOOLEAN);
   });

   it('#typeOf should return BOOLEAN when value contains boolean', () => {
      expect(DataTypeUtils.typeOf('true', 'en-US')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf('false', 'en-US')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf('TRUE', 'en-US')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf('FALSE', 'en-US')).toEqual(DataType.BOOLEAN);
   });

   it('#typeOf should return TIME when value is a date', () => {
      expect(DataTypeUtils.typeOf(new Date(), 'en-US')).toEqual(DataType.TIME);
   });

   it('#typeOf should return NUMBER when value is number', () => {
      expect(DataTypeUtils.typeOf(-1.1, 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(-1, 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(0, 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(1, 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(1.1, 'en-US')).toEqual(DataType.NUMBER);
   });

   it('#typeOf should return NUMBER when value contains number', () => {
      expect(DataTypeUtils.typeOf('-1.1', 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('-1', 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('0', 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('1', 'en-US')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('1.1', 'en-US')).toEqual(DataType.NUMBER);
   });

   it('#typeOf should return OBJECT when value is object', () => {
      expect(DataTypeUtils.typeOf({ name: 'abc' }, 'en-US')).toEqual(DataType.OBJECT);
      expect(DataTypeUtils.typeOf([{ name: 'abc' }, { name: 'xyz' }], 'en-US')).toEqual(DataType.OBJECT);
   });

   it('#typeOf should return TEXT when value is text', () => {
      expect(DataTypeUtils.typeOf('this is text', 'en-US')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('x1', 'en-US')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('2-1', 'en-US')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('.', 'en-US')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf(',', 'en-US')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('%', 'en-US')).toEqual(DataType.TEXT);
   });

   it('#isNumeric should return true when column is numeric', () => {
      expect(DataTypeUtils.isNumeric(DataType.NUMBER)).toBeTruthy();
      expect(DataTypeUtils.isNumeric(DataType.TIME)).toBeTruthy();
   });

   it('#isNumeric should return false when column is not numeric', () => {
      expect(DataTypeUtils.isNumeric(DataType.TEXT)).toBeFalsy();
      expect(DataTypeUtils.isNumeric(DataType.BOOLEAN)).toBeFalsy();
   });

   it('#toTypedValue should return undefined when value is missing', () => {
      expect(DataTypeUtils.toTypedValue(undefined, DataType.BOOLEAN, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(null, DataType.BOOLEAN, 'en-US')).toBeUndefined();
   });

   it('#toTypedValue should return undefined when value is not boolean compatible', () => {
      expect(DataTypeUtils.toTypedValue('abc', DataType.BOOLEAN, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue('-1', DataType.BOOLEAN, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(-1, DataType.BOOLEAN, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(123, DataType.BOOLEAN, 'en-US')).toBeUndefined();
   });

   it('#toTypedValue should return boolean when value is boolean', () => {
      expect(DataTypeUtils.toTypedValue(true, DataType.BOOLEAN, 'en-US')).toBe(true);
      expect(DataTypeUtils.toTypedValue(false, DataType.BOOLEAN, 'en-US')).toBe(false);
   });

   it('#toTypedValue should return boolean when value includes boolean', () => {
      expect(DataTypeUtils.toTypedValue('true', DataType.BOOLEAN, 'en-US')).toBe(true);
      expect(DataTypeUtils.toTypedValue('false', DataType.BOOLEAN, 'en-US')).toBe(false);
      expect(DataTypeUtils.toTypedValue('TRUE', DataType.BOOLEAN, 'en-US')).toBe(true);
      expect(DataTypeUtils.toTypedValue('FALSE', DataType.BOOLEAN, 'en-US')).toBe(false);
   });

   it('#toTypedValue should return boolean when value represents boolean', () => {
      expect(DataTypeUtils.toTypedValue(1, DataType.BOOLEAN, 'en-US')).toBe(true);
      expect(DataTypeUtils.toTypedValue(0, DataType.BOOLEAN, 'en-US')).toBe(false);
      expect(DataTypeUtils.toTypedValue('1', DataType.BOOLEAN, 'en-US')).toBe(true);
      expect(DataTypeUtils.toTypedValue('0', DataType.BOOLEAN, 'en-US')).toBe(false);
      expect(DataTypeUtils.toTypedValue('+', DataType.BOOLEAN, 'en-US')).toBe(true);
      expect(DataTypeUtils.toTypedValue('-', DataType.BOOLEAN, 'en-US')).toBe(false);
   });

   it('#toTypedValue should return number when value is number', () => {
      expect(DataTypeUtils.toTypedValue(-1.1, DataType.NUMBER, 'en-US')).toBe(-1.1);
      expect(DataTypeUtils.toTypedValue(-1, DataType.NUMBER, 'en-US')).toBe(-1);
      expect(DataTypeUtils.toTypedValue(0, DataType.NUMBER, 'en-US')).toBe(0);
      expect(DataTypeUtils.toTypedValue(1, DataType.NUMBER, 'en-US')).toBe(1);
      expect(DataTypeUtils.toTypedValue(1.1, DataType.NUMBER, 'en-US')).toBe(1.1);
   });

   it('#toTypedValue should return number when value includes number', () => {
      expect(DataTypeUtils.toTypedValue('-1.1', DataType.NUMBER, 'en-US')).toBe(-1.1);
      expect(DataTypeUtils.toTypedValue('-1', DataType.NUMBER, 'en-US')).toBe(-1);
      expect(DataTypeUtils.toTypedValue('0', DataType.NUMBER, 'en-US')).toBe(0);
      expect(DataTypeUtils.toTypedValue('1', DataType.NUMBER, 'en-US')).toBe(1);
      expect(DataTypeUtils.toTypedValue('1.1', DataType.NUMBER, 'en-US')).toBe(1.1);
   });

   it('#toTypedValue should return time when value is time', () => {
      expect(DataTypeUtils.toTypedValue(-1, DataType.TIME, 'en-US')).toBe(-1);
      expect(DataTypeUtils.toTypedValue(0, DataType.TIME, 'en-US')).toBe(0);
      expect(DataTypeUtils.toTypedValue(1, DataType.TIME, 'en-US')).toBe(1);
   });

   it('#toTypedValue should return time when value includes time', () => {
      expect(DataTypeUtils.toTypedValue('-1', DataType.TIME, 'en-US')).toBe(-1);
      expect(DataTypeUtils.toTypedValue('0', DataType.TIME, 'en-US')).toBe(0);
      expect(DataTypeUtils.toTypedValue('1', DataType.TIME, 'en-US')).toBe(1);
   });

   it('#toTypedValue should return number when value includes number with thousands separator', () => {
      expect(DataTypeUtils.toTypedValue('-1,000', DataType.NUMBER, 'en-US')).toBe(-1000);
      expect(DataTypeUtils.toTypedValue('1,000', DataType.NUMBER, 'en-US')).toBe(1000);
   });

   it('#toTypedValue should return text when data type is text', () => {
      expect(DataTypeUtils.toTypedValue(true, DataType.TEXT, 'en-US')).toBe('true');
      expect(DataTypeUtils.toTypedValue(false, DataType.TEXT, 'en-US')).toBe('false');
      expect(DataTypeUtils.toTypedValue(-1, DataType.TEXT, 'en-US')).toBe('-1');
      expect(DataTypeUtils.toTypedValue(0, DataType.TEXT, 'en-US')).toBe('0');
      expect(DataTypeUtils.toTypedValue(1, DataType.TEXT, 'en-US')).toBe('1');
      expect(DataTypeUtils.toTypedValue('abc', DataType.TEXT, 'en-US')).toBe('abc');
   });

   it('#toTypedValue should return undefined when value is not a number', () => {
      expect(DataTypeUtils.toTypedValue('X', DataType.NUMBER, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue('1-', DataType.NUMBER, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(false, DataType.NUMBER, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(true, DataType.NUMBER, 'en-US')).toBeUndefined();
   });

   it('#toTypedValue should return undefined when value is not time compatible', () => {
      expect(DataTypeUtils.toTypedValue('X', DataType.NUMBER, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue('1-', DataType.NUMBER, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(false, DataType.NUMBER, 'en-US')).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(true, DataType.NUMBER, 'en-US')).toBeUndefined();
   });

   it('#toTypedValue should return string when value is an object', () => {
      const object = { a: 'x', b: 1, c: [1, 2, 3] };
      const expected = JSON.stringify(object, undefined, '  ');

      expect(DataTypeUtils.toTypedValue(object, DataType.OBJECT, 'en-US')).toEqual(expected);
   });

   it('#toTypedValue should return string when value is an array', () => {
      const array = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }];
      const expected = JSON.stringify(array, undefined, '  ');

      expect(DataTypeUtils.toTypedValue(array, DataType.OBJECT, 'en-US')).toEqual(expected);
   });

   it('#asBoolean should return false when value is missing', () => {
      expect(DataTypeUtils.asBoolean(null)).toBe(false);
      expect(DataTypeUtils.asBoolean(undefined)).toBe(false);
   });

   it('#asBoolean should return undefined when value is not boolean compatible', () => {
      expect(DataTypeUtils.asBoolean('abc')).toBeUndefined();
      expect(DataTypeUtils.asBoolean('-1')).toBeUndefined();
      expect(DataTypeUtils.asBoolean(-1)).toBeUndefined();
      expect(DataTypeUtils.asBoolean(123)).toBeUndefined();
   });

   it('#asBoolean should return boolean when value is boolean', () => {
      expect(DataTypeUtils.asBoolean(true)).toBe(true);
      expect(DataTypeUtils.asBoolean(false)).toBe(false);
   });

   it('#asBoolean should return true when value represents true', () => {
      expect(DataTypeUtils.asBoolean('true')).toBe(true);
      expect(DataTypeUtils.asBoolean('TRUE')).toBe(true);
      expect(DataTypeUtils.asBoolean('yes')).toBe(true);
      expect(DataTypeUtils.asBoolean('YES')).toBe(true);
      expect(DataTypeUtils.asBoolean('ok')).toBe(true);
      expect(DataTypeUtils.asBoolean('OK')).toBe(true);
      expect(DataTypeUtils.asBoolean('y')).toBe(true);
      expect(DataTypeUtils.asBoolean('Y')).toBe(true);
      expect(DataTypeUtils.asBoolean(1)).toBe(true);
      expect(DataTypeUtils.asBoolean('1')).toBe(true);
      expect(DataTypeUtils.asBoolean('+')).toBe(true);
   });

   it('#asBoolean should return false when value represents false', () => {
      expect(DataTypeUtils.asBoolean('false')).toBe(false);
      expect(DataTypeUtils.asBoolean('FALSE')).toBe(false);
      expect(DataTypeUtils.asBoolean('no')).toBe(false);
      expect(DataTypeUtils.asBoolean('NO')).toBe(false);
      expect(DataTypeUtils.asBoolean('nok')).toBe(false);
      expect(DataTypeUtils.asBoolean('NOK')).toBe(false);
      expect(DataTypeUtils.asBoolean('n')).toBe(false);
      expect(DataTypeUtils.asBoolean('N')).toBe(false);
      expect(DataTypeUtils.asBoolean(0)).toBe(false);
      expect(DataTypeUtils.asBoolean('0')).toBe(false);
      expect(DataTypeUtils.asBoolean('-')).toBe(false);
   });

   it('#toBoolean should return false when value is missing', () => {
      expect(DataTypeUtils.toBoolean(null)).toBe(false);
      expect(DataTypeUtils.toBoolean(undefined)).toBe(false);
   });

   it('#toBoolean should return undefined when value is not boolean compatible', () => {
      expect(DataTypeUtils.asBoolean('abc')).toBeUndefined();
      expect(DataTypeUtils.asBoolean('-1')).toBeUndefined();
   });

   it('#toBoolean should return true when value represents true', () => {
      expect(DataTypeUtils.toBoolean('true')).toBe(true);
      expect(DataTypeUtils.toBoolean('TRUE')).toBe(true);
      expect(DataTypeUtils.toBoolean('yes')).toBe(true);
      expect(DataTypeUtils.toBoolean('YES')).toBe(true);
      expect(DataTypeUtils.toBoolean('y')).toBe(true);
      expect(DataTypeUtils.toBoolean('Y')).toBe(true);
      expect(DataTypeUtils.toBoolean('1')).toBe(true);
      expect(DataTypeUtils.toBoolean('+')).toBe(true);
   });

   it('#toBoolean should return false when value represents false', () => {
      expect(DataTypeUtils.toBoolean('false')).toBe(false);
      expect(DataTypeUtils.toBoolean('FALSE')).toBe(false);
      expect(DataTypeUtils.toBoolean('no')).toBe(false);
      expect(DataTypeUtils.toBoolean('NO')).toBe(false);
      expect(DataTypeUtils.toBoolean('n')).toBe(false);
      expect(DataTypeUtils.toBoolean('N')).toBe(false);
      expect(DataTypeUtils.toBoolean('0')).toBe(false);
      expect(DataTypeUtils.toBoolean('-')).toBe(false);
   });

   it('#iconOf should return undefined when data types is unknown', () => {
      expect(DataTypeUtils.iconOf({} as DataType)).toBeUndefined();
   });

   it('#iconOf should return icon name for all data types', () => {
      const dataTypes: DataType[] = Object.keys(DataType).map(key => DataType[key]);

      dataTypes.forEach(dataType => {
         expect(DataTypeUtils.iconOf(dataType)).toBeDefined();
      });
   });

   it('#containsNonNumericColumns should return false when no columns are provided', () => {
      expect(DataTypeUtils.containsNonNumericColumns(null)).toBeFalsy();
      expect(DataTypeUtils.containsNonNumericColumns(undefined)).toBeFalsy();
      expect(DataTypeUtils.containsNonNumericColumns([])).toBeFalsy();
   });

   it('#containsNonNumericColumns should return true when single TEXT column is provided', () => {
      const column: Column = { name: 'x', dataType: DataType.TEXT, width: 10 };

      expect(DataTypeUtils.containsNonNumericColumns([column])).toBeTruthy();
   });

   it('#containsNonNumericColumns should return true when non-numeric column is contained', () => {
      const columns: Column[] = [
         { name: 'x', dataType: DataType.TEXT, width: 10 },
         { name: 'x', dataType: DataType.NUMBER, width: 10 }
      ];

      expect(DataTypeUtils.containsNonNumericColumns(columns)).toBeTruthy();
   });

   it('#containsNonNumericColumns should return false when single NUMBER column is provided', () => {
      const column: Column = { name: 'x', dataType: DataType.NUMBER, width: 10 };

      expect(DataTypeUtils.containsNonNumericColumns([column])).toBeFalsy();
   });

   it('#containsNonNumericColumns should return false when single TIME column is provided', () => {
      const column: Column = { name: 'x', dataType: DataType.TIME, width: 10 };

      expect(DataTypeUtils.containsNonNumericColumns([column])).toBeFalsy();
   });

   it('#containsNonNumericColumns should return false when numeric column only are contained', () => {
      const columns: Column[] = [
         { name: 'x', dataType: DataType.TIME, width: 10 },
         { name: 'x', dataType: DataType.NUMBER, width: 10 }
      ];

      expect(DataTypeUtils.containsNonNumericColumns(columns)).toBeFalsy();
   });
});
