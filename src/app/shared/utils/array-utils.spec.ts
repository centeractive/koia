import { ArrayUtils } from './array-utils';
import { ValueRange } from '../value-range/model/value-range.type';

describe('ArrayUtils', () => {

  it('#toStringArray should return empty array when string is missing', () => {
    expect(ArrayUtils.toStringArray(null)).toEqual([]);
    expect(ArrayUtils.toStringArray(undefined)).toEqual([]);
    expect(ArrayUtils.toStringArray('')).toEqual([]);
    expect(ArrayUtils.toStringArray(null, '|')).toEqual([]);
    expect(ArrayUtils.toStringArray(undefined, '|')).toEqual([]);
    expect(ArrayUtils.toStringArray('', '|')).toEqual([]);
  });

  it('#toStringArray should return array when string contain single value', () => {
    expect(ArrayUtils.toStringArray('abc')).toEqual(['abc']);
    expect(ArrayUtils.toStringArray('1')).toEqual(['1']);
    expect(ArrayUtils.toStringArray('abc', '|')).toEqual(['abc']);
    expect(ArrayUtils.toStringArray('1', '|')).toEqual(['1']);
  });

  it('#toStringArray should return array when string contain multiple values separated by default separator', () => {
    expect(ArrayUtils.toStringArray(' a;b  ;c')).toEqual(['a', 'b', 'c']);
    expect(ArrayUtils.toStringArray('1 ; 2 ; 3')).toEqual(['1', '2', '3']);
  });

  it('#toStringArray should return array when string contain multiple values separated by specific separator', () => {
    expect(ArrayUtils.toStringArray('a|b  |c', '|')).toEqual(['a', 'b', 'c']);
    expect(ArrayUtils.toStringArray('1 | 2 | 3', '|')).toEqual(['1', '2', '3']);
  });

  it('#toNumberArray should return empty array when string is missing', () => {
    expect(ArrayUtils.toNumberArray(null)).toEqual([]);
    expect(ArrayUtils.toNumberArray(undefined)).toEqual([]);
    expect(ArrayUtils.toNumberArray('')).toEqual([]);
    expect(ArrayUtils.toNumberArray(null, '|')).toEqual([]);
    expect(ArrayUtils.toNumberArray(undefined, '|')).toEqual([]);
    expect(ArrayUtils.toNumberArray('', '|')).toEqual([]);
  });

  it('#toNumberArray should return array when string contain single value', () => {
    expect(ArrayUtils.toNumberArray('-1')).toEqual([-1]);
    expect(ArrayUtils.toNumberArray((-0.1).toLocaleString())).toEqual([-0.1]);
    expect(ArrayUtils.toNumberArray('0')).toEqual([0]);
    expect(ArrayUtils.toNumberArray((0.1).toLocaleString())).toEqual([0.1]);
    expect(ArrayUtils.toNumberArray('1')).toEqual([1]);
    expect(ArrayUtils.toNumberArray('-1', '|')).toEqual([-1]);
    expect(ArrayUtils.toNumberArray((-0.1).toLocaleString(), '|')).toEqual([-0.1]);
    expect(ArrayUtils.toNumberArray('0', '|')).toEqual([0]);
    expect(ArrayUtils.toNumberArray((0.1).toLocaleString(), '|')).toEqual([0.1]);
    expect(ArrayUtils.toNumberArray('1', '|')).toEqual([1]);
  });

  it('#toNumberArray should return array when string contain multiple values separated by default separator', () => {
    expect(ArrayUtils.toNumberArray('-1;  0; 1')).toEqual([-1, 0, 1]);
  });

  it('#toNumberArray should return array when string contain multiple values separated by specific separator', () => {
    expect(ArrayUtils.toNumberArray(' -1|  0| 1', '|')).toEqual([-1, 0, 1]);
  });

  it('#toNumberArray should return array when string contain multiple values separated by default separator', () => {
    expect(() => ArrayUtils.toNumberArray('1;x')).toThrowError('\'x\' is not a number');
  });

  it('#toNumberArray should return array when string contain multiple values separated by specific separator', () => {
    expect(() => ArrayUtils.toNumberArray('1*x', '*')).toThrowError('\'x\' is not a number');
  });

  it('#toBooleanArray should return empty array when string is missing', () => {
    expect(ArrayUtils.toBooleanArray(null)).toEqual([]);
    expect(ArrayUtils.toBooleanArray(undefined)).toEqual([]);
    expect(ArrayUtils.toBooleanArray('')).toEqual([]);
    expect(ArrayUtils.toBooleanArray(null, '|')).toEqual([]);
    expect(ArrayUtils.toBooleanArray(undefined, '|')).toEqual([]);
    expect(ArrayUtils.toBooleanArray('', '|')).toEqual([]);
  });

  it('#toBooleanArray should return array when string contain single value', () => {
    expect(ArrayUtils.toBooleanArray('true')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('false')).toEqual([false]);
    expect(ArrayUtils.toBooleanArray('yes')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('no')).toEqual([false]);
    expect(ArrayUtils.toBooleanArray('1')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('0')).toEqual([false]);
    expect(ArrayUtils.toBooleanArray('ok')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('true', '|')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('false', '|')).toEqual([false]);
    expect(ArrayUtils.toBooleanArray('yes', '|')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('no', '|')).toEqual([false]);
    expect(ArrayUtils.toBooleanArray('1', '|')).toEqual([true]);
    expect(ArrayUtils.toBooleanArray('0', '|')).toEqual([false]);
    expect(ArrayUtils.toBooleanArray('ok', '|')).toEqual([true]);
  });

  it('#toBooleanArray should return array when string contain multiple values separated by default separator', () => {
    expect(ArrayUtils.toBooleanArray('yes;  NO; 1; TRUE ')).toEqual([true, false, true, true]);
  });

  it('#toBooleanArray should return array when string contain multiple values separated by specific separator', () => {
    expect(ArrayUtils.toBooleanArray('  YES|  0 |1| true', '|')).toEqual([true, false, true, true]);
  });

  it('#distinctValues should return same when array is missing', () => {
    expect(ArrayUtils.distinctValues(null)).toBeNull();
    expect(ArrayUtils.distinctValues(undefined)).toBeUndefined();
  });

  it('#distinctValues should return same when array is empty', () => {
    const array = [];
    expect(ArrayUtils.distinctValues(array)).toEqual(array);
    expect(ArrayUtils.distinctValues(array)).not.toBe(array);
  });

  it('#distinctValues should return distinct string values', () => {
    expect(ArrayUtils.distinctValues(['a', 'b', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
  });

  it('#distinctValues should return distinct string values', () => {
    expect(ArrayUtils.distinctValues([1, 2, 1, 2, 3])).toEqual([1, 2, 3]);
  });

  it('#compare should return false when arrays are different', () => {
    expect(ArrayUtils.compare([], [''])).toBeFalsy();
    expect(ArrayUtils.compare([1, 5], ['1', 5])).toBeFalsy();
    expect(ArrayUtils.compare(['a', 'b'], ['a', 'b', 'c'])).toBeFalsy();
  });

  it('#compare should return false when one array is null or undefined', () => {
    expect(ArrayUtils.compare(null, [])).toBeFalsy();
    expect(ArrayUtils.compare([], undefined)).toBeFalsy();
    expect(ArrayUtils.compare(null, [1])).toBeFalsy();
    expect(ArrayUtils.compare([1], undefined)).toBeFalsy();
  });

  it('#compare should return false when arrays are different', () => {
    expect(ArrayUtils.compare([], [''])).toBeFalsy();
    expect(ArrayUtils.compare([1, 5], ['1', 5])).toBeFalsy();
    expect(ArrayUtils.compare(['a', 'b'], ['a', 'b', 'c'])).toBeFalsy();
  });

  it('#compare should return true when arrays are both null or undefined', () => {
    expect(ArrayUtils.compare(null, null)).toBeTruthy();
    expect(ArrayUtils.compare(undefined, undefined)).toBeTruthy();
    expect(ArrayUtils.compare(undefined, null)).toBeTruthy();
    expect(ArrayUtils.compare(null, undefined)).toBeTruthy();
  });

  it('#compare should return true when arrays are identical', () => {
    expect(ArrayUtils.compare([], [])).toBeTruthy();
    expect(ArrayUtils.compare([1, 5], [1, 5])).toBeTruthy();
    expect(ArrayUtils.compare(['a', 'b'], ['a', 'b'])).toBeTruthy();
    expect(ArrayUtils.compare([{ a: 1, b: 2 }, { c: 3, d: 4 }], [{ a: 1, b: 2 }, { c: 3, d: 4 }])).toBeTruthy();
  });

  it('#compareLoose should return false when one array is null or undefined', () => {
    expect(ArrayUtils.compareLoose(null, [])).toBeFalsy();
    expect(ArrayUtils.compareLoose([], undefined)).toBeFalsy();
    expect(ArrayUtils.compareLoose(null, [1])).toBeFalsy();
    expect(ArrayUtils.compareLoose([1], undefined)).toBeFalsy();
  });

  it('#compareLoose should return true when arrays are both null or undefined', () => {
    expect(ArrayUtils.compareLoose(null, null)).toBeTruthy();
    expect(ArrayUtils.compareLoose(undefined, undefined)).toBeTruthy();
    expect(ArrayUtils.compareLoose(undefined, null)).toBeTruthy();
    expect(ArrayUtils.compareLoose(null, undefined)).toBeTruthy();
  });

  it('#compareLoose should return false when arrays do not contain equal elements', () => {
    expect(ArrayUtils.compareLoose([1, 2, 5], [5, 1])).toBeFalsy();
    expect(ArrayUtils.compareLoose(['b', 'a'], ['a', 'b', 'x'])).toBeFalsy();
    expect(ArrayUtils.compareLoose([{ a: 1, b: 2 }, { c: 3, d: 4 }], [{ e: 5 }, { c: 3, d: 4 }, { a: 1, b: 2 }])).toBeFalsy();
  });

  it('#compareLoose should return true when arrays are identical', () => {
    expect(ArrayUtils.compareLoose([], [])).toBeTruthy();
    expect(ArrayUtils.compareLoose([1, 5], [1, 5])).toBeTruthy();
    expect(ArrayUtils.compareLoose(['a', 'b'], ['a', 'b'])).toBeTruthy();
  });

  it('#compareLoose should return true when arrays contain equal elements', () => {
    expect(ArrayUtils.compareLoose([1, 5], [5, 1])).toBeTruthy();
    expect(ArrayUtils.compareLoose(['b', 'a'], ['a', 'b'])).toBeTruthy();
    expect(ArrayUtils.compareLoose([{ a: 1, b: 2 }, { c: 3, d: 4 }], [{ c: 3, d: 4 }, { a: 1, b: 2 }])).toBeTruthy();
  });

  it('#removeElement should not change array when element does not exists', () => {
    expect(ArrayUtils.removeElement([], 1)).toEqual([]);
    expect(ArrayUtils.removeElement([1, 5], '5')).toEqual([1, 5]);
    expect(ArrayUtils.removeElement(['a', 'b', 'c'], 'x')).toEqual(['a', 'b', 'c']);
  });

  it('#removeElement should remove element when element exists', () => {
    expect(ArrayUtils.removeElement([1, 5], 5)).toEqual([1]);
    expect(ArrayUtils.removeElement(['a', 'b', 'c'], 'a')).toEqual(['b', 'c']);
    expect(ArrayUtils.removeElement(['a', 'b', 'c'], 'b')).toEqual(['a', 'c']);
    expect(ArrayUtils.removeElement(['a', 'b', 'c'], 'c')).toEqual(['a', 'b']);
  });

  it('#removeElementAt should not change array when index does not exists', () => {
    expect(ArrayUtils.removeElementAt([], 1)).toEqual([]);
    expect(ArrayUtils.removeElementAt([0, 1], -1)).toEqual([0, 1]);
    expect(ArrayUtils.removeElementAt([1, 5], 10)).toEqual([1, 5]);
    expect(ArrayUtils.removeElementAt(['a', 'b', 'c'], 5)).toEqual(['a', 'b', 'c']);
  });

  it('#removeElementAt should remove element when index exists', () => {
    expect(ArrayUtils.removeElementAt([1, 5], 1)).toEqual([1]);
    expect(ArrayUtils.removeElementAt(['a', 'b', 'c'], 0)).toEqual(['b', 'c']);
    expect(ArrayUtils.removeElementAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c']);
    expect(ArrayUtils.removeElementAt(['a', 'b', 'c'], 2)).toEqual(['a', 'b']);
  });

  it('#replaceElement should replace element when element exists', () => {
    expect(ArrayUtils.replaceElement(['a', 'b', 'c'], 'a', 'x')).toEqual(['x', 'b', 'c']);
    expect(ArrayUtils.replaceElement(['a', 'b', 'c'], 'b', 'x')).toEqual(['a', 'x', 'c']);
    expect(ArrayUtils.replaceElement(['a', 'b', 'c'], 'c', 'x')).toEqual(['a', 'b', 'x']);
  });

  it('#move should insert undefined when no element exists at old index', () => {
    expect(ArrayUtils.move([1, 5], 2, 0)).toEqual([undefined, 1, 5]);
  });

  it('#move should insert undefined when new index is outside array', () => {
    expect(ArrayUtils.move([1, 5], 0, 2)).toEqual([5, undefined, 1]);
  });

  it('#move should fill with n undefined when new index is outside array', () => {
    expect(ArrayUtils.move([1, 5], 1, 4)).toEqual([1, undefined, undefined, undefined, 5]);
  });

  it('#move should append undefined when no number element exists at neither index', () => {
    expect(ArrayUtils.move([1, 5], 2, 2)).toEqual([1, 5, undefined]);
  });

  it('#move should append undefined when no text element exists at neither index', () => {
    expect(ArrayUtils.move(['a', 'b', 'c'], 8, 3)).toEqual(['a', 'b', 'c', undefined]);
  });

  it('#move should append n undefined when no element exists at neither index', () => {
    expect(ArrayUtils.move(['a', 'b', 'c'], 8, 5)).toEqual(['a', 'b', 'c', undefined, undefined, undefined]);
  });

  it('#move should not move element when indices of existing element are identical', () => {
    expect(ArrayUtils.move([1, 5], 0, 0)).toEqual([1, 5]);
    expect(ArrayUtils.move(['a', 'b', 'c'], 2, 2)).toEqual(['a', 'b', 'c']);
  });

  it('#move should move element when element exists', () => {
    expect(ArrayUtils.move([1, 5], 0, 1)).toEqual([5, 1]);
    expect(ArrayUtils.move(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);
    expect(ArrayUtils.move(['a', 'b', 'c'], 1, 0)).toEqual(['b', 'a', 'c']);
    expect(ArrayUtils.move(['a', 'b', 'c'], 2, 0)).toEqual(['c', 'a', 'b']);
  });

  it('#findObjectByKey should return null when no object contains key', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { a: 2, 10: 'y' },
      { a: 3, 10: 'z' }
    ]

    // when
    const object = ArrayUtils.findObjectByKey(array, 'b');

    // then
    expect(object).toBeNull();
  });

  it('#findObjectByKey should return object when first object contains key', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { a: 2, 10: 'y' },
      { a: 3, 10: 'z' }
    ]

    // when
    const object = ArrayUtils.findObjectByKey(array, 'a');

    // then
    expect(object).toBe(array[0]);
  });

  it('#findObjectByKey should return object when middle object contains key', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { b: 2, 10: 'y' },
      { c: 3, 10: 'z' }
    ]

    // when
    const object = ArrayUtils.findObjectByKey(array, 'b');

    // then
    expect(object).toBe(array[1]);
  });

  it('#findObjectByKey should return object when last object contains key', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { b: 2, 10: 'y' },
      { c: 3, 10: 'z' }
    ]

    // when
    const object = ArrayUtils.findObjectByKey(array, 'c');

    // then
    expect(object).toBe(array[2]);
  });

  it('#findObjectByKeyValue should return null when no object contains key', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { a: 2, 10: 'y' },
      { a: 3, 10: 'z' }
    ]

    // when
    const object = ArrayUtils.findObjectByKeyValue(array, 'b', '1');

    // then
    expect(object).toBeNull();
  });

  it('#findObjectByKeyValue should return null when no key matches value', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { a: 2, 10: 'y' },
      { a: 3, 10: 'z' }
    ]

    // when
    const object = ArrayUtils.findObjectByKeyValue(array, '10', 'w');

    // then
    expect(object).toBeNull();
  });

  it('#findObjectByKeyValue should return object that matches criteria', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { a: 2, 10: 'y' },
      { a: 3, 10: 'z' },
      { a: 4, 10: 'x' }
    ]

    // when
    const object = ArrayUtils.findObjectByKeyValue(array, 'a', 3);

    // then
    expect(object).toEqual({ a: 3, 10: 'z' });
  });

  it('#findObjectByKeyValue should return object that matches date value', () => {

    // given
    const now = new Date().getTime();
    const array = [
      { d: new Date(now), a: 'x' },
      { d: new Date(now + 1), a: 'y' },
      { d: new Date(now + 2), a: 'z' },
      { d: new Date(now + 3), a: 'x' }
    ]

    // when
    const object = ArrayUtils.findObjectByKeyValue(array, 'd', new Date(now + 2));

    // then
    expect(object).toEqual({ d: new Date(now + 2), a: 'z' });
  });

  it('#findObjectByKeyValue should return first object that matches criteria', () => {

    // given
    const array = [
      { a: 1, 10: 'x' },
      { a: 2, 10: 'y' },
      { a: 3, 10: 'z' },
      { a: 4, 10: 'x' }
    ]

    // when
    const object = ArrayUtils.findObjectByKeyValue(array, '10', 'x');

    // then
    expect(object).toEqual({ a: 1, 10: 'x' });
  });

  it('#sortObjects should return null when array is null', () => {
    expect(ArrayUtils.sortObjects(null, { active: 'X', direction: 'asc' })).toBeNull();
  });

  it('#sortObjects should return undefined when array is undefined', () => {
    expect(ArrayUtils.sortObjects(undefined, { active: 'X', direction: 'asc' })).toBeUndefined();
  });

  it('#sortObjects should return same when array is empty', () => {
    const emptyArray = [];
    expect(ArrayUtils.sortObjects(emptyArray, { active: 'X', direction: 'asc' })).toBe(emptyArray);
  });

  it('#sortObjects should return unchanged array when objects do not contain attribute', () => {

    // given
    const array = [
      { X: 3 },
      { X: 2 },
      { X: 1 },
    ];

    // when
    const acutal = ArrayUtils.sortObjects(array, { active: 'Unknown', direction: 'asc' })

    // then
    const expected = [
      { X: 3 },
      { X: 2 },
      { X: 1 },
    ];
    expect(acutal).toEqual(expected);
  });

  it('#sortObjects should return ascending sorted array', () => {

    // given
    const array = [
      { X: 3 },
      { X: 1 },
      { X: 2 },
    ];

    // when
    const acutal = ArrayUtils.sortObjects(array, { active: 'X', direction: 'asc' })

    // then
    const expected = [
      { X: 1 },
      { X: 2 },
      { X: 3 },
    ];
    expect(acutal).toEqual(expected);
  });

  it('#sortObjects should return descending sorted array', () => {

    // given
    const array = [
      { X: 3 },
      { X: 1 },
      { X: 2 },
    ];

    // when
    const acutal = ArrayUtils.sortObjects(array, { active: 'X', direction: 'desc' })

    // then
    const expected = [
      { X: 3 },
      { X: 2 },
      { X: 1 },
    ];
    expect(acutal).toEqual(expected);
  });

  it('#overallValueRange should return undefined value range when array is missing', () => {
    expect(ArrayUtils.overallValueRange(null)).toEqual({ min: undefined, max: undefined });
    expect(ArrayUtils.overallValueRange(undefined)).toEqual({ min: undefined, max: undefined });
  });

  it('#overallValueRange should return undefined value range when array is empty', () => {
    expect(ArrayUtils.overallValueRange([])).toEqual({ min: undefined, max: undefined });
  });

  it('#overallValueRange should return value range when array contains single element', () => {
    const valueRanges: ValueRange[] = [{ min: 1, max: 2 }];
    expect(ArrayUtils.overallValueRange(valueRanges)).toEqual({ min: 1, max: 2 });
  });

  it('#overallValueRange should return overall value range when array contains multiple elements', () => {
    const valueRanges: ValueRange[] = [
      { min: 1, max: 21.7 },
      { min: -1, max: 20 },
      { min: -16.5, max: 3.8 },
    ];
    expect(ArrayUtils.overallValueRange(valueRanges)).toEqual({ min: -16.5, max: 21.7 });
  });

  it('#overallValueRange should return overall value range when array contains undefined elements', () => {
    const valueRanges: ValueRange[] = [
      { min: 1, max: 21.7 },
      { min: undefined, max: undefined },
      { min: -1, max: 20 },
    ];
    expect(ArrayUtils.overallValueRange(valueRanges)).toEqual({ min: -1, max: 21.7 });
  });

  it('#numberValueRange should return undefined value range when array is missing', () => {
    expect(ArrayUtils.numberValueRange(null, 'X')).toEqual({ min: undefined, max: undefined });
    expect(ArrayUtils.numberValueRange(undefined, 'X')).toEqual({ min: undefined, max: undefined });
  });

  it('#numberValueRange should return undefined value range when array is empty', () => {
    expect(ArrayUtils.numberValueRange([], 'X')).toEqual({ min: undefined, max: undefined });
  });

  it('#numberValueRange should return undefined when attribute is not found', () => {

    // given
    const array = [{ A: 1 }, { A: 2 }, { A: 3 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: undefined, max: undefined });
  });

  it('#numberValueRange should return undefined when values are not numbers', () => {

    // given
    const array = [{ X: 'a' }, { X: 'b' }, { X: 'c' }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: undefined, max: undefined });
  });

  it('#numberValueRange should return undefined when values are not number type', () => {

    // given
    const array = [{ X: '1' }, { X: '2' }, { X: '3' }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: undefined, max: undefined });
  });

  it('#numberValueRange should return value range when single value is negative', () => {

    // given
    const array = [{ X: -1.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: -1.5, max: -1.5 });
  });

  it('#numberValueRange should return value range when single value is zero', () => {

    // given
    const array = [{ X: 0 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: 0, max: 0 });
  });

  it('#numberValueRange should return value range when single value is positive', () => {

    // given
    const array = [{ X: 1.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: 1.5, max: 1.5 });
  });

  it('#numberValueRange should return value range when all values are negative', () => {

    // given
    const array = [{ X: -1.5 }, { X: -0.5 }, { X: -2.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: -2.5, max: -0.5 });
  });

  it('#numberValueRange should return value range when all values are negative or zero', () => {

    // given
    const array = [{ X: -1.5 }, { X: 0 }, { X: -0.5 }, { X: -2.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: -2.5, max: 0 });
  });

  it('#numberValueRange should return value range when all values are zero or positive', () => {

    // given
    const array = [{ X: 1.5 }, { X: 0.5 }, { X: 0 }, { X: 2.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: 0, max: 2.5 });
  });

  it('#numberValueRange should return value range when all values are positive', () => {

    // given
    const array = [{ X: 1.5 }, { X: 0.5 }, { X: 2.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: 0.5, max: 2.5 });
  });

  it('#numberValueRange should return value range when all values are negative and positive', () => {

    // given
    const array = [{ X: 0 }, { X: -1.5 }, { X: 0.5 }, { X: 2.5 }];

    // when
    const valueRange = ArrayUtils.numberValueRange(array, 'X');

    // then
    expect(valueRange).toEqual({ min: -1.5, max: 2.5 });
  });

  it('#convertAllDateToTime should return same when array is missing', () => {
    expect(ArrayUtils.convertAllDateToTime(null)).toBeNull();
    expect(ArrayUtils.convertAllDateToTime(undefined)).toBeUndefined();
  });

  it('#convertAllDateToTime should return unchanged when array is empty', () => {

    // given
    const array = [];

    // when
    const actual = ArrayUtils.convertAllDateToTime(array);

    // then
    expect(actual).toBe(array);
    expect(actual).toEqual([]);
  });

  it('#convertAllDateToTime should return unchanged array when no date attribute is found', () => {

    // given
    const array = [
      { a: 'x', b: 1, c: true },
      { a: 'y', b: 2, c: false }
    ];
    const arrayString = JSON.stringify(array);

    // when
    const actual = ArrayUtils.convertAllDateToTime(array);

    // then
    expect(actual).toBe(array);
    expect(actual).toEqual(JSON.parse(arrayString));
  });

  it('#convertAllDateToTime should return changed array when date attributes are found', () => {

    // given
    const date = new Date();
    const array = [
      { a: 'x', b: 1, c: true, d: date },
      { a: 'y', d: date, b: 2, c: false }
    ];

    // when
    const actual = ArrayUtils.convertAllDateToTime(array);

    // then
    expect(actual).toBe(array);
    const expected = [
      { a: 'x', b: 1, c: true, d: date.getTime() },
      { a: 'y', d: date.getTime(), b: 2, c: false }
    ];
    expect(actual).toEqual(expected);
  });
});
