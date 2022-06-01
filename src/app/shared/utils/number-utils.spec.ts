import { NumberUtils } from './number-utils';

describe('NumberUtils', () => {

  it('#isInteger should return false when value is not present', () => {
    expect(NumberUtils.isInteger(null, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger(undefined, 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when value is boolean', () => {
    expect(NumberUtils.isInteger(true, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger(false, 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when value is blank string', () => {
    expect(NumberUtils.isInteger('', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('  ', 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when string value represents not a number', () => {
    expect(NumberUtils.isInteger('1-', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('y', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('.', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('1.1.0', 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when value is an object', () => {
    expect(NumberUtils.isInteger({}, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger({ a: 1 }, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger(new Date(), 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when value is an array', () => {
    expect(NumberUtils.isInteger([], 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger([1], 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when value is float', () => {
    expect(NumberUtils.isInteger(-1.1, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger(-0.1, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger(0.1, 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger(1.1, 'en-US')).toBeFalse();
  });

  it('#isInteger should return false when string value represents float', () => {
    expect(NumberUtils.isInteger('-1.1', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('-1.0', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('-0.1', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('0.0', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('0.1', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('1.0', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('1.1', 'en-US')).toBeFalse();
  });

  it('#isInteger should return true when value is integer', () => {
    expect(NumberUtils.isInteger(-100, 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger(-1, 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger(0, 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger(1, 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger(100, 'en-US')).toBeTrue();
  });

  it('#isInteger should return true when string value represents integer', () => {
    expect(NumberUtils.isInteger('-100', 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger('-1', 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger('0', 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger('1', 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger('100', 'en-US')).toBeTrue();
  });

  it('#isInteger should return true when string value contains formatted integer', () => {
    expect(NumberUtils.isInteger('-1,000,000', 'en-US')).toBeTrue();
    expect(NumberUtils.isInteger('-1,000,000', 'en-US')).toBeTrue();
  });

  it('#isInteger should return false when string value contains misplaced thousands separator', () => {
    expect(NumberUtils.isInteger('-1,0,000', 'en-US')).toBeFalse();
    expect(NumberUtils.isInteger('-1,0,000', 'en-US')).toBeFalse();
  });

  it('#isNumber should return false when value is not present', () => {
    expect(NumberUtils.isNumber(null, 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber(undefined, 'en-US')).toBeFalse();
  });

  it('#isNumber should return false when value is boolean', () => {
    expect(NumberUtils.isNumber(true, 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber(false, 'en-US')).toBeFalse();
  });

  it('#isNumber should return false when value is blank string', () => {
    expect(NumberUtils.isNumber('', 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber('  ', 'en-US')).toBeFalse();
  });

  it('#isNumber should return false when string value represents not a number', () => {
    expect(NumberUtils.isNumber('1-', 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber('y', 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber('.', 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber('1.1.0', 'en-US')).toBeFalse();
  });

  it('#isNumber should return false when value is an object', () => {
    expect(NumberUtils.isNumber({}, 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber({ a: 1 }, 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber(new Date(), 'en-US')).toBeFalse();
  });

  it('#isNumber should return false when value is an array', () => {
    expect(NumberUtils.isNumber([], 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber([1], 'en-US')).toBeFalse();
  });

  it('#isNumber should return true when value is number', () => {
    expect(NumberUtils.isNumber(-1.1, 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber(-1, 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber(0, 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber(1, 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber(1.1, 'en-US')).toBeTrue();
  });

  it('#isNumber should return true when string contains completable float', () => {
    expect(NumberUtils.isNumber('-.1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('.1', 'en-US')).toBeTrue();
  });

  it('#isNumber should return true when string contains number', () => {
    expect(NumberUtils.isNumber('-1.1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('-1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('-0.1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('0', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('0.1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('1.1', 'en-US')).toBeTrue();
  });

  it('#isNumber should return true when string contains formatted number', () => {
    expect(NumberUtils.isNumber('-1,000,000.1', 'en-US')).toBeTrue();
    expect(NumberUtils.isNumber('1,000,000.1', 'en-US')).toBeTrue();
  });

  it('#isNumber should return false when string contains misplaced thousands separator', () => {
    expect(NumberUtils.isNumber('-1,0,000.1', 'en-US')).toBeFalse();
    expect(NumberUtils.isNumber('-1,0,000.1', 'en-US')).toBeFalse();
  });

  it('#representsNumber should return false when string is missing', () => {
    expect(NumberUtils.representsNumber(null, 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber(undefined, 'en-US')).toBeFalse();
  });

  it('#representsNumber should return false when string is blank', () => {
    expect(NumberUtils.representsNumber('', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('   ', 'en-US')).toBeFalse();
  });

  it('#representsNumber should return false when string represents no number', () => {
    expect(NumberUtils.representsNumber('a', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('1a', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('1-', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('- 1.1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('-  1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('--1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('++1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('+  1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('+ 1.1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('1+', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('1..1', 'en-US')).toBeFalse();
    expect(NumberUtils.representsNumber('1,0,00', 'en-US')).toBeFalse();
  });

  it('#representsNumber should return true when string represents number', () => {
    expect(NumberUtils.representsNumber('-1000000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('-1.1', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('-0.1', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('0', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('0.1', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1.1', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1000000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+0.1', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1.1', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1000000.123', 'en-US')).toBeTrue();
  });

  it('#representsNumber should return true when string represents number with thousands separator', () => {
    expect(NumberUtils.representsNumber('-1,000,000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('-1,000,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('-1,000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('-1,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1,000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1,000,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('1,000,000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1,000.123', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1,000,000', 'en-US')).toBeTrue();
    expect(NumberUtils.representsNumber('+1,000,000.123', 'en-US')).toBeTrue();
  });

  it('#normalize when string does not represent a number', () => {
    expect(NumberUtils.normalize(undefined, 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber(null, 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('  ', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('abc', 'en-US')).toBeUndefined();
  });

  it('#normalize when string represents an integer', () => {
    expect(NumberUtils.normalize('-1', 'en-US')).toBe('-1');
    expect(NumberUtils.normalize('0', 'en-US')).toBe('0');
    expect(NumberUtils.normalize('1', 'en-US')).toBe('1');
    expect(NumberUtils.normalize('+1', 'en-US')).toBe('+1');
  });

  it('#normalize when string represents a float', () => {
    expect(NumberUtils.normalize('-1.1', 'en-US')).toBe('-1.1');
    expect(NumberUtils.normalize('0.1', 'en-US')).toBe('0.1');
    expect(NumberUtils.normalize('1.1', 'en-US')).toBe('1.1');
    expect(NumberUtils.normalize('+1.1', 'en-US')).toBe('+1.1');
  });

  it('#normalize when string contains thousands separator(s)', () => {
    expect(NumberUtils.normalize('-1,000,000.1', 'en-US')).toBe('-1000000.1');
    expect(NumberUtils.normalize('-1,000.1', 'en-US')).toBe('-1000.1');
    expect(NumberUtils.normalize('-1,000', 'en-US')).toBe('-1000');
    expect(NumberUtils.normalize('1,000', 'en-US')).toBe('1000');
    expect(NumberUtils.normalize('1,000.1', 'en-US')).toBe('1000.1');
    expect(NumberUtils.normalize('1,000,000.1', 'en-US')).toBe('1000000.1');
  });

  it('#asNumber should return undefined when value is undefined', () => {
    expect(NumberUtils.asNumber(undefined, 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber(null, 'en-US')).toBeUndefined();
  });

  it('#asNumber should return undefined when value is an object', () => {
    expect(NumberUtils.asNumber(<number>{}, 'en-US')).toBeUndefined();
  });

  it('#asNumber should return undefined when value is not a number', () => {
    expect(NumberUtils.asNumber('X', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('1-', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('1.1.1', 'en-US')).toBeUndefined();
  });

  it('#asNumber should return number when value is boolean', () => {
    expect(NumberUtils.asNumber(true, 'en-US')).toBe(1);
    expect(NumberUtils.asNumber(false, 'en-US')).toBe(0);
  });

  it('#asNumber should return undefined when value is blank string', () => {
    expect(NumberUtils.asNumber('', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('  ', 'en-US')).toBeUndefined();
  });

  it('#asNumber should return number when value is number', () => {
    expect(NumberUtils.asNumber(-1.1, 'en-US')).toBe(-1.1);
    expect(NumberUtils.asNumber(-1, 'en-US')).toBe(-1);
    expect(NumberUtils.asNumber(-0.1, 'en-US')).toBe(-0.1);
    expect(NumberUtils.asNumber(0, 'en-US')).toBe(0);
    expect(NumberUtils.asNumber(0.1, 'en-US')).toBe(0.1);
    expect(NumberUtils.asNumber(1, 'en-US')).toBe(1);
    expect(NumberUtils.asNumber(1.1, 'en-US')).toBe(1.1);
  });

  it('#asNumber should return integer when value contains integer', () => {
    expect(NumberUtils.asNumber('-1', 'en-US')).toBe(-1);
    expect(NumberUtils.asNumber('0', 'en-US')).toBe(0);
    expect(NumberUtils.asNumber('1', 'en-US')).toBe(1);
  });

  it('#asNumber should return integer when value contains integer with thousands separators', () => {
    expect(NumberUtils.asNumber('-1,000,000', 'en-US')).toBe(-1_000_000);
    expect(NumberUtils.asNumber('1,000,000', 'en-US')).toBe(1_000_000);
  });

  it('#asNumber should return undefined value contains integer with misplaced thousands separators', () => {
    expect(NumberUtils.asNumber('-1,0,000', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('1,0,000', 'en-US')).toBeUndefined();
  });

  it('#asNumber should return float when value contains float', () => {
    expect(NumberUtils.asNumber('-1.1', 'en-US')).toBe(-1.1);
    expect(NumberUtils.asNumber('1.1', 'en-US')).toBe(1.1);
  });

  it('#asNumber should return float when value contains float with thousands separators', () => {
    expect(NumberUtils.asNumber('-1,000,000.5', 'en-US')).toBe(-1_000_000.5);
    expect(NumberUtils.asNumber('1,000,000.5', 'en-US')).toBe(1_000_000.5);
  });

  it('#asNumber should return undefined value contains float with misplaced thousands separators', () => {
    expect(NumberUtils.asNumber('-1,0,000.5', 'en-US')).toBeUndefined();
    expect(NumberUtils.asNumber('1,0,000.5', 'en-US')).toBeUndefined();
  });

  it('#parseNumber should return undefined when string is undefined', () => {
    expect(NumberUtils.parseNumber(undefined, 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber(null, 'en-US')).toBeUndefined();
  });

  it('#parseNumber should return undefined when string is blank', () => {
    expect(NumberUtils.parseNumber('', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('   ', 'en-US')).toBeUndefined();
  });

  it('#parseNumber should return undefined when string is not a number', () => {
    expect(NumberUtils.parseNumber('X', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('1A', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('1-', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('1+', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('1.1.1', 'en-US')).toBeUndefined();
  });

  it('#parseNumber should return integer when string contains integer', () => {
    expect(NumberUtils.parseNumber('-1', 'en-US')).toBe(-1);
    expect(NumberUtils.parseNumber('0', 'en-US')).toBe(0);
    expect(NumberUtils.parseNumber('1', 'en-US')).toBe(1);
    expect(NumberUtils.parseNumber('+1', 'en-US')).toBe(1);
  });

  it('#parseNumber should return integer when string contains integer with thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,000,000', 'en-US')).toBe(-1_000_000);
    expect(NumberUtils.parseNumber('1,000,000', 'en-US')).toBe(1_000_000);
  });

  it('#parseNumber should return undefined when string contains integer with misplaced thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,0,000', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('1,0,000', 'en-US')).toBeUndefined();
  });

  it('#parseNumber should return float when string contains completable float', () => {
    expect(NumberUtils.parseNumber('-.1', 'en-US')).toBe(-0.1);
    expect(NumberUtils.parseNumber('.1', 'en-US')).toBe(0.1);
  });

  it('#parseNumber should return float when string contains float', () => {
    expect(NumberUtils.parseNumber('-1.1', 'en-US')).toBe(-1.1);
    expect(NumberUtils.parseNumber('1.1', 'en-US')).toBe(1.1);
  });

  it('#parseNumber should return float when string contains float with thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,000,000.5', 'en-US')).toBe(-1_000_000.5);
    expect(NumberUtils.parseNumber('1,000,000.5', 'en-US')).toBe(1_000_000.5);
  });

  it('#parseNumber should return undefined when string contains float with misplaced thousands separators', () => {
    expect(NumberUtils.parseNumber('-1,0,000.5', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseNumber('1,0,000.5', 'en-US')).toBeUndefined();
  });

  it('#parseInt should return undefined when string is undefined', () => {
    expect(NumberUtils.parseInt(undefined, 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt(null, 'en-US')).toBeUndefined();
  });

  it('#parseInt should return undefined when string is blank', () => {
    expect(NumberUtils.parseInt('', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt('   ', 'en-US')).toBeUndefined();
  });

  it('#parseInt should return undefined when string is not a number', () => {
    expect(NumberUtils.parseInt('X', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt('1A', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt('1-', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt('1+', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt('1.1.1', 'en-US')).toBeUndefined();
  });

  it('#parseInt should return integer when string contains no thousands separators', () => {
    expect(NumberUtils.parseInt('-1', 'en-US')).toBe(-1);
    expect(NumberUtils.parseInt('0', 'en-US')).toBe(0);
    expect(NumberUtils.parseInt('1', 'en-US')).toBe(1);
    expect(NumberUtils.parseInt('+1', 'en-US')).toBe(1);
    expect(NumberUtils.parseInt('1000', 'en-US')).toBe(1_000);
    expect(NumberUtils.parseInt('7111000', 'en-US')).toBe(7_111_000);
  });

  it('#parseInt should return integer when string contains thousands separators', () => {
    expect(NumberUtils.parseInt('1,000', 'en-US')).toBe(1_000);
    expect(NumberUtils.parseInt('7,111,000', 'en-US')).toBe(7_111_000);
  });

  it('#parseInt should return undefined when string contains integer with misplaced thousands separators', () => {
    expect(NumberUtils.parseInt('-1,0,000', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseInt('1,0,000', 'en-US')).toBeUndefined();
  });

  it('#parseFloat should return undefined when string is undefined', () => {
    expect(NumberUtils.parseFloat(undefined, 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat(null, 'en-US')).toBeUndefined();
  });

  it('#parseFloat should return undefined when string is blank', () => {
    expect(NumberUtils.parseFloat('', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat('   ', 'en-US')).toBeUndefined();
  });

  it('#parseFloat should return undefined when string is not a number', () => {
    expect(NumberUtils.parseFloat('X', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat('1A', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat('1-', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat('1+', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat('1.1.1', 'en-US')).toBeUndefined();
  });

  it('#parseFloat should return float when string contains no thousands separators', () => {
    expect(NumberUtils.parseFloat('-1.1', 'en-US')).toBe(-1.1);
    expect(NumberUtils.parseFloat('-0.1', 'en-US')).toBe(-0.1);
    expect(NumberUtils.parseFloat('0.0', 'en-US')).toBe(0);
    expect(NumberUtils.parseFloat('0.0000', 'en-US')).toBe(0);
    expect(NumberUtils.parseFloat('0.1', 'en-US')).toBe(0.1);
    expect(NumberUtils.parseFloat('1.1', 'en-US')).toBe(1.1);
    expect(NumberUtils.parseFloat('+1.1', 'en-US')).toBe(1.1);
    expect(NumberUtils.parseFloat('1000.51', 'en-US')).toBe(1_000.51);
    expect(NumberUtils.parseFloat('7111000.51', 'en-US')).toBe(7_111_000.51);
  });

  it('#parseFloat should return float when string contains thousands separators', () => {
    expect(NumberUtils.parseFloat('1,000.51', 'en-US')).toBe(1_000.51);
    expect(NumberUtils.parseFloat('7,111,000.51', 'en-US')).toBe(7_111_000.51);
  });

  it('#parseFloat should return undefined when string contains float with misplaced thousands separators', () => {
    expect(NumberUtils.parseFloat('-1,0,000.5', 'en-US')).toBeUndefined();
    expect(NumberUtils.parseFloat('1,0,000.5', 'en-US')).toBeUndefined();
  });

  it('#parseFloat should return float when string contains completable float', () => {
    expect(NumberUtils.parseFloat('-.1', 'en-US')).toBe(-0.1);
    expect(NumberUtils.parseFloat('.1', 'en-US')).toBe(0.1);
  });

  it('#removeThousandsSeparators should return unchanged string when no thousands separator is present', () => {
    expect(NumberUtils.removeThousandsSeparators('1000', 'en-US')).toBe('1000');
    expect(NumberUtils.removeThousandsSeparators('7111000.51', 'en-US')).toBe('7111000.51');
  });

  it('#removeThousandsSeparators should return string without thousands separators', () => {
    expect(NumberUtils.removeThousandsSeparators('1,000', 'en-US')).toBe('1000');
    expect(NumberUtils.removeThousandsSeparators('7,111,000.51', 'en-US')).toBe('7111000.51');
  });

  it('#countDecimals should return zero when number is missing', () => {
    expect(NumberUtils.countDecimals(null, 'en-US')).toBe(0);
    expect(NumberUtils.countDecimals(undefined, 'en-US')).toBe(0);
  });

  it('#countDecimals should return zero when argument is string', () => {
    const s: any = '12';
    expect(NumberUtils.countDecimals(<number>s, 'en-US')).toBe(0);
  });

  it('#countDecimals should return zero when argument is string', () => {
    const b: any = true;
    expect(NumberUtils.countDecimals(<number>b, 'en-US')).toBe(0);
  });

  it('#countDecimals should return zero when argument is object', () => {
    const o: any = { num: 12 };
    expect(NumberUtils.countDecimals(<number>o, 'en-US')).toBe(0);
  });

  it('#countDecimals should return zero when number has no decimals', () => {
    expect(NumberUtils.countDecimals(-84, 'en-US')).toBe(0);
    expect(NumberUtils.countDecimals(-1, 'en-US')).toBe(0);
    expect(NumberUtils.countDecimals(0, 'en-US')).toBe(0);
    expect(NumberUtils.countDecimals(1, 'en-US')).toBe(0);
    expect(NumberUtils.countDecimals(84, 'en-US')).toBe(0);
  });

  it('#countDecimals should return number of decimals when number has decimals', () => {
    expect(NumberUtils.countDecimals(-1000.1234, 'en-US')).toBe(4);
    expect(NumberUtils.countDecimals(-1.123, 'en-US')).toBe(3);
    expect(NumberUtils.countDecimals(-0.12, 'en-US')).toBe(2);
    expect(NumberUtils.countDecimals(0.12, 'en-US')).toBe(2);
    expect(NumberUtils.countDecimals(1.123, 'en-US')).toBe(3);
    expect(NumberUtils.countDecimals(1000.1234, 'en-US')).toBe(4);
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

  it('#rangeFloatArray should throw error when <last> ist less than <first>', () => {
    const errMsg = '<options.to> must not be less than <options.from>';
    expect(() => NumberUtils.rangeFloatArray(5, { from: 1, to: 0.5 })).toThrowError(errMsg);
  });

  it('#rangeFloatArray should return empty array when <count> is zero or less', () => {
    expect(NumberUtils.rangeFloatArray(-0)).toEqual([]);
    expect(NumberUtils.rangeFloatArray(0)).toEqual([]);
    expect(NumberUtils.rangeFloatArray(0, { from: 1.5, to: 4.5 })).toEqual([]);
  });

  it('#rangeFloatArray should return single value between <start> and <end> when <count> is 1', () => {
    expect(NumberUtils.rangeFloatArray(1)).toEqual([0.5]);
    expect(NumberUtils.rangeFloatArray(1, { from: 1.5, to: 4.5 })).toEqual([3]);
  });

  it('#rangeFloatArray should return 2 values', () => {
    expect(NumberUtils.rangeFloatArray(2)).toEqual([0, 1]);
    expect(NumberUtils.rangeFloatArray(2, { from: 1.12, to: 3.5 })).toEqual([1.12, 3.5]);
  });

  it('#rangeFloatArray should return multiple values', () => {
    let result = NumberUtils.rangeFloatArray(5);
    expect(result.map(n => Number(n.toFixed(2)))).toEqual([0, 0.25, 0.5, 0.75, 1]);

    result = NumberUtils.rangeFloatArray(6, { from: 1.1, to: 1.6 });
    expect(result.map(n => Number(n.toFixed(1)))).toEqual([1.1, 1.2, 1.3, 1.4, 1.5, 1.6]);
  });

  it('#intArray', () => {
    expect(NumberUtils.intArray(-3, 0)).toEqual([-3, -2, -1, 0]);
    expect(NumberUtils.intArray(-1, -1)).toEqual([-1]);
    expect(NumberUtils.intArray(0, 0)).toEqual([0]);
    expect(NumberUtils.intArray(1, 1)).toEqual([1]);
    expect(NumberUtils.intArray(0, 3)).toEqual([0, 1, 2, 3]);
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
      expect(NumberUtils.isNumberKey(event)).toBeTrue();
    }
  });

  it('#isNumberKey should return true when key is minus sign', () => {
    const event = new KeyboardEvent('keydown', { key: '-' });
    expect(NumberUtils.isNumberKey(event)).toBeTrue();
  });

  it('#isNumberKey should return true when key is local decimal separator', () => {
    const key = Number(1.1).toLocaleString().charAt(1);
    const event = new KeyboardEvent('keydown', { key });
    expect(NumberUtils.isNumberKey(event)).toBeTrue();
  });

  it('#isNumberKey should return false when no-number key', () => {
    for (const key of ['a', 'A', ' ', '_', '?', '/', '=', '*', '%', '&']) {
      const event = new KeyboardEvent('keydown', { key: key });
      expect(NumberUtils.isNumberKey(event)).toBeFalsy('for key ' + key);
    }
  });
});
