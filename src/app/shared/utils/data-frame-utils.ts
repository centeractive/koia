import { IDataFrame } from 'data-forge';

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
    return dataFrame.any(row => columnName in row);
  }
}
