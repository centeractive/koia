/**
 * accesses objects keyed by user data (e.g. column names), whose keys may equal names of Object.prototype members
 */
export class ObjectUtils {

  /**
   * @returns the value of the object's own property of the specified name, undefined when it has none; unlike object[name]
   * never an inherited member such as Object.prototype.constructor for the name 'constructor'
   */
  static ownValue<T = unknown>(object: object, name: string): T | undefined {
    return Object.hasOwn(object, name) ? object[name] as T : undefined;
  }

  /**
   * @returns whether object[name] returns an Object.prototype member for an object lacking an own property of that name, e.g. for
   * 'constructor', 'toString' or '__proto__'
   */
  static isPrototypeMemberName(name: string): boolean {
    return name in Object.prototype;
  }

  /**
   * @returns the rows, where each row lacking an own property of a name of an Object.prototype member among the specified names
   * becomes a shallow copy without prototype, in which libraries reading row[name] (e.g. PivotTable.js, Papa Parse) find no
   * inherited member; the same array if none of the names is such a name
   */
  static withoutInheritedValues<T extends object>(rows: T[], names: string[]): T[] {
    const memberNames = names.filter(name => ObjectUtils.isPrototypeMemberName(name));
    if (memberNames.length === 0) {
      return rows;
    }
    return rows.map(row => memberNames.every(name => Object.hasOwn(row, name)) ? row : Object.assign(Object.create(null), row));
  }
}
