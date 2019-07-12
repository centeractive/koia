import { DataType, Column } from '../model';
import { DataTypeUtils } from './data-type-utils';
import { NumberUtils } from './number-utils';

describe('DataTypeUtils', () => {

   const t = NumberUtils.THOUSANDS_SEPARATOR;
   const d = NumberUtils.DECIMAL_SEPARATOR;

   it('#typeOf should return undefined when value is not present', () => {
      expect(DataTypeUtils.typeOf(null)).toBeUndefined();
      expect(DataTypeUtils.typeOf(undefined)).toBeUndefined();
   });

   it('#typeOf should return BOOLEAN when value is boolean', () => {
      expect(DataTypeUtils.typeOf(true)).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf(false)).toEqual(DataType.BOOLEAN);
   });

   it('#typeOf should return BOOLEAN when value contains boolean', () => {
      expect(DataTypeUtils.typeOf('true')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf('false')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf('TRUE')).toEqual(DataType.BOOLEAN);
      expect(DataTypeUtils.typeOf('FALSE')).toEqual(DataType.BOOLEAN);
   });

   it('#typeOf should return NUMBER when value is number', () => {
      expect(DataTypeUtils.typeOf(-1.1)).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(-1)).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(0)).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(1)).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf(1.1)).toEqual(DataType.NUMBER);
   });

   it('#typeOf should return NUMBER when value contains number', () => {
      expect(DataTypeUtils.typeOf('-1.1')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('-1')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('0')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('1')).toEqual(DataType.NUMBER);
      expect(DataTypeUtils.typeOf('1.1')).toEqual(DataType.NUMBER);
   });

   it('#typeOf should return TEXT when value is text', () => {
      expect(DataTypeUtils.typeOf('this is text')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('x1')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('2-1')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('.')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf(',')).toEqual(DataType.TEXT);
      expect(DataTypeUtils.typeOf('%')).toEqual(DataType.TEXT);
   });

   it('#toTypedValue should return undefined when value is missing', () => {
      expect(DataTypeUtils.toTypedValue(undefined, DataType.BOOLEAN)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(null, DataType.BOOLEAN)).toBeUndefined();
   });

   it('#toTypedValue should return undefined when value is not boolean compatible', () => {
      expect(DataTypeUtils.toTypedValue('abc', DataType.BOOLEAN)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue('-1', DataType.BOOLEAN)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(-1, DataType.BOOLEAN)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(123, DataType.BOOLEAN)).toBeUndefined();
   });

   it('#toTypedValue should return boolean when value is boolean', () => {
      expect(DataTypeUtils.toTypedValue(true, DataType.BOOLEAN)).toBe(true);
      expect(DataTypeUtils.toTypedValue(false, DataType.BOOLEAN)).toBe(false);
   });

   it('#toTypedValue should return boolean when value includes boolean', () => {
      expect(DataTypeUtils.toTypedValue('true', DataType.BOOLEAN)).toBe(true);
      expect(DataTypeUtils.toTypedValue('false', DataType.BOOLEAN)).toBe(false);
      expect(DataTypeUtils.toTypedValue('TRUE', DataType.BOOLEAN)).toBe(true);
      expect(DataTypeUtils.toTypedValue('FALSE', DataType.BOOLEAN)).toBe(false);
   });

   it('#toTypedValue should return boolean when value represents boolean', () => {
      expect(DataTypeUtils.toTypedValue(1, DataType.BOOLEAN)).toBe(true);
      expect(DataTypeUtils.toTypedValue(0, DataType.BOOLEAN)).toBe(false);
      expect(DataTypeUtils.toTypedValue('1', DataType.BOOLEAN)).toBe(true);
      expect(DataTypeUtils.toTypedValue('0', DataType.BOOLEAN)).toBe(false);
      expect(DataTypeUtils.toTypedValue('+', DataType.BOOLEAN)).toBe(true);
      expect(DataTypeUtils.toTypedValue('-', DataType.BOOLEAN)).toBe(false);
   });

   it('#toTypedValue should return number when value is number', () => {
      expect(DataTypeUtils.toTypedValue(-1.1, DataType.NUMBER)).toBe(-1.1);
      expect(DataTypeUtils.toTypedValue(-1, DataType.NUMBER)).toBe(-1);
      expect(DataTypeUtils.toTypedValue(0, DataType.NUMBER)).toBe(0);
      expect(DataTypeUtils.toTypedValue(1, DataType.NUMBER)).toBe(1);
      expect(DataTypeUtils.toTypedValue(1.1, DataType.NUMBER)).toBe(1.1);
   });

   it('#toTypedValue should return number when value includes number', () => {
      expect(DataTypeUtils.toTypedValue('-1' + d + '1', DataType.NUMBER)).toBe(-1.1);
      expect(DataTypeUtils.toTypedValue('-1', DataType.NUMBER)).toBe(-1);
      expect(DataTypeUtils.toTypedValue('0', DataType.NUMBER)).toBe(0);
      expect(DataTypeUtils.toTypedValue('1', DataType.NUMBER)).toBe(1);
      expect(DataTypeUtils.toTypedValue('1' + d + '1', DataType.NUMBER)).toBe(1.1);
   });

   it('#toTypedValue should return time when value is time', () => {
      expect(DataTypeUtils.toTypedValue(-1, DataType.TIME)).toBe(-1);
      expect(DataTypeUtils.toTypedValue(0, DataType.TIME)).toBe(0);
      expect(DataTypeUtils.toTypedValue(1, DataType.TIME)).toBe(1);
   });

   it('#toTypedValue should return time when value includes time', () => {
      expect(DataTypeUtils.toTypedValue('-1', DataType.TIME)).toBe(-1);
      expect(DataTypeUtils.toTypedValue('0', DataType.TIME)).toBe(0);
      expect(DataTypeUtils.toTypedValue('1', DataType.TIME)).toBe(1);
   });

   it('#toTypedValue should return number when value includes number with thousands separator', () => {
      expect(DataTypeUtils.toTypedValue('-1' + t + '000', DataType.NUMBER)).toBe(-1000);
      expect(DataTypeUtils.toTypedValue('1' + t + '000', DataType.NUMBER)).toBe(1000);
   });

   it('#toTypedValue should return text when data type is text', () => {
      expect(DataTypeUtils.toTypedValue(true, DataType.TEXT)).toBe('true');
      expect(DataTypeUtils.toTypedValue(false, DataType.TEXT)).toBe('false');
      expect(DataTypeUtils.toTypedValue(-1, DataType.TEXT)).toBe('-1');
      expect(DataTypeUtils.toTypedValue(0, DataType.TEXT)).toBe('0');
      expect(DataTypeUtils.toTypedValue(1, DataType.TEXT)).toBe('1');
      expect(DataTypeUtils.toTypedValue('abc', DataType.TEXT)).toBe('abc');
   });

   it('#toTypedValue should return undefined when value is not a number', () => {
      expect(DataTypeUtils.toTypedValue('X', DataType.NUMBER)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue('1-', DataType.NUMBER)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(false, DataType.NUMBER)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(true, DataType.NUMBER)).toBeUndefined();
   });

   it('#toTypedValue should return undefined when value is not time compatible', () => {
      expect(DataTypeUtils.toTypedValue('X', DataType.NUMBER)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue('1-', DataType.NUMBER)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(false, DataType.NUMBER)).toBeUndefined();
      expect(DataTypeUtils.toTypedValue(true, DataType.NUMBER)).toBeUndefined();
   });

   it('#asBoolean should return unchanged when value is missing', () => {
      expect(DataTypeUtils.asBoolean(null)).toBeNull();
      expect(DataTypeUtils.asBoolean(undefined)).toBeUndefined();
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

   it('#asBoolean should return boolean when value includes boolean', () => {
      expect(DataTypeUtils.asBoolean('true')).toBe(true);
      expect(DataTypeUtils.asBoolean('false')).toBe(false);
      expect(DataTypeUtils.asBoolean('TRUE')).toBe(true);
      expect(DataTypeUtils.asBoolean('FALSE')).toBe(false);
   });

   it('#asBoolean should return boolean when value represents boolean', () => {
      expect(DataTypeUtils.asBoolean(1)).toBe(true);
      expect(DataTypeUtils.asBoolean(0)).toBe(false);
      expect(DataTypeUtils.asBoolean('1')).toBe(true);
      expect(DataTypeUtils.asBoolean('0')).toBe(false);
      expect(DataTypeUtils.asBoolean('+')).toBe(true);
      expect(DataTypeUtils.asBoolean('-')).toBe(false);
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
