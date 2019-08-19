import { ValueRangeConverter } from './value-range-converter';

describe('ValueRangeConverter', () => {

   it('#toLabel should return "empty" when both values are undefined', () => {
      expect(ValueRangeConverter.toLabel(undefined, undefined)).toBe('empty');
   });

   it('#toLabel should return label when min value is undefined', () => {
      expect(ValueRangeConverter.toLabel(undefined, 1)).toBe('min - 1');
   });

   it('#toLabel should return label when max value is undefined', () => {
      expect(ValueRangeConverter.toLabel(1, undefined)).toBe('1 - max');
   });

   it('#toLabel should return label when both values are defined', () => {
      expect(ValueRangeConverter.toLabel(1, 2)).toBe('1 - 2');
   });

   it('#toMinValue should return undefined when label is "empty"', () => {
      expect(ValueRangeConverter.toMinValue('empty')).toBeUndefined();
   });

   it('#toMinValue should return undefined when label starts with "min"', () => {
      expect(ValueRangeConverter.toMinValue('min - 1')).toBeUndefined();
   });

   it('#toMinValue should return number when label starts with number', () => {
      expect(ValueRangeConverter.toMinValue('-1 - 0')).toBe(-1);
      expect(ValueRangeConverter.toMinValue('0 - 1')).toBe(0);
      expect(ValueRangeConverter.toMinValue('1 - 2')).toBe(1);
   });

   it('#toMaxValue should return undefined when label is "empty"', () => {
      expect(ValueRangeConverter.toMaxValue('empty')).toBeUndefined();
   });

   it('#toMaxValue should return undefined when label ends with "max"', () => {
      expect(ValueRangeConverter.toMaxValue('1 - max')).toBeUndefined();
   });

   it('#toMaxValue should return number when label ends with number', () => {
      expect(ValueRangeConverter.toMaxValue('-2 - -1')).toBe(-1);
      expect(ValueRangeConverter.toMaxValue('-1 - 0')).toBe(0);
      expect(ValueRangeConverter.toMaxValue('0 - 1')).toBe(1);
   });
});
