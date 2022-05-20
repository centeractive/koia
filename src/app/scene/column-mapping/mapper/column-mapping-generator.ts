import { DataType, TimeUnit, ColumnPair } from 'app/shared/model';
import { DataTypeUtils, DateTimeUtils, NumberUtils } from 'app/shared/utils';
import { TimeUnitDetector } from './time-unit-detector';
import { TimeGuesser } from './time-guesser';
import { DatePipe } from '@angular/common';

export class ColumnMappingGenerator {

   static readonly COLUMN_NAME_MAX_LENGTH = 100;
   static readonly INCOMPATIBLE_DATA_TYPES = 'Column contains values of incompatible data types';

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


   private datePipe = new DatePipe('en-US');
   private timeUnitDetector = new TimeUnitDetector();
   private timeGuesser = new TimeGuesser();

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

   private createColumnPair(name: string, value: any, locale: string): ColumnPair {
      const dataType = this.guessDataTypeOf(value, locale);
      const columnPair: ColumnPair = {
         source: { name: name, dataType: dataType, width: undefined },
         target: { name: name, dataType: dataType, width: undefined, indexed: this.shallBeIndexed(value) }
      };
      this.sharpenMapping(dataType, columnPair, value, locale);
      columnPair.target.width = this.computeWidth(value, columnPair);
      return columnPair;
   }

   private refine(columnPair: ColumnPair, value: any, locale: string): void {
      const dataType = this.guessDataTypeOf(value, locale);
      if (dataType == undefined) {
         return;
      } else if (columnPair.source.dataType == undefined) {
         columnPair.source.dataType = dataType;
         columnPair.target.dataType = dataType;
         this.sharpenMapping(dataType, columnPair, value, locale);
      } else if (dataType === DataType.NUMBER && columnPair.source.dataType === DataType.TIME) {
         if (!NumberUtils.isInteger(value, locale)) {
            columnPair.warning = ColumnMappingGenerator.INCOMPATIBLE_DATA_TYPES;
            this.downgrade(columnPair, DataType.NUMBER);
         }
      } else if (dataType !== columnPair.source.dataType) {
         if (columnPair.source.dataType === DataType.TIME) {
            columnPair.warning = ColumnMappingGenerator.INCOMPATIBLE_DATA_TYPES;
         }
         this.downgrade(columnPair, DataType.TEXT);
      } else if (columnPair.target.dataType === DataType.TIME && columnPair.source.format == undefined) {
         this.refineDateTimeFormat(columnPair, value, locale);
      }
      columnPair.target.width = Math.max(columnPair.target.width, this.computeWidth(value, columnPair));
      if (columnPair.target.indexed && !this.shallBeIndexed(value)) {
         columnPair.target.indexed = false;
      }
   }

   private sharpenMapping(dataType: DataType, columnPair: ColumnPair, value: any, locale: string) {
      if (dataType === DataType.TIME) {
         columnPair.target.format = DateTimeUtils.ngFormatOf(TimeUnit.SECOND);
      } else if (dataType === DataType.NUMBER || dataType === DataType.TEXT) {
         this.detectDateTime(columnPair, <string | number>value, locale);
      }
   }

   private downgrade(columnPair: ColumnPair, dataType: DataType): void {
      columnPair.source.dataType = dataType;
      delete columnPair.source.format;
      columnPair.target.dataType = dataType;
      delete columnPair.target.format;
   }

   private detectDateTime(columnPair: ColumnPair, value: string | number, locale: string): void {
      if (columnPair.source.dataType === DataType.TEXT &&
         NumberUtils.countDigits(<string>value) >= ColumnMappingGenerator.DATESTRING_MIN_EXPECTED_DIGITS) {
         this.detectDateTimeFromString(columnPair, <string>value, locale);
      } else if (columnPair.source.dataType === DataType.NUMBER) {
         this.detectDateTimeFromNumber(columnPair, <number>value, locale);
      }
   }

   private detectDateTimeFromString(columnPair: ColumnPair, value: string, locale: string) {
      for (const formatToTimeUnit of ColumnMappingGenerator.DATE_FORMATS_TO_TIMEUNITS) {
         if (DateTimeUtils.parseDate(<string>value, formatToTimeUnit.format, locale)) {
            columnPair.source.format = formatToTimeUnit.format;
            columnPair.target.dataType = DataType.TIME;
            const timeUnit = formatToTimeUnit.timeUnit ? formatToTimeUnit.timeUnit :
               this.timeUnitDetector.fromColumnName(columnPair, 1, TimeUnit.MILLISECOND, locale);
            columnPair.target.format = DateTimeUtils.ngFormatOf(timeUnit);
            return;
         }
      }
   }

   private detectDateTimeFromNumber(columnPair: ColumnPair, value: number, locale: string) {
      if (this.timeGuesser.isAssumedlyTime(columnPair, value, locale)) {
         columnPair.source.dataType = DataType.TIME;
         columnPair.target.dataType = DataType.TIME;
      } else {
         const timeUnit = this.timeUnitDetector.fromColumnName(columnPair, value, undefined, locale);
         if (timeUnit) {
            columnPair.source.dataType = DataType.TIME;
            columnPair.target.dataType = DataType.TIME;
            columnPair.target.format = DateTimeUtils.ngFormatOf(timeUnit);
         }
      }
   }

   private guessDataTypeOf(value: any, locale: string): DataType {
      return value === '' ? undefined : DataTypeUtils.typeOf(value, locale);
   }

   private refineDateTimeFormat(columnPair: ColumnPair, value: any, locale: string): void {
      for (const formatToTimeUnit of ColumnMappingGenerator.DATE_FORMATS_TO_TIMEUNITS) {
         if (formatToTimeUnit.format && DateTimeUtils.parseDate(<string>value, formatToTimeUnit.format, locale)) {
            columnPair.source.format = formatToTimeUnit.format;
            break;
         }
      }
   }

   private shallBeIndexed(value: any): boolean {
      if (value == undefined) {
         return true;
      }
      if (typeof value === 'object') {
         value = JSON.stringify(value, undefined, '  ');
      }
      return typeof value !== 'string' || (<string>value).length <= ColumnMappingGenerator.MAX_TEXT_LENGTH_TO_BE_INDEXED;
   }

   private computeWidth(value: any, columnPair: ColumnPair): number {
      let width = ColumnMappingGenerator.MIN_WIDTH;
      if (value) {
         let formattedValue: string = null;
         if (value instanceof Date && columnPair.target.format) {
            formattedValue = this.datePipe.transform(<Date>value, columnPair.target.format);
         } else if (columnPair.target.dataType !== DataType.BOOLEAN && value.toString().length > width) {
            formattedValue = value.toString();
         }
         if (formattedValue) {
            width = Math.min(formattedValue.length, ColumnMappingGenerator.MAX_WIDTH);
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
