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
    expect(CommonUtils.compare(null, {})).toBe(false);
    expect(CommonUtils.compare(undefined, {})).toBe(false);
    expect(CommonUtils.compare({}, null)).toBe(false);
    expect(CommonUtils.compare({}, undefined)).toBe(false);
    expect(CommonUtils.compare(null, { a: 1 })).toBe(false);
    expect(CommonUtils.compare(undefined, { a: 1 })).toBe(false);
    expect(CommonUtils.compare({ a: 1 }, null)).toBe(false);
    expect(CommonUtils.compare({ a: 1 }, undefined)).toBe(false);
  });

  it('#compare should return true when both objects are null or undefined', () => {
    expect(CommonUtils.compare(null, null)).toBe(true);
    expect(CommonUtils.compare(undefined, undefined)).toBe(true);
    expect(CommonUtils.compare(undefined, null)).toBe(true);
    expect(CommonUtils.compare(null, undefined)).toBe(true);
  });

  it('#compare should return true when both objects are same', () => {
    const obj = { x: { y: 1, z: 'a' } };
    expect(CommonUtils.compare(obj, obj)).toBe(true);
  });

  it('#compare should return true when both objects are empty', () => {
    expect(CommonUtils.compare({}, {})).toBe(true);
  });

  it('#compare should return true when both objects are equal', () => {
    expect(CommonUtils.compare({ a: 1 }, { a: 1 })).toBe(true);
    expect(CommonUtils.compare({ x: { y: 1, z: 'a' } }, { x: { y: 1, z: 'a' } })).toBe(true);
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

  it('#afterNextPaint should resolve in task following next animation frame', async () => {

    // given
    let frame: FrameRequestCallback;
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
      frame = cb;
      return 1;
    });
    let resolved = false;
    CommonUtils.afterNextPaint().then(() => resolved = true);

    // when
    frame(0);
    await Promise.resolve();

    // then
    expect(resolved).toBe(false);
    await CommonUtils.sleep(0);
    expect(resolved).toBe(true);
  });
});
