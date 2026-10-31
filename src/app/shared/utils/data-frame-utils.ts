import { IDataFrame, ISeries } from 'data-forge';
import { ObjectUtils } from './object-utils';

export class DataFrameUtils {

  /**
   * transforms the values of the specified column, unlike IDataFrame#transformSeries also when the column is missing in the first row
   */
  static transformColumn<I, R, V, T>(dataFrame: IDataFrame<I, R>, columnName: string, transformer: (value: V) => T): IDataFrame<I, R> {
    return dataFrame.withSeries<R, T>(columnName, dataFrame.getSeries<V>(columnName).select(transformer));
  }

  /**
   * unlike IDataFrame#hasSeries, considers all rows and not only the first one
   */
  static hasColumn<I, R extends object>(dataFrame: IDataFrame<I, R>, columnName: string): boolean {
    return dataFrame.any(row => Object.hasOwn(row, columnName));
  }

  /**
   * @returns the values of the column, undefined for rows lacking it; unlike IDataFrame#getSeries never an inherited member of
   * Object.prototype (e.g. for a column named 'constructor')
   */
  static columnValues<V>(dataFrame: IDataFrame<number, object>, columnName: string): ISeries<number, V> {
    return dataFrame.deflate(row => ObjectUtils.ownValue<V>(row, columnName));
  }

  /**
   * orders by the values of the selectors, empty values (null or undefined) first when ascending and last when descending
   *
   * @param selectors at least one
   */
  static orderBy<I, R>(dataFrame: IDataFrame<I, R>, selectors: Array<(row: R) => unknown>, direction: 'asc' | 'desc'): IDataFrame<I, R> {
    const [first, ...others] = selectors.flatMap(s => [(row: R) => s(row) == undefined ? 0 : 1, (row: R) => s(row) ?? undefined]);
    if (direction === 'asc') {
      return others.reduce((ordered, s) => ordered.thenBy(s), dataFrame.orderBy(first));
    }
    return others.reduce((ordered, s) => ordered.thenByDescending(s), dataFrame.orderByDescending(first));
  }
}
