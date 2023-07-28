import { CommonUtils } from './common-utils';

describe('CommonUtils', () => {

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

  it('#compare should return false when one object is null or undefined', () => {
    expect(CommonUtils.compare(null, {})).toBeFalse();
    expect(CommonUtils.compare(undefined, {})).toBeFalse();
    expect(CommonUtils.compare({}, null)).toBeFalse();
    expect(CommonUtils.compare({}, undefined)).toBeFalse();
    expect(CommonUtils.compare(null, { a: 1 })).toBeFalse();
    expect(CommonUtils.compare(undefined, { a: 1 })).toBeFalse();
    expect(CommonUtils.compare({ a: 1 }, null)).toBeFalse();
    expect(CommonUtils.compare({ a: 1 }, undefined)).toBeFalse();
  });

  it('#compare should return true when both objects are null or undefined', () => {
    expect(CommonUtils.compare(null, null)).toBeTrue();
    expect(CommonUtils.compare(undefined, undefined)).toBeTrue();
    expect(CommonUtils.compare(undefined, null)).toBeTrue();
    expect(CommonUtils.compare(null, undefined)).toBeTrue();
  });

  it('#compare should return true when both objects are same', () => {
    const obj = { x: { y: 1, z: 'a' } };
    expect(CommonUtils.compare(obj, obj)).toBeTrue();
  });

  it('#compare should return true when both objects are empty', () => {
    expect(CommonUtils.compare({}, {})).toBeTrue();
  });

  it('#compare should return true when both objects are equal', () => {
    expect(CommonUtils.compare({ a: 1 }, { a: 1 })).toBeTrue();
    expect(CommonUtils.compare({ x: { y: 1, z: 'a' } }, { x: { y: 1, z: 'a' } })).toBeTrue();
  });

  it('#clone should return null when value is null', () => {
    expect(CommonUtils.clone(null)).toBeNull();
  });

  it('#clone should return undefined when value is undefined', () => {
    expect(CommonUtils.clone(undefined)).toBeUndefined();
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
    const s = 'text';
    const clone = CommonUtils.clone(s);

    expect(clone).toBe(s);
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
});
