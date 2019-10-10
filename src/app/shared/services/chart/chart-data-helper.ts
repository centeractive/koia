import { Column, DataType } from 'app/shared/model';
import { DataPoint, ChartContext } from 'app/shared/model/chart';
import { DateTimeUtils, ArrayUtils } from 'app/shared/utils';

export class ChartDataHelper {

   /**
    * @returns an array of entries where the specified time column value is formatted if it contains a valid time.
    * entries that have no valid time are omitted, hence not contained in the result.
    */
   static convertTime(entries: Object[], timeColumn: Column): Object[] {
      const result: Object[] = [];
      entries.forEach(entry => {
         const date = DateTimeUtils.toBaseDate(entry[timeColumn.name], timeColumn.groupingTimeUnit);
         if (date) {
            const clone = Object.assign({}, entry);
            clone[timeColumn.name] = DateTimeUtils.formatTime(date.getTime(), timeColumn.groupingTimeUnit);
            result.push(clone);
         }
      });
      return result;
   }

   /**
    * @returns an array with [[DataPoint]]s for every distict value found in the selected column
    * of the entries (DataPoint.x = <value> and DataPoint.y = <count>)
    */
   static countDistinctValues(context: ChartContext): DataPoint[] {
      const data: DataPoint[] = [];
      for (const entry of context.entries) {
         const value = entry[context.dataColumns[0].name];
         if (value !== null && value !== undefined) {
            const nameValueObject = ArrayUtils.findObjectByKeyValue(data, 'x', value);
            if (nameValueObject == null) {
               data.push({ x: value, y: 1 });
            } else {
               nameValueObject['y'] += 1;
            }
         }
      }
      return data;
   }

   /**
    * @returns [[DataPoint]]s with the values of distinct names from [[context.entries]]. The names are extracted
    * from the unique group-by column, corresponding values from the unique data column. An error is thrown if the
    * names are notunique
    */
   static valuesOfDistinctNames(context: ChartContext): DataPoint[] {
      const nameColumn = context.groupByColumns[0];
      const dataColumn = context.dataColumns[0];
      const names = [];
      const data: DataPoint[] = [];
      for (const entry of context.entries) {
         const name = entry[nameColumn.name];
         const value = entry[dataColumn.name];
         if (name !== null && name !== undefined && value !== null && value !== undefined) {
            if (names.includes(name)) {
               throw new Error('Names are not unique');
            }
            names.push(name);
            data.push({ x: name, y: value });
         }
      }
      return data;
   }

   static extractGroupingValue(entry: Object, groupByColumn: Column): number {
      let value = entry[groupByColumn.name];
      if (groupByColumn.dataType === DataType.TIME && groupByColumn.groupingTimeUnit) {
         const date = DateTimeUtils.toBaseDate(value, groupByColumn.groupingTimeUnit);
         if (date) {
            value = date.getTime();
         }
      }
      return value;
   }

   /**
    * @returns the first [[DataPoint]] with an 'x' attribute matching the specified 'xValue'
    * or [[undefined]] if no matching [[DataPoint]] is found
    */
   static findDataPoint(datapoints: DataPoint[], xValue: any): DataPoint {
      return datapoints.find(dp => dp.x === xValue);
   }

   /**
    * sorts the specified [[DataPoint]]s ascending by their 'x' attribute
    */
   static sortAscending(values: DataPoint[]): void {
      ArrayUtils.sortObjects(values, { active: 'x', direction: 'asc' });
   }
}
