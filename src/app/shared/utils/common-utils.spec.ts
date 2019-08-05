import { CommonUtils } from './common-utils';
import { DataType, Column, TimeUnit } from '../model';

describe('CommonUtils', () => {

  it('#abbreviate should return same when null or undefined', () => {
    expect(CommonUtils.abbreviate(null, 10)).toBeNull();
    expect(CommonUtils.abbreviate(undefined, 10)).toBeUndefined();
  });

  it('#abbreviate should return same string when max width is not exceeded', () => {
    expect(CommonUtils.abbreviate('', 10)).toBe('');
    expect(CommonUtils.abbreviate('a', 10)).toBe('a');
    expect(CommonUtils.abbreviate('0123456789', 10)).toBe('0123456789');
  });

  it('#abbreviate should return abbreviated string when max width is exceeded', () => {
    expect(CommonUtils.abbreviate('0123456789X', 10)).toBe('0123456...');
    expect(CommonUtils.abbreviate('0123456789XY', 10)).toBe('0123456...');
    expect(CommonUtils.abbreviate('0123456789XYZ', 10)).toBe('0123456...');
    expect(CommonUtils.abbreviate('whenever a text exceeds max length', 26)).toBe('whenever a text exceeds...');
  });

  it('#encodeURL should return unchanged string when null or undefined', () => {
    expect(CommonUtils.encodeURL(null)).toBeNull();
    expect(CommonUtils.encodeURL(undefined)).toBeUndefined();
  });

  it('#encodeURL should escape backslash', () => {

    // when
    const url = CommonUtils.encodeURL('/rawdata?q=\\');

    // then
    expect(url).toEqual('/rawdata?q=%5C');
  });

  it('#extractBaseURL should return unchanged URL when it has no query', () => {

    // when
    const url = CommonUtils.extractBaseURL('/rawdata');

    // then
    expect(url).toEqual('/rawdata');
  });

  it('#extractBaseURL should return base URL it has a query', () => {

    // when
    const url = CommonUtils.extractBaseURL('/rawdata?q=\\');

    // then
    expect(url).toEqual('/rawdata');
  });

  it('#encodeURL should escape #', () => {

    // when
    const url = CommonUtils.encodeURL('/rawdata?q=#');

    // then
    expect(url).toEqual('/rawdata?q=%23');
  });

  it('#capitalize should return string when EMPTY', () => {
    expect(CommonUtils.capitalize('')).toEqual('');
  });

  it('#capitalize should return null when null', () => {
    expect(CommonUtils.capitalize(null)).toBeNull();
  });

  it('#capitalize should return capitalized string', () => {
    expect(CommonUtils.capitalize('x')).toEqual('X');
    expect(CommonUtils.capitalize('test')).toEqual('Test');
  });

  it('#capitalize should return unchanged string when starting with uppercase', () => {
    expect(CommonUtils.capitalize('X')).toEqual('X');
    expect(CommonUtils.capitalize('Test')).toEqual('Test');
  });

  it('#compare should return false when one object is null or undefined', () => {
    expect(CommonUtils.compare(null, {})).toBeFalsy();
    expect(CommonUtils.compare(undefined, {})).toBeFalsy();
    expect(CommonUtils.compare({}, null)).toBeFalsy();
    expect(CommonUtils.compare({}, undefined)).toBeFalsy();
    expect(CommonUtils.compare(null, { a: 1 })).toBeFalsy();
    expect(CommonUtils.compare(undefined, { a: 1 })).toBeFalsy();
    expect(CommonUtils.compare({ a: 1 }, null)).toBeFalsy();
    expect(CommonUtils.compare({ a: 1 }, undefined)).toBeFalsy();
  });

  it('#compare should return true when both objects are null or undefined', () => {
    expect(CommonUtils.compare(null, null)).toBeTruthy();
    expect(CommonUtils.compare(undefined, undefined)).toBeTruthy();
    expect(CommonUtils.compare(undefined, null)).toBeTruthy();
    expect(CommonUtils.compare(null, undefined)).toBeTruthy();
  });

  it('#compare should return true when both objects are same', () => {
    const obj = { x: { y: 1, z: 'a' } };
    expect(CommonUtils.compare(obj, obj)).toBeTruthy();
  });

  it('#compare should return true when both objects are empty', () => {
    expect(CommonUtils.compare({}, {})).toBeTruthy();
  });

  it('#compare should return true when both objects are equal', () => {
    expect(CommonUtils.compare({ a: 1 }, { a: 1 })).toBeTruthy();
    expect(CommonUtils.compare({ x: { y: 1, z: 'a' } }, { x: { y: 1, z: 'a' } })).toBeTruthy();
  });

  it('#clone should return null when value is null', () => {
    expect(CommonUtils.clone(null)).toBeNull();
  });

  it('#clone should return undefined when value is undefined', () => {
    expect(CommonUtils.clone(null)).toBeNull();
  });

  it('#clone should return value when value is boolean', () => {
    const b = true;
    const clone = CommonUtils.clone(b);

    expect(clone).toBe(b);
  });

  it('#clone should return value when value is number', () => {
    const num = 12;
    const clone = CommonUtils.clone(num);

    expect(clone).toBe(num);
  });

  it('#clone should return value when value is string', () => {
    const string = 'text';
    const clone = CommonUtils.clone(string);

    expect(clone).toBe(string);
  });

  it('#clone should return clone when value is object', () => {
    const object = { x: 'a', y: 'b', z: 1 };
    const clone = CommonUtils.clone(object);

    expect(clone).not.toBe(object);
    expect(clone).toEqual(object);
  });

  it('#clone should return clone when value is array', () => {
    const array = ['a', 'b', 1];
    const clone = CommonUtils.clone(array);

    expect(clone).not.toBe(array);
    expect(clone).toEqual(array);
  });

  it('#labelOf should return column name when text column', () => {
    const column: Column = { name: 'A', dataType: DataType.TEXT, width: 100 };
    const label = CommonUtils.labelOf(column, undefined);

    expect(label).toBe('A');
  });

  it('#labelOf should return column name when number column', () => {
    const column: Column = { name: 'A', dataType: DataType.NUMBER, width: 100 };
    const label = CommonUtils.labelOf(column, undefined);

    expect(label).toBe('A');
  });

  it('#labelOf should return column name when boolean column', () => {
    const column: Column = { name: 'A', dataType: DataType.BOOLEAN, width: 100 };
    const label = CommonUtils.labelOf(column, undefined);

    expect(label).toBe('A');
  });

  it('#labelOf should return column name when time column but time unit null', () => {
    const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
    const label = CommonUtils.labelOf(column, null);

    expect(label).toBe('A');
  });

  it('#labelOf should return column name when time column but time unit undefined', () => {
    const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
    const label = CommonUtils.labelOf(column, undefined);

    expect(label).toBe('A');
  });

  it('#labelOf should return column name when time column and time unit is millisecond', () => {
    const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
    const label = CommonUtils.labelOf(column, TimeUnit.MILLISECOND);

    expect(label).toBe('A');
  });

  it('#labelOf should return "<column name> (per <time unit>)" when time column and time unit are present', () => {
    const column: Column = { name: 'A', dataType: DataType.TIME, width: 100 };
    const label = CommonUtils.labelOf(column, TimeUnit.DAY);

    expect(label).toBe('A (per day)');
  });
});
