import { DataType, TimeUnit, ColumnPair } from 'app/shared/model';
import { DataTypeUtils, DateTimeUtils, NumberUtils } from 'app/shared/utils';

export class ColumnMappingGenerator {

   private static readonly MIN_WIDTH = 10;
   private static readonly MAX_WIDTH = 300;
   private static readonly MAX_TEXT_LENGTH_TO_BE_INDEXED = 100;
   private static readonly DATESTRING_MIN_EXPECTED_DIGITS = 2;

   /**
    * formats for date/time strings that cannot be parsed by default (keep [[undefined]] at first position)
    */
   private static readonly DATE_FORMATS_TO_TIMEUNITS: FormatToTimeUnit[] = [
      { format: undefined, timeUnit: undefined },
      { format: 'dd.MM.yyyy', timeUnit: TimeUnit.DAY },
      { format: 'dd.MM.yyyy HH:mm:ss', timeUnit: TimeUnit.SECOND },
      { format: 'dd.MM.yyyy HH:mm:ss SSS', timeUnit: TimeUnit.MILLISECOND },
      { format: 'yyyy-MM-dd HH:mm:ss,SSS', timeUnit: TimeUnit.MILLISECOND },
      { format: 'd MMM yyyy HH:mm:ss SSS', timeUnit: TimeUnit.MILLISECOND }
   ];

   generate(entries: Object[], locale: string): ColumnPair[] {
      if (!entries || entries.length === 0) {
         return [];
      }
      const columnNamesToPair = new Map<string, ColumnPair>();
      for (const entry of entries) {
         for (const key of Object.keys(entry)) {
            const column = columnNamesToPair.get(key);
            if (column) {
               this.refine(column, entry[key], locale);
            } else {
               columnNamesToPair.set(key, this.createColumnPair(key, entry[key], locale));
            }
         }
      }
      return this.extractColumnPairs(columnNamesToPair);
   }

   private createColumnPair(name: string, value: string | number | boolean, locale: string): ColumnPair {
      const dataType = this.guessDataTypeOf(value);
      const columnPair: ColumnPair = {
         source: { name: name, dataType: dataType, width: undefined },
         target: { name: name, dataType: dataType, width: this.computeWidth(value, dataType), indexed: this.shallBeIndexed(value) }
      };
      this.detectDateTime(columnPair, value, locale);
      return columnPair;
   }

   private refine(columnPair: ColumnPair, value: string | number | boolean, locale: string): void {
      const dataType = this.guessDataTypeOf(value);
      if (dataType === undefined) {
         return;
      } else if (columnPair.source.dataType === undefined) {
         columnPair.source.dataType = dataType;
         columnPair.target.dataType = dataType;
         this.detectDateTime(columnPair, value, locale);
      } else if (dataType === DataType.NUMBER && columnPair.source.dataType === DataType.TIME) {
         if (!NumberUtils.isInteger(value)) {
            this.downgrade(columnPair, DataType.NUMBER);
         }
      } else if (dataType !== columnPair.source.dataType) {
         this.downgrade(columnPair, DataType.TEXT);
      } else if (columnPair.target.dataType === DataType.TIME && columnPair.source.format === undefined) {
         this.refineDateTimeFormat(columnPair, value, locale);
      }
      columnPair.target.width = Math.max(columnPair.target.width, this.computeWidth(value, columnPair.target.dataType));
      if (columnPair.target.indexed && !this.shallBeIndexed(value)) {
         columnPair.target.indexed = false;
      }
   }

   private downgrade(columnPair: ColumnPair, dataType: DataType): void {
      columnPair.source.dataType = dataType;
      delete columnPair.source.format;
      columnPair.target.dataType = dataType;
      delete columnPair.target.format;
   }

