import { Column, DataType } from 'app/shared/model';
import { CategoryData, ChartContext, DataPoint, LabeledValues } from 'app/shared/model/chart';
import { ArrayUtils, DateTimeUtils } from 'app/shared/utils';
import { LanguageService } from '../language/language.service';

export class ChartDataHelper {

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

   static categoryData(context: ChartContext): CategoryData {
      const nameColumn = context.groupByColumns[0];
      const labels: unknown[] = [];
      const labeledValues: LabeledValues[] = [];
      const nonUniqueName = this.findNonUniqueName(context.entries, nameColumn, context.dataColumns, (label, e) => {
         context.dataColumns.forEach((c, iCol) => {
            if (!labeledValues[iCol]) {
               labeledValues.push({ label: c.name, values: [] });
            }
            labeledValues[iCol].values.push(e[c.name]);
         });
         labels.push(label);
      });
      if (nonUniqueName !== undefined) {
         this.throwNonUniqueValueError(nameColumn, nonUniqueName);
      }
      return { labels: labels, dataSets: labeledValues };
   }

   /**
    * @returns the number of names or [[undefined]] if names are not unique
    */
   static uniqueNameCount(entries: object[], nameColumn: Column, dataColumns: Column[]): number {
      let count = 0;
      const nonUniqueName = this.findNonUniqueName(entries ?? [], nameColumn, dataColumns, () => count++);
      return nonUniqueName === undefined ? count : undefined;
   }

   /**
    * passes each entry with a name and at least one data value to the consumer
    *
    * @returns the first name that was already passed or [[undefined]] if all names are unique
    */
   private static findNonUniqueName(entries: object[], nameColumn: Column, dataColumns: Column[],
      consumer: (name: unknown, entry: object) => void): unknown {
      const names = new Set<unknown>();
      for (const entry of entries) {
         const name = entry[nameColumn.name];
         if (name !== null && name !== undefined && name !== '') {
            if (names.has(name)) {
               return name;
            }
            if (dataColumns.some(c => entry[c.name] !== null && entry[c.name] !== undefined)) {
               consumer(name, entry);
               names.add(name);
            }
         }
      }
      return undefined;
   }

   private static throwNonUniqueValueError(column: Column, value: unknown): void {
      if (column.dataType == DataType.TIME) {
         value = DateTimeUtils.formatTime(value as number, column.groupingTimeUnit);
      }
      throw new Error(LanguageService.instant('chart.error.valueNotUnique', { value }));
   }

   static extractGroupingValue(entry: object, groupByColumn: Column): number {
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
   static findDataPoint(datapoints: DataPoint[], xValue: number): DataPoint {
      return datapoints.find(dp => dp.x === xValue);
   }

   /**
    * sorts the specified [[DataPoint]]s ascending by their 'x' attribute
    */
   static sortAscending(values: DataPoint[]): void {
      ArrayUtils.sortObjects(values, { active: 'x', direction: 'asc' });
   }
}
