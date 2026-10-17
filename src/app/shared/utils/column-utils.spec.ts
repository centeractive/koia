import { Column, DataType } from '../model';
import { containsAnyNumber } from './column-utils';

describe('column-utils', () => {

   const number: Column = { name: 'Amount', dataType: DataType.NUMBER, width: 10 };
   const text: Column = { name: 'Name', dataType: DataType.TEXT, width: 10 };

   it('#containsAnyNumber should return false when columns are undefined', () => {
      expect(containsAnyNumber(undefined)).toBe(false);
   });

   it('#containsAnyNumber should return false when columns are empty', () => {
      expect(containsAnyNumber([])).toBe(false);
   });

   it('#containsAnyNumber should return true when single NUMBER column is provided', () => {
      expect(containsAnyNumber([number])).toBe(true);
   });

   it('#containsAnyNumber should return true when NUMBER and TEXT columns are provided', () => {
      expect(containsAnyNumber([number, text])).toBe(true);
   });

   it('#containsAnyNumber should return false when single TEXT column is provided', () => {
      expect(containsAnyNumber([text])).toBe(false);
   });
});
