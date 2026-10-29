import { LanguageService } from 'app/shared/services/language';
import { Column, ColumnPair, DataType } from 'app/shared/model';
import { DataTypeUtils, DateTimeUtils, StringUtils } from 'app/shared/utils';
import { PatternMasker } from 'app/shared/utils/pattern-masker';
import { CouchDBConstants } from 'app/shared/services/backend/couchdb/couchdb-constants';
import type { LogLevelColorizer } from 'app/shared/services/reader/log/log-level-colorizer';

/**
 * Maps data of different format to target entries and adds an "_id" attribute to each target entry.
 * Target entries are ready to be inserted as documents to CouchDB or PouchDB.
 *
 * - values are NOT written to target entries...
 *   - when they're [[null]] or [[undefined]]
 *   - when they're empty or contain whitespace only
 *   - when the target value of the specified data type cannot be created (parsed)
 * - pattern columns get the pattern of the source value (see [[PatternMasker]]), never an error
 * - the "_id" attribute starts at 1 and is incremented for each mapped target entry
 * - target entries are colored by their log level when a [[LogLevelColorizer]] is given
 * - the ID column (see [[IdColumn]]) gets 1 for the first target entry, incremented for each further one
 */
export class EntryMapper {

   private idPointer = CouchDBConstants.ENTRY_ID_BASE; // allows for default natural sorting in CouchDB
   private storedCount = 0;

   constructor(private columnMapping: ColumnPair[], private locale: string, private colorizer?: LogLevelColorizer) { }

   mapRows(rows: string[][], sourceColumnNames: string[]): MappingResult[] {
      const valueIndexes = this.columnMapping.map(cp => sourceColumnNames.lastIndexOf(cp.source.name));
      let id = this.reserveIDs(rows.length);
      return this.sanitize(rows.map(row => this.mapRow(row, valueIndexes, ++id)));
   }

   mapObjects(sourceEntries: object[]): MappingResult[] {
      let id = this.reserveIDs(sourceEntries.length);
      return this.sanitize(sourceEntries.map(entry => this.mapObject(entry, ++id)));
   }

   private sanitize(mappingResults: MappingResult[]): MappingResult[] {
      mappingResults
         .filter(mr => Object.keys(mr.entry).length === 1) // contains _id attribute only
         .forEach(mr => mr.entry = undefined);
      const sanitized = mappingResults.filter(mr => mr.entry || mr.errors.length > 0);
      this.numberEntries(sanitized);
      return sanitized;
   }

   private numberEntries(mappingResults: MappingResult[]): void {
      const idColumn = this.columnMapping.find(cp => cp.sequence)?.target.name;
      if (idColumn) {
         mappingResults.filter(mr => mr.entry).forEach(mr => mr.entry[idColumn] = ++this.storedCount);
      }
   }

   private reserveIDs(count: number): number {
      const currId = this.idPointer;
      this.idPointer += count;
      return currId;
   }

   private mapObject(sourceEntry: object, id: number): MappingResult {
      const mappingResult = this.newMappingResult(id);
      this.columnMapping.filter(cp => !cp.skip && !cp.sequence).forEach(cp => {
         const sourceValue = sourceEntry[cp.source.name];
         this.mapValue(cp, sourceValue, mappingResult);
      });
      this.colorizer?.colorize(mappingResult.entry);
      return mappingResult;
   }

   private mapRow(values: string[], valueIndexes: number[], id: number): MappingResult {
      const mappingResult = this.newMappingResult(id);
      for (let i = 0; i < this.columnMapping.length; i++) {
         const columnPair = this.columnMapping[i];
         if (!columnPair.skip && !columnPair.sequence) {
            this.mapValue(columnPair, values[valueIndexes[i]], mappingResult);
         }
      }
      this.colorizer?.colorize(mappingResult.entry);
      return mappingResult;
   }

   private newMappingResult(id: number): MappingResult {
      return {
         entry: { _id: '' + id },
         errors: []
      };
   }

   private mapValue(columnPair: ColumnPair, sourceValue: string | number | boolean | object, mappingResult: MappingResult): void {
      if (columnPair.target.patternOf) {
         const pattern = PatternMasker.mask(sourceValue);
         if (pattern !== undefined) {
            mappingResult.entry[columnPair.target.name] = pattern;
         }
      } else if (!StringUtils.isBlank(sourceValue)) {
         if (sourceValue instanceof Date) {
            this.mapDate(sourceValue, columnPair, mappingResult);
         } else if ((columnPair.source.dataType === DataType.TEXT || columnPair.source.dataType === DataType.NUMBER)
            && columnPair.target.dataType === DataType.TIME) {
            this.mapToTime(sourceValue, columnPair, mappingResult);
         } else {
            const value = DataTypeUtils.toTypedValue(sourceValue, columnPair.target.dataType, this.locale);
            if (value == undefined) {
               mappingResult.errors.push(this.columnError(columnPair, LanguageService.instant('scene.mapping.cannotConvert',
                  { value: this.abbreviate(sourceValue), dataType: columnPair.target.dataType })));
            } else {
               mappingResult.entry[columnPair.target.name] = value;
            }
         }
      }
   }

   private mapDate(sourceValue: Date, columnPair: ColumnPair, mappingResult: MappingResult): void {
      if (columnPair.target.dataType === DataType.NUMBER || columnPair.target.dataType === DataType.TIME) {
         mappingResult.entry[columnPair.target.name] = sourceValue.getTime();
      } else {
         mappingResult.entry[columnPair.target.name] = sourceValue.toString();
      }
   }

   private mapToTime(sourceValue: string | number | boolean | object, columnPair: ColumnPair, mappingResult: MappingResult): void {
      try {
         const time = this.toTime(sourceValue, columnPair.source);
         mappingResult.entry[columnPair.target.name] = this.roundDownToTargetFormat(time, columnPair.target.format);
      } catch (e) {
         mappingResult.errors.push(this.columnError(columnPair, e.message));
      }
   }

   private columnError(columnPair: ColumnPair, error: string): string {
      return LanguageService.instant('scene.mapping.columnError', { column: columnPair.source.name, error });
   }

   /**
    * @returns the time of a number column value without source format as epoch milliseconds, of other values as parsed date/time
    */
   private toTime(value: string | number | boolean | object, source: Column): number {
      const time = source.dataType === DataType.NUMBER && !source.format ?
         DataTypeUtils.toTypedValue(value, DataType.TIME, this.locale) as number :
         this.parseDate(value.toString(), source.format)?.getTime();
      if (time === undefined || isNaN(new Date(time).getTime())) {
         throw new Error(source.format ?
            LanguageService.instant('scene.mapping.cannotConvertTimeWithFormat', { value: this.abbreviate(value), format: source.format }) :
            LanguageService.instant('scene.mapping.cannotConvertTime', { value: this.abbreviate(value) }));
      }
      return time;
   }

   private parseDate(value: string, format: string): Date {
      let date = DateTimeUtils.parseDate(value, format, this.locale);
      if (!date && format) {
         date = DateTimeUtils.parseDate(value, undefined);
      }
      return date;
   }

   /**
    * @returns the down-rounded time, required for correct filtering
    *
    * @see [[TimeRangeFilter]]
    */
   private roundDownToTargetFormat(time: number, format: string): number {
      return DateTimeUtils.toBaseTime(time, DateTimeUtils.timeUnitFromNgFormat(format));
   }

   private abbreviate(value: string | number | boolean | object): string {
      if (typeof value !== 'string') {
         value = value.toString();
      }
      return StringUtils.abbreviate(value, 40);
   }
}

export interface MappingResult {
   entry: object;
   errors: string[];
}
