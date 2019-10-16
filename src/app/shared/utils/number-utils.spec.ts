import { NumberUtils } from './number-utils';

describe('NumberUtils', () => {

  it('#isInteger should return false when value is not present', () => {
    expect(NumberUtils.isInteger(null)).toBeFalsy();
    expect(NumberUtils.isInteger(undefined)).toBeFalsy();
  });

  it('#isInteger should return false when value is boolean', () => {
    expect(NumberUtils.isInteger(true)).toBeFalsy();
    expect(NumberUtils.isInteger(false)).toBeFalsy();
  });

  it('#isInteger should return false when value is blank string', () => {
    expect(NumberUtils.isInteger('')).toBeFalsy();
    expect(NumberUtils.isInteger('  ')).toBeFalsy();
  });

  it('#isInteger should return false when string value represents not a number', () => {
    expect(NumberUtils.isInteger('1-')).toBeFalsy();
    expect(NumberUtils.isInteger('y')).toBeFalsy();
    expect(NumberUtils.isInteger('.')).toBeFalsy();
    expect(NumberUtils.isInteger('1.1.0')).toBeFalsy();
  });

  it('#isInteger should return false when value is an object', () => {
    expect(NumberUtils.isInteger({})).toBeFalsy();
    expect(NumberUtils.isInteger({ a: 1 })).toBeFalsy();
    expect(NumberUtils.isInteger(new Date())).toBeFalsy();
  });

  it('#isInteger should return false when value is an array', () => {
    expect(NumberUtils.isInteger([])).toBeFalsy();
    expect(NumberUtils.isInteger([1])).toBeFalsy();
  });

  it('#isInteger should return false when value is float', () => {
    expect(NumberUtils.isInteger(-1.1)).toBeFalsy();
    expect(NumberUtils.isInteger(-0.1)).toBeFalsy();
    expect(NumberUtils.isInteger(0.1)).toBeFalsy();
    expect(NumberUtils.isInteger(1.1)).toBeFalsy();
  });

  it('#isInteger should return false when string value contains float', () => {
    expect(NumberUtils.isInteger('-1.1')).toBeFalsy();
    expect(NumberUtils.isInteger('-0.1')).toBeFalsy();
    expect(NumberUtils.isInteger('0.1')).toBeFalsy();
    expect(NumberUtils.isInteger('1.1')).toBeFalsy();
  });

  it('#isInteger should return true when value is integer', () => {
    expect(NumberUtils.isInteger(-100)).toBeTruthy();
    expect(NumberUtils.isInteger(-1)).toBeTruthy();
    expect(NumberUtils.isInteger(0)).toBeTruthy();
    expect(NumberUtils.isInteger(1)).toBeTruthy();
    expect(NumberUtils.isInteger(100)).toBeTruthy();
  });

  it('#isInteger should return true when string value contains integer', () => {
    expect(NumberUtils.isInteger('-100')).toBeTruthy();
    expect(NumberUtils.isInteger('-1')).toBeTruthy();
    expect(NumberUtils.isInteger('0')).toBeTruthy();
    expect(NumberUtils.isInteger('1')).toBeTruthy();
    expect(NumberUtils.isInteger('100')).toBeTruthy();
  });

  it('#isInteger should return true when string value contains formatted integer', () => {
    expect(NumberUtils.isInteger((-1_000_000).toLocaleString())).toBeTruthy();
    expect(NumberUtils.isInteger((1_000_000).toLocaleString())).toBeTruthy();
  });

  it('#isInteger should return false when string value contains misplaced thousands separator', () => {
    expect(NumberUtils.isInteger('-1,0,000')).toBeFalsy();
    expect(NumberUtils.isInteger('-1,0,000')).toBeFalsy();
  });

  it('#isNumber should return false when value is not present', () => {
    expect(NumberUtils.isNumber(null)).toBeFalsy();
    expect(NumberUtils.isNumber(undefined)).toBeFalsy();
  });

  it('#isNumber should return false when value is boolean', () => {
    expect(NumberUtils.isNumber(true)).toBeFalsy();
    expect(NumberUtils.isNumber(false)).toBeFalsy();
  });

  it('#isNumber should return false when value is blank string', () => {
    expect(NumberUtils.isNumber('')).toBeFalsy();
    expect(NumberUtils.isNumber('  ')).toBeFalsy();
  });

  it('#isNumber should return false when string value represents not a number', () => {
    expect(NumberUtils.isNumber('1-')).toBeFalsy();
    expect(NumberUtils.isNumber('y')).toBeFalsy();
    expect(NumberUtils.isNumber('.')).toBeFalsy();
    expect(NumberUtils.isNumber('1.1.0')).toBeFalsy();
  });

  it('#isNumber should return false when value is an object', () => {
    expect(NumberUtils.isNumber({})).toBeFalsy();
    expect(NumberUtils.isNumber({ a: 1 })).toBeFalsy();
    expect(NumberUtils.isNumber(new Date())).toBeFalsy();
  });

  it('#isNumber should return false when value is an array', () => {
    expect(NumberUtils.isNumber([])).toBeFalsy();
    expect(NumberUtils.isNumber([1])).toBeFalsy();
  });

  it('#isNumber should return true when value is number', () => {
    expect(NumberUtils.isNumber(-1.1)).toBeTruthy();
    expect(NumberUtils.isNumber(-1)).toBeTruthy();
    expect(NumberUtils.isNumber(0)).toBeTruthy();
    expect(NumberUtils.isNumber(1)).toBeTruthy();
    expect(NumberUtils.isNumber(1.1)).toBeTruthy();
  });

  it('#isNumber should return true when string value contains number', () => {
    expect(NumberUtils.isNumber('-1.1')).toBeTruthy();
    expect(NumberUtils.isNumber('-1')).toBeTruthy();
    expect(NumberUtils.isNumber('0')).toBeTruthy();
    expect(NumberUtils.isNumber('1')).toBeTruthy();
    expect(NumberUtils.isNumber('1.1')).toBeTruthy();
  });

  it('#isNumber should return true when string value contains formatted number', () => {
    expect(NumberUtils.isNumber((-1_000_000.1).toLocaleString())).toBeTruthy();
    expect(NumberUtils.isNumber((1_000_000.1).toLocaleString())).toBeTruthy();
  });

  it('#isNumber should return false when string value contains misplaced thousands separator', () => {
    expect(NumberUtils.isNumber('-1,0,000.1')).toBeFalsy();
    expect(NumberUtils.isNumber('-1,0,000.1')).toBeFalsy();
  });

  it('#representsNumber should return false when string is missing', () => {
    expect(NumberUtils.representsNumber(null)).toBeFalsy();
    expect(NumberUtils.representsNumber(undefined)).toBeFalsy();
  });

  it('#representsNumber should return false when string is blank', () => {
    expect(NumberUtils.representsNumber('')).toBeFalsy();
    expect(NumberUtils.representsNumber('   ')).toBeFalsy();
  });

  it('#representsNumber should return false when string represents no number', () => {
    expect(NumberUtils.representsNumber('a')).toBeFalsy();
    expect(NumberUtils.representsNumber('1a')).toBeFalsy();
    expect(NumberUtils.representsNumber('1-')).toBeFalsy();
    expect(NumberUtils.representsNumber('-  1')).toBeFalsy();
    expect(NumberUtils.representsNumber('--1')).toBeFalsy();
    expect(NumberUtils.representsNumber('++1')).toBeFalsy();
    expect(NumberUtils.representsNumber('+  1')).toBeFalsy();
    expect(NumberUtils.representsNumber('1+')).toBeFalsy();
    expect(NumberUtils.representsNumber('1..1')).toBeFalsy();
    expect(NumberUtils.representsNumber('1,0,00')).toBeFalsy();
  });

  it('#representsNumber should return true when string represents number', () => {
    expect(NumberUtils.representsNumber('-1000000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('- 1.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('-1.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('-0.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('0')).toBeTruthy();
    expect(NumberUtils.representsNumber('0.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('1.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('1000000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('+0.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('+ 1.1')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1000000.123')).toBeTruthy();
  });

  it('#representsNumber should return true when string represents number with thousands separator', () => {
    expect(NumberUtils.representsNumber('-1,000,000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('-1,000,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('-1,000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('-1,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('1,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('1,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('1,000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('1,000,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('1,000,000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1,000.123')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1,000,000')).toBeTruthy();
    expect(NumberUtils.representsNumber('+1,000,000.123')).toBeTruthy();
  });

  it('#asNumber should return undefined when value is undefined', () => {
    expect(NumberUtils.asNumber(undefined)).toBeUndefined();
    expect(NumberUtils.asNumber(null)).toBeUndefined();
  });

  it('#asNumber should return undefined when value is an object', () => {
    expect(NumberUtils.asNumber(<number>{})).toBeUndefined();
  });

  it('#asNumber should return undefined when value is not a number', () => {
    expect(NumberUtils.asNumber('X')).toBeUndefined();
    expect(NumberUtils.asNumber('1-')).toBeUndefined();
    expect(NumberUtils.asNumber('1.1.1')).toBeUndefined();
  });

  it('#asNumber should return number when value is boolean', () => {
    expect(NumberUtils.asNumber(true)).toBe(1);
    expect(NumberUtils.asNumber(false)).toBe(0);
  });

  it('#asNumber should return undefined when value is blank string', () => {
    expect(NumberUtils.asNumber('')).toBeUndefined();
    expect(NumberUtils.asNumber('  ')).toBeUndefined();
  });

  it('#asNumber should return number when value is number', () => {
    expect(NumberUtils.asNumber(-1.1)).toBe(-1.1);
    expect(NumberUtils.asNumber(-1)).toBe(-1);
    expect(NumberUtils.asNumber(-0.1)).toBe(-0.1);
    expect(NumberUtils.asNumber(0)).toBe(0);
    expect(NumberUtils.asNumber(0.1)).toBe(0.1);
    expect(NumberUtils.asNumber(1)).toBe(1);
    expect(NumberUtils.asNumber(1.1)).toBe(1.1);
  });

  it('#asNumber should return integer when value contains integer', () => {
    expect(NumberUtils.asNumber('-1')).toBe(-1);
    expect(NumberUtils.asNumber('0')).toBe(0);
    expect(NumberUtils.asNumber('1')).toBe(1);
  });

  it('#asNumber should return integer when value contains integer with thousands separators', () => {
    expect(NumberUtils.asNumber('-1,000,000')).toBe(-1_000_000);
    expect(NumberUtils.asNumber('1,000,000')).toBe(1_000_000);
  });

  it('#asNumber should return undefined value contains integer with misplaced thousands separators', () => {
    expect(NumberUtils.asNumber('-1,0,000')).toBeUndefined();
    expect(NumberUtils.asNumber('1,0,000')).toBeUndefined();
  });

  it('#asNumber should return float when value contains float', () => {
    expect(NumberUtils.asNumber('-1.1')).toBe(-1.1);
    expect(NumberUtils.asNumber('1.1')).toBe(1.1);
  });

  it('#asNumber should return float when value contains float with thousands separators', () => {
    expect(NumberUtils.asNumber('-1,000,000.5')).toBe(-1_000_000.5);
    expect(NumberUtils.asNumber('1,000,000.5')).toBe(1_000_000.5);
  });

  it('#asNumber should return undefined value contains float with misplaced thousands separators', () => {
    expect(NumberUtils.asNumber('-1,0,000.5')).toBeUndefined();
    expect(NumberUtils.asNumber('1,0,000.5')).toBeUndefined();
  });

  it('#parseNumber should return undefined when string is undefined', () => {
    expect(NumberUtils.parseNumber(undefined)).toBeUndefined();
    expect(NumberUtils.parseNumber(null)).toBeUndefined();
  });

  it('#parseNumber should return undefined when string is blank', () => {
    expect(NumberUtils.parseNumber('')).toBeUndefined();
    expect(NumberUtils.parseNumber('   ')).toBeUndefined();
  });

  it('#parseNumber should return undefined when string is not a number', () => {
    expect(NumberUtils.parseNumber('X')).toBeUndefined();
    expect(NumberUtils.parseNumber('1A')).toBeUndefined();
    expect(NumberUtils.parseNumber('1-')).toBeUndefined();
    expect(NumberUtils.parseNumber('1+')).toBeUndefined();
    expect(NumberUtils.parseNumber('1.1.1')).toBeUndefined();
  });

  it('#parseNumber should return integer when string contains integer', () => {
    expect(NumberUtils.parseNumber('-1')).toBe(-1);
    expect(NumberUtils.parseNumber('0')).toBe(0);
    expect(NumberUtils.parseNumber('1')).toBe(1);
    expect(NumberUtils.parseNumber('+1')).toBe(1);
  });

  it('#parseNumber should return integer when string contains integer with thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,000,000')).toBe(-1_000_000);
    expect(NumberUtils.parseNumber('1,000,000')).toBe(1_000_000);
  });

  it('#parseNumber should return undefined when string contains integer with misplaced thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,0,000')).toBeUndefined();
    expect(NumberUtils.parseNumber('1,0,000')).toBeUndefined();
  });

  it('#parseNumber should return float when string contains float', () => {
    expect(NumberUtils.parseNumber('-1.1')).toBe(-1.1);
    expect(NumberUtils.parseNumber('1.1')).toBe(1.1);
  });

  it('#parseNumber should return float when string contains float with thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,000,000.5')).toBe(-1_000_000.5);
    expect(NumberUtils.parseNumber('1,000,000.5')).toBe(1_000_000.5);
  });

  it('#parseNumber should return undefined when string contains float with misplaced thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,0,000.5')).toBeUndefined();
    expect(NumberUtils.parseNumber('1,0,000.5')).toBeUndefined();
  });

  it('#parseInt should return undefined when string is undefined', () => {
    expect(NumberUtils.parseInt(undefined)).toBeUndefined();
    expect(NumberUtils.parseInt(null)).toBeUndefined();
  });

  it('#parseInt should return undefined when string is blank', () => {
    expect(NumberUtils.parseInt('')).toBeUndefined();
    expect(NumberUtils.parseInt('   ')).toBeUndefined();
  });

  it('#parseInt should return undefined when string is not a number', () => {
    expect(NumberUtils.parseInt('X')).toBeUndefined();
    expect(NumberUtils.parseInt('1A')).toBeUndefined();
    expect(NumberUtils.parseInt('1-')).toBeUndefined();
    expect(NumberUtils.parseInt('1+')).toBeUndefined();
    expect(NumberUtils.parseInt('1.1.1')).toBeUndefined();
  });

  it('#parseInt should return integer when string contains no thousands separators', () => {
    expect(NumberUtils.parseInt('-1')).toBe(-1);
    expect(NumberUtils.parseInt('0')).toBe(0);
    expect(NumberUtils.parseInt('1')).toBe(1);
    expect(NumberUtils.parseInt('+1')).toBe(1);
    expect(NumberUtils.parseInt('1000')).toBe(1_000);
    expect(NumberUtils.parseInt('7111000')).toBe(7_111_000);
  });

  it('#parseInt should return integer when string contains thousands separators', () => {
    expect(NumberUtils.parseInt('1,000')).toBe(1_000);
    expect(NumberUtils.parseInt('7,111,000')).toBe(7_111_000);
  });

  it('#parseInt should return undefined when string contains integer with misplaced thousands separators', () => {
    expect(NumberUtils.parseInt('-1,0,000')).toBeUndefined();
    expect(NumberUtils.parseInt('1,0,000')).toBeUndefined();
  });

  it('#parseFloat should return undefined when string is undefined', () => {
    expect(NumberUtils.parseFloat(undefined)).toBeUndefined();
    expect(NumberUtils.parseFloat(null)).toBeUndefined();
  });

  it('#parseFloat should return undefined when string is blank', () => {
    expect(NumberUtils.parseFloat('')).toBeUndefined();
    expect(NumberUtils.parseFloat('   ')).toBeUndefined();
  });

  it('#parseFloat should return undefined when string is not a number', () => {
    expect(NumberUtils.parseFloat('X')).toBeUndefined();
    expect(NumberUtils.parseFloat('1A')).toBeUndefined();
    expect(NumberUtils.parseFloat('1-')).toBeUndefined();
    expect(NumberUtils.parseFloat('1+')).toBeUndefined();
    expect(NumberUtils.parseFloat('1.1.1')).toBeUndefined();
  });

  it('#parseFloat should return float when string contains no thousands separators', () => {
    expect(NumberUtils.parseFloat('-1.1')).toBe(-1.1);
    expect(NumberUtils.parseFloat('-0.1')).toBe(-0.1);
    expect(NumberUtils.parseFloat('0.0')).toBe(0);
    expect(NumberUtils.parseFloat('0.0000')).toBe(0);
    expect(NumberUtils.parseFloat('0.1')).toBe(0.1);
    expect(NumberUtils.parseFloat('1.1')).toBe(1.1);
    expect(NumberUtils.parseFloat('+1.1')).toBe(1.1);
    expect(NumberUtils.parseFloat('1000.51')).toBe(1_000.51);
    expect(NumberUtils.parseFloat('7111000.51')).toBe(7_111_000.51);
  });

  it('#parseFloat should return float when string contains thousands separators', () => {
    expect(NumberUtils.parseFloat('1,000.51')).toBe(1_000.51);
    expect(NumberUtils.parseFloat('7,111,000.51')).toBe(7_111_000.51);
  });

  it('#parseFloat should return undefined when string contains float with misplaced thousands separators', () => {
    expect(NumberUtils.parseFloat('-1,0,000.5')).toBeUndefined();
    expect(NumberUtils.parseFloat('1,0,000.5')).toBeUndefined();
  });

  it('#countDecimals should return zero when number is missing', () => {
    expect(NumberUtils.countDecimals(null)).toBe(0);
    expect(NumberUtils.countDecimals(undefined)).toBe(0);
  });

  it('#countDecimals should return zero when number has no decimals', () => {
    expect(NumberUtils.countDecimals(-84)).toBe(0);
    expect(NumberUtils.countDecimals(-1)).toBe(0);
    expect(NumberUtils.countDecimals(0)).toBe(0);
    expect(NumberUtils.countDecimals(1)).toBe(0);
    expect(NumberUtils.countDecimals(84)).toBe(0);
  });

  it('#countDecimals should return number of decimals when number has decimals', () => {
    expect(NumberUtils.countDecimals(-1000.1234)).toBe(4);
    expect(NumberUtils.countDecimals(-1.123)).toBe(3);
    expect(NumberUtils.countDecimals(-0.12)).toBe(2);
    expect(NumberUtils.countDecimals(0.12)).toBe(2);
    expect(NumberUtils.countDecimals(1.123)).toBe(3);
    expect(NumberUtils.countDecimals(1000.1234)).toBe(4);
  });

  it('#countDigits should return zero when string is missing or empty', () => {
    expect(NumberUtils.countDigits(null)).toBe(0);
    expect(NumberUtils.countDigits(undefined)).toBe(0);
    expect(NumberUtils.countDigits('')).toBe(0);
  });

  it('#countDigits should return zero when string contains no digits', () => {
    expect(NumberUtils.countDigits(' ')).toBe(0);
    expect(NumberUtils.countDigits('abc')).toBe(0);
    expect(NumberUtils.countDigits('ABC')).toBe(0);
    expect(NumberUtils.countDigits('.')).toBe(0);
    expect(NumberUtils.countDigits(',')).toBe(0);
    expect(NumberUtils.countDigits(';')).toBe(0);
  });

  it('#countDigits should return number of digits when string contains digits', () => {
    expect(NumberUtils.countDigits('0')).toBe(1);
    expect(NumberUtils.countDigits('12')).toBe(2);
    expect(NumberUtils.countDigits('1A')).toBe(1);
    expect(NumberUtils.countDigits('A1')).toBe(1);
    expect(NumberUtils.countDigits('16.1')).toBe(3);
    expect(NumberUtils.countDigits('A 1 B 16 ; 5')).toBe(4);
  });

  it('#min should return undefined when bot numbers are missing', () => {
    expect(NumberUtils.min(undefined, undefined)).toBeUndefined();
    expect(NumberUtils.min(null, null)).toBeNull();
  });

  it('#min should return number when single number is defined', () => {
    expect(NumberUtils.min(-1, undefined)).toBe(-1);
    expect(NumberUtils.min(1, null)).toBe(1);
    expect(NumberUtils.min(0, undefined)).toBe(0);
    expect(NumberUtils.min(0, null)).toBe(0);
    expect(NumberUtils.min(undefined, -1)).toBe(-1);
    expect(NumberUtils.min(null, 1)).toBe(1);
    expect(NumberUtils.min(undefined, 0)).toBe(0);
    expect(NumberUtils.min(null, 0)).toBe(0);
  });

  it('#min should return number when both numbers are same', () => {
    expect(NumberUtils.min(-1, -1)).toBe(-1);
    expect(NumberUtils.min(0, 0)).toBe(0);
    expect(NumberUtils.min(1, 1)).toBe(1);
  });

  it('#min should return first number when first number is smaller', () => {
    expect(NumberUtils.min(-2, -1)).toBe(-2);
    expect(NumberUtils.min(-1, 0)).toBe(-1);
    expect(NumberUtils.min(0, 1)).toBe(0);
    expect(NumberUtils.min(1, 2)).toBe(1);
  });

  it('#min should return second number when second number is smaller', () => {
    expect(NumberUtils.min(-1, -2)).toBe(-2);
    expect(NumberUtils.min(0, -1)).toBe(-1);
    expect(NumberUtils.min(1, 0)).toBe(0);
    expect(NumberUtils.min(2, 1)).toBe(1);
  });

  it('#max should return undefined when bot numbers are missing', () => {
    expect(NumberUtils.max(undefined, undefined)).toBeUndefined();
    expect(NumberUtils.max(null, null)).toBeNull();
  });

  it('#max should return number when single number is defined', () => {
    expect(NumberUtils.max(-1, undefined)).toBe(-1);
    expect(NumberUtils.max(1, null)).toBe(1);
    expect(NumberUtils.max(0, undefined)).toBe(0);
    expect(NumberUtils.max(0, null)).toBe(0);
    expect(NumberUtils.max(undefined, -1)).toBe(-1);
    expect(NumberUtils.max(null, 1)).toBe(1);
    expect(NumberUtils.max(undefined, 0)).toBe(0);
    expect(NumberUtils.max(null, 0)).toBe(0);
  });

  it('#max should return number when both numbers are same', () => {
    expect(NumberUtils.max(-1, -1)).toBe(-1);
    expect(NumberUtils.max(0, 0)).toBe(0);
    expect(NumberUtils.max(1, 1)).toBe(1);
  });

  it('#max should return first number when first number is bigger', () => {
    expect(NumberUtils.max(2, 1)).toBe(2);
    expect(NumberUtils.max(1, 0)).toBe(1);
    expect(NumberUtils.max(0, -1)).toBe(0);
    expect(NumberUtils.max(-1, -2)).toBe(-1);
  });

  it('#max should return second number when second number is bigger', () => {
    expect(NumberUtils.max(1, 2)).toBe(2);
    expect(NumberUtils.max(0, 1)).toBe(1);
    expect(NumberUtils.max(-1, 0)).toBe(0);
    expect(NumberUtils.max(-2, -1)).toBe(-1);
  });

  it('#diff should return difference when numbers are zero or positive', () => {
    expect(NumberUtils.diff(0, 1)).toBe(1);
    expect(NumberUtils.diff(1, 0)).toBe(1);
    expect(NumberUtils.diff(1, 2)).toBe(1);
    expect(NumberUtils.diff(2, 1)).toBe(1);
  });

  it('#diff should return difference when numbers are zero or negative', () => {
    expect(NumberUtils.diff(0, -1)).toBe(1);
    expect(NumberUtils.diff(-1, 0)).toBe(1);
    expect(NumberUtils.diff(-1, -2)).toBe(1);
    expect(NumberUtils.diff(-2, -1)).toBe(1);
  });

  it('#diff should return difference when numbers are negative and positive', () => {
    expect(NumberUtils.diff(-1, 1)).toBe(2);
  });

  it('#rangeClosedIntArray should return empty array when endInclusive less than 1', () => {
    expect(NumberUtils.rangeClosedIntArray(0)).toEqual([]);
  });

  it('#rangeClosedIntArray should return int array when endInclusive greater than 0', () => {
    expect(NumberUtils.rangeClosedIntArray(1)).toEqual([1]);
    expect(NumberUtils.rangeClosedIntArray(3)).toEqual([1, 2, 3]);
    expect(NumberUtils.rangeClosedIntArray(10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('#generateEvenSpreadNumbers should return empty array when count is less than 2', () => {
    expect(NumberUtils.generateEvenSpreadNumbers(1, 2, 7)).toEqual([]);
  });

  it('#generateEvenSpreadNumbers should return empty array when min is greater than max', () => {
    expect(NumberUtils.generateEvenSpreadNumbers(1, 8, 0)).toEqual([]);
  });

  it('#generateEvenSpreadNumbers should return min and max when count is 2', () => {
    expect(NumberUtils.generateEvenSpreadNumbers(2, 2, 7)).toEqual([2, 7]);
  });

  it('#generateEvenSpreadNumbers should return number range when min and max are positive', () => {
    expect(NumberUtils.generateEvenSpreadNumbers(3, 1, 3)).toEqual([1, 2, 3]);
  });

  it('#generateEvenSpreadNumbers should return number range when min and max are negative', () => {
    expect(NumberUtils.generateEvenSpreadNumbers(3, -3, -1)).toEqual([-3, -2, -1]);
  });

  it('#generateEvenSpreadNumbers should return number range when min and max are negative and positive', () => {
    expect(NumberUtils.generateEvenSpreadNumbers(9, -4, 4)).toEqual([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
  });

  it('#basePowerOfTen should return unchanged when value undefined or zero', () => {
    expect(NumberUtils.basePowerOfTen(null)).toBeNull();
    expect(NumberUtils.basePowerOfTen(undefined)).toBeUndefined();
    expect(NumberUtils.basePowerOfTen(0)).toBe(0);
  });

  it('#basePowerOfTen should return number of stages when value is negative', () => {
    expect(NumberUtils.basePowerOfTen(-0.00851)).toBe(0.001);
    expect(NumberUtils.basePowerOfTen(-0.51)).toBe(0.1);
    expect(NumberUtils.basePowerOfTen(-0.925)).toBe(0.1);
    expect(NumberUtils.basePowerOfTen(-1)).toBe(1);
    expect(NumberUtils.basePowerOfTen(-5.51)).toBe(1);
    expect(NumberUtils.basePowerOfTen(-10.111)).toBe(10);
    expect(NumberUtils.basePowerOfTen(-18)).toBe(10);
    expect(NumberUtils.basePowerOfTen(-920)).toBe(100);
    expect(NumberUtils.basePowerOfTen(-1_920)).toBe(1_000);
    expect(NumberUtils.basePowerOfTen(-8_820)).toBe(1_000);
    expect(NumberUtils.basePowerOfTen(-17_535)).toBe(10_000);
  });

  it('#basePowerOfTen should return number of stages when value is positive', () => {
    expect(NumberUtils.basePowerOfTen(0.00851)).toBe(0.001);
    expect(NumberUtils.basePowerOfTen(0.51)).toBe(0.1);
    expect(NumberUtils.basePowerOfTen(0.925)).toBe(0.1);
    expect(NumberUtils.basePowerOfTen(1)).toBe(1);
    expect(NumberUtils.basePowerOfTen(5.51)).toBe(1);
    expect(NumberUtils.basePowerOfTen(10.111)).toBe(10);
    expect(NumberUtils.basePowerOfTen(18)).toBe(10);
    expect(NumberUtils.basePowerOfTen(920)).toBe(100);
    expect(NumberUtils.basePowerOfTen(1_920)).toBe(1_000);
    expect(NumberUtils.basePowerOfTen(8_820)).toBe(1_000);
    expect(NumberUtils.basePowerOfTen(17_535)).toBe(10_000);
    expect(NumberUtils.basePowerOfTen(5_000_000)).toBe(1_000_000);
  });

  it('#roundUpBroad should return unchanged when number undefined or zero', () => {
    expect(NumberUtils.roundUpBroad(null)).toBeNull();
    expect(NumberUtils.roundUpBroad(undefined)).toBeUndefined();
    expect(NumberUtils.roundUpBroad(0)).toBe(0);
  });

  it('#roundUpBroad should round up when value is negative', () => {
    expect(NumberUtils.roundUpBroad(-0.0083)).toBe(-0.008);
    expect(NumberUtils.roundUpBroad(-0.51)).toBe(-0.5);
    expect(NumberUtils.roundUpBroad(-10.111)).toBe(-10);
    expect(NumberUtils.roundUpBroad(-18)).toBe(-10);
    expect(NumberUtils.roundUpBroad(-920)).toBe(-900);
    expect(NumberUtils.roundUpBroad(-1_920)).toBe(-1_000);
    expect(NumberUtils.roundUpBroad(-8_820)).toBe(-8_000);
    expect(NumberUtils.roundUpBroad(-17_535)).toBe(-10_000);
  });

  it('#roundUpBroad should round up when value is positive', () => {
    expect(NumberUtils.roundUpBroad(0.0083)).toBe(0.009);
    expect(NumberUtils.roundUpBroad(0.51)).toBe(0.6);
    expect(NumberUtils.roundUpBroad(9.999)).toBe(10);
    expect(NumberUtils.roundUpBroad(18)).toBe(20);
    expect(NumberUtils.roundUpBroad(920)).toBe(1_000);
    expect(NumberUtils.roundUpBroad(1_920)).toBe(2_000);
    expect(NumberUtils.roundUpBroad(8_820)).toBe(9_000);
    expect(NumberUtils.roundUpBroad(17_535)).toBe(20_000);
  });

  it('#startIndexAfterDecimalPoint should return zero when number greater or equal to 0.1', () => {
    expect(NumberUtils.startIndexAfterDecimalPoint(0.1)).toBe(0);
    expect(NumberUtils.startIndexAfterDecimalPoint(0.9)).toBe(0);
    expect(NumberUtils.startIndexAfterDecimalPoint(1.1)).toBe(0);
  });

  it('#startIndexAfterDecimalPoint should return zero when number less or equal to -0.1', () => {
    expect(NumberUtils.startIndexAfterDecimalPoint(-0.1)).toBe(0);
    expect(NumberUtils.startIndexAfterDecimalPoint(-0.9)).toBe(0);
    expect(NumberUtils.startIndexAfterDecimalPoint(-1.1)).toBe(0);
  });

  it('#startIndexAfterDecimalPoint should shift when number is negative', () => {
    expect(NumberUtils.startIndexAfterDecimalPoint(-0.0351)).toBe(1);
    expect(NumberUtils.startIndexAfterDecimalPoint(-0.00868)).toBe(2);
    expect(NumberUtils.startIndexAfterDecimalPoint(-0.000547)).toBe(3);
  });

  it('#startIndexAfterDecimalPoint should shift when number is positive', () => {
    expect(NumberUtils.startIndexAfterDecimalPoint(0.0351)).toBe(1);
    expect(NumberUtils.startIndexAfterDecimalPoint(0.00868)).toBe(2);
    expect(NumberUtils.startIndexAfterDecimalPoint(0.000547)).toBe(3);
  });

  it('#isNumberKey should return true when key is digit', () => {
    for (const key of [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]) {
      const event = new KeyboardEvent('keydown', { key: key.toString() });
      expect(NumberUtils.isNumberKey(event)).toBeTruthy();
    }
  });

  it('#isNumberKey should return true when key is minus sign', () => {
    const event = new KeyboardEvent('keydown', { key: '-' });
    expect(NumberUtils.isNumberKey(event)).toBeTruthy();
  });

  it('#isNumberKey should return true when key is local decimal separator', () => {
    const event = new KeyboardEvent('keydown', { key: '.' });
    expect(NumberUtils.isNumberKey(event)).toBeTruthy();
  });

  it('#isNumberKey should return false when no-number key', () => {
    for (const key of ['a', 'A', ' ', '_', '?', '/', '=', '*', '%', '&']) {
      const event = new KeyboardEvent('keydown', { key: key });
      expect(NumberUtils.isNumberKey(event)).toBeFalsy('for key ' + key);
    }
  });
});