   private detectDateTime(columnPair: ColumnPair, value: string | number | boolean, locale: string): void {
      if (columnPair.source.dataType === DataType.TEXT &&
         NumberUtils.countDigits(<string>value) >= ColumnMappingGenerator.DATESTRING_MIN_EXPECTED_DIGITS) {
         for (const formatToTimeUnit of ColumnMappingGenerator.DATE_FORMATS_TO_TIMEUNITS) {
            if (DateTimeUtils.parseDate(<string>value, formatToTimeUnit.format, locale)) {
               columnPair.source.format = formatToTimeUnit.format;
               columnPair.target.dataType = DataType.TIME;
               const timeUnit = formatToTimeUnit.timeUnit ? formatToTimeUnit.timeUnit :
                  this.detectTimeUnitFromColumnName(columnPair, 1, TimeUnit.MILLISECOND);
               columnPair.target.format = DateTimeUtils.ngFormatOf(timeUnit);
               return;
            }
         }
      } else if (columnPair.source.dataType === DataType.NUMBER) {
         const timeUnit = this.detectTimeUnitFromColumnName(columnPair, <number>value, undefined);
         if (timeUnit) {
            columnPair.source.dataType = DataType.TIME;
            columnPair.target.dataType = DataType.TIME;
            columnPair.target.format = DateTimeUtils.ngFormatOf(timeUnit);
         }
      }
   }

   private detectTimeUnitFromColumnName(columnPair: ColumnPair, value: number, defaultTimeUnit: TimeUnit): TimeUnit {
      if (Number.isInteger(value)) {
         const lowerCaseColName = columnPair.source.name.toLowerCase();
         if (lowerCaseColName.includes('time')) {
            return TimeUnit.MILLISECOND;
         } else if (lowerCaseColName.includes('second')) {
            return TimeUnit.SECOND;
         } else if (lowerCaseColName.includes('minute')) {
            return TimeUnit.MINUTE;
         } else if (lowerCaseColName.includes('hour')) {
            return TimeUnit.HOUR;
         } else if (lowerCaseColName.includes('month')) {
            return TimeUnit.MONTH;
         } else if (lowerCaseColName.includes('day') || lowerCaseColName.includes('date')) {
            return TimeUnit.DAY;
         } else if (lowerCaseColName.includes('year')) {
            return TimeUnit.YEAR;
         }
      }
      return defaultTimeUnit;
   }

   private guessDataTypeOf(value: string | number | boolean): DataType {
      return value === '' ? undefined : DataTypeUtils.typeOf(value);
   }

   private refineDateTimeFormat(columnPair: ColumnPair, value: string | number | boolean, locale: string): void {
      for (const formatToTimeUnit of ColumnMappingGenerator.DATE_FORMATS_TO_TIMEUNITS) {
         if (formatToTimeUnit.format && DateTimeUtils.parseDate(<string>value, formatToTimeUnit.format, locale)) {
            columnPair.source.format = formatToTimeUnit.format;
            break;
         }
      }
   }

   private shallBeIndexed(value: string | number | boolean): boolean {
      if (value === null || value === undefined) {
         return true;
      }
      return typeof value !== 'string' || (<string>value).length <= ColumnMappingGenerator.MAX_TEXT_LENGTH_TO_BE_INDEXED
   }

   private computeWidth(value: string | number | boolean, dataType: DataType): number {
      let width = ColumnMappingGenerator.MIN_WIDTH;
      if (value && dataType !== DataType.BOOLEAN) {
         if (value.toString().length > width) {
            width = Math.min(value.toString().length, ColumnMappingGenerator.MAX_WIDTH);
         }
      }
      return width;
   }

   private extractColumnPairs(columnNamesToPair: Map<string, ColumnPair>) {
      const columnPairs = Array.from(columnNamesToPair.values());
      columnPairs.filter(cp => !cp.source.dataType).forEach(cp => {
         cp.source.dataType = DataType.TEXT;
         cp.target.dataType = DataType.TEXT;
      });
      return columnPairs;
   }
}

interface FormatToTimeUnit {
   format: string,
   timeUnit: TimeUnit
}
