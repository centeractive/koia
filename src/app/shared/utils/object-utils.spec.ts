import { ObjectUtils } from './object-utils';

describe('ObjectUtils', () => {

  it('#ownValue should return value of own property', () => {

    // given
    const object = { Level: 'a', Amount: 0 };

    // when
    const values = [ObjectUtils.ownValue(object, 'Level'), ObjectUtils.ownValue(object, 'Amount')];

    // then
    expect(values).toEqual(['a', 0]);
  });

  it('#ownValue should return undefined for names of Object.prototype members the object lacks', () => {

    // given
    const object = { Level: 'a' };

    // when
    const values = ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__'].map(n => ObjectUtils.ownValue(object, n));

    // then
    expect(values).toEqual([undefined, undefined, undefined, undefined, undefined]);
  });

  it('#isPrototypeMemberName should return true for names of all Object.prototype members including __proto__', () => {

    // given
    const names = Object.getOwnPropertyNames(Object.prototype);

    // when
    const result = names.map(n => ObjectUtils.isPrototypeMemberName(n));

    // then
    expect(names).toContain('__proto__');
    expect(result.every(r => r)).toBe(true);
  });

  it('#isPrototypeMemberName should return false for names of no Object.prototype member', () => {

    // given
    const names = ['Level', 'Constructor', 'prototype', 'length', 'name', ''];

    // when
    const result = names.map(n => ObjectUtils.isPrototypeMemberName(n));

    // then
    expect(result.some(r => r)).toBe(false);
  });

  it('#withoutInheritedValues should return same array when no name is name of Object.prototype member', () => {

    // given
    const rows = [{ a: 'x', b: 1 }];

    // when
    const result = ObjectUtils.withoutInheritedValues(rows, ['a', 'b']);

    // then
    expect(result).toBe(rows);
  });

  it('#withoutInheritedValues should keep same rows having own value of every name of Object.prototype member', () => {

    // given
    const rows = [{ a: 1, constructor: 'x', toString: 'y' }];

    // when
    const result = ObjectUtils.withoutInheritedValues(rows, ['a', 'constructor', 'toString']);

    // then
    expect(result).not.toBe(rows);
    expect(result[0]).toBe(rows[0]);
  });

  it('#withoutInheritedValues should copy rows lacking value of name of Object.prototype member into objects without prototype', () => {

    // given
    const rows: object[] = [{ a: 1, constructor: 'x' }, { a: 2 }];

    // when
    const result = ObjectUtils.withoutInheritedValues(rows, ['a', 'constructor']);

    // then
    expect(result[0]).toBe(rows[0]);
    expect(result[1]).not.toBe(rows[1]);
    expect(Object.getPrototypeOf(result[1])).toBeNull();
    expect(Object.entries(result[1])).toEqual([['a', 2]]);
    expect(result[1]['constructor']).toBeUndefined();
  });

  it('#withoutInheritedValues should copy rows lacking value of name __proto__ into objects without prototype', () => {

    // given
    const rows: object[] = [Object.fromEntries([['__proto__', 'p']]), { a: 1 }];

    // when
    const result = ObjectUtils.withoutInheritedValues(rows, ['__proto__', 'a']);

    // then
    expect(result[0]).toBe(rows[0]);
    expect(Object.getPrototypeOf(result[1])).toBeNull();
    expect(result[1]['__proto__']).toBeUndefined();
    expect(Object.entries(result[1])).toEqual([['a', 1]]);
  });
});
