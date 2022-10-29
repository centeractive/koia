import { Column, DataType } from 'app/shared/model';
import { DataPoint, ChartContext, CategoryData, LabeledValues } from 'app/shared/model/chart';
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
         if (!!name && !!value) {
            if (names.includes(name)) {
               this.throwNonUniqueValueError(nameColumn, name);
            }
            names.push(name);
            data.push({ x: name, y: value });
         }
      }
      return data;
   }

   static categoryData(context: ChartContext): CategoryData {
      const nameColumn = context.groupByColumns[0];
      const labels: any[] = [];
      const labeledValues: LabeledValues[] = [];
      context.entries.forEach(e => {
         const label = e[nameColumn.name];
         if (!!label) {
            if (labels.includes(label)) {
               this.throwNonUniqueValueError(nameColumn, label);
            }
            const someValueFound = context.dataColumns
               .map(c => e[c.name])
               .some(v => v !== null && v != undefined);
            if (someValueFound) {
               context.dataColumns.forEach((c, iCol) => {
                  if (!labeledValues[iCol]) {
                     labeledValues.push({ label: c.name, values: [] });
                  }
                  labeledValues[iCol].values.push(e[c.name]);
               });
               labels.push(label);
            }
         }
      });
      return { labels: labels, dataSets: labeledValues };
   }

   private static throwNonUniqueValueError(column: Column, value: any): void {
      if (column.dataType == DataType.TIME) {
         value = DateTimeUtils.formatTime(value, column.groupingTimeUnit);
      }
      throw new Error('Value \'' + value + '\' is not unique');
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
