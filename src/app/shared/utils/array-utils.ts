import { Sort } from '@angular/material';
import { ValueRange } from '../model';
import { NumberUtils } from './number-utils';

export class ArrayUtils {

  private static readonly UNDEFINED_VALUE_RANGE = { min: undefined, max: undefined };

  /**
   * @returns a new array that contains only distinct values
   */
  static distinctValues(arr: any[]): any[] {
    if (!arr) {
      return arr;
    }
    return Array.from(new Set(arr));
  }

  /**
   * @returns <true> if the specified arrays are equals, <false> otherwise
   */
  static compare(arr1: any[], arr2: any[]): boolean {
    return JSON.stringify(arr1) === JSON.stringify(arr2);
  }

  /**
   * removes the specified element from given array
   *
   * @param array array
   * @param element element to be removed
   * @returns the changed array
   */
  static removeElement(array: any[], element: any): any[] {
    return this.removeElementAt(array, array.indexOf(element));
  }

  /**
   * removes the element at specified index from given array
   *
   * @param array array
   * @param index index of element to be removed
   * @returns the changed array
   */
  static removeElementAt(array: any[], index: number): any[] {
    if (index !== -1) {
      array.splice(index, 1);
    }
    return array;
  }

  /**
   * replaces oldElement with newElement in given array
   *
   * @returns the changed array
   */
  static replaceElement(array: any[], oldElement: any, newElement: any): any[] {
    const index = array.indexOf(oldElement);
    if (index !== -1) {
      array.splice(index, 1, newElement);
    }
    return array;
  }

  /**
   * moves an array element to a different position
   * - when old index is outside array, undefined is set to the new index
   * - when the new index exceeds the specified array, missing elements (gaps) will be filled with undefined
   *
   * @returns the changed array
   */
  static move(array: any[], oldIndex: number, newIndex: number): any[] {
    const element = array.splice(oldIndex, 1)[0];
    for (let i = array.length; i < newIndex; i++) {
      array.push(undefined);
    }
    array.splice(newIndex, 0, element);
    return array;
  };

  /**
   * @returns the first object where given key exists, [[null]] if no object is found
   */
  static findObjectByKey(array: Object[], key: string): Object {
    for (const obj of array) {
      if (obj[key]) {
        return obj;
      }
    }
    return null;
  }

  /**
   * @returns the first object where given key has the specified value, [[null]] if no object is found
   */
  static findObjectByKeyValue(array: Object[], key: string, value: any): Object {
    for (const obj of array) {
      const elementValue = obj[key];
      if (value instanceof Date) {
        if (elementValue.getTime() === value.getTime()) {
          return obj;
        }
      } else if (elementValue === value) {
        return obj;
      }
    }
    return null;
  }

  /**
   * sorts the objects in the specified array by given attribute value
   *
   * @returns the specified, sorted array
   */
  static sortObjects(array: Object[], sort: Sort): Object[] {
    if (!array || array.length === 0) {
      return array;
    }
    const comparator = (o1: Object, o2: Object) => {
      const v1 = o1[sort.active];
      const v2 = o2[sort.active];
      if (v1 === v2) {
        return 0;
      }
      const result = v1 < v2 ? -1 : 1;
      return sort.direction === 'asc' ? result : result * -1;
    };
    return array.sort(comparator);
  }

  static overallValueRange(valueRanges: ValueRange[]): ValueRange {
    return {
      min: ArrayUtils.numberValueRange(valueRanges, 'min').min,
      max: ArrayUtils.numberValueRange(valueRanges, 'max').max
    };
  }

  /**
   * @returns the value range of the specified number attribute
   */
  static numberValueRange(array: Object[], attributeName: string): ValueRange {
    if (!array || array.length === 0) {
      return ArrayUtils.UNDEFINED_VALUE_RANGE;
    }
    const numbers = array
      .map(o => o[attributeName])
      .filter(n => typeof n === 'number')
      .filter(n => NumberUtils.isNumber(n));
    if (numbers.length === 0) {
      return ArrayUtils.UNDEFINED_VALUE_RANGE;
    }
    const valueRange: ValueRange = { min: Number.MAX_VALUE, max: - Number.MAX_VALUE };
    numbers.forEach(n => {
      if (valueRange.max < n) {
        valueRange.max = n;
      }
      if (valueRange.min > n) {
        valueRange.min = n;
      }
    });
    return valueRange;
  }

  /**
   * converts all attribute values of type [[Date]] to a time number
   *
   * @returns the provided array
   */
  static convertAllDateToTime(array: Object[]): Object[] {
    if (array) {
      array.forEach(e => {
        for (const key of Object.keys(e)) {
          if (e[key] instanceof Date) {
            e[key] = (<Date>e[key]).getTime();
          }
        }
      });
    }
    return array;
  }
}
