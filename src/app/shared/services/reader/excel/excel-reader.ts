import { LanguageService } from '../../language';
import * as XLSX from '@e965/xlsx';
import { Attribute, DataType } from 'app/shared/model';
import { EntryHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { Sample } from '../sample.type';
import { SourceName } from '../source-name.enum';

export class ExcelReader implements DataReader {

   private attrSheetName = ExcelReader.createSheetNameAttribute();

   private static createSheetNameAttribute(): Attribute<string> {
      return new Attribute('scene.reader.excelSheetName', 'scene.reader.excelSheetNameDescription', DataType.TEXT, '');
   }

   getDescription(): string {
      return LanguageService.instant('scene.reader.excelDescription');
   }

   getSourceName(): string {
      return SourceName.EXCEL;
   }

   getFileExtension(): string {
      return '.xlsx';
   }

   expectsPlainTextData(): boolean {
      return false;
   }

   furnishAttributes(): Attribute[] {
      this.attrSheetName = ExcelReader.createSheetNameAttribute();
      return [this.attrSheetName];
   }

   readSample(file: File, entriesCount: number): Promise<Sample> {
      return new Promise<Sample>((resolve, reject) => {
         this.readEntries(file, entriesCount + 1)
            .then(entries => resolve({ entries: entries }))
            .catch(err => reject(err));
      });
   }

   readData(file: File, chunkSize: number, dataHandler: EntryHandler): void {
      this.readEntries(file, Number.MAX_SAFE_INTEGER)
         .then(entries => {
            dataHandler.onEntries(entries);
            dataHandler.onComplete();
         })
         .catch(err => dataHandler.onError(err));
   }

   async readEntries(file: File, rowCount: number): Promise<object[]> {
      const workbook = XLSX.read(await file.arrayBuffer(), this.parsingOptions(rowCount));
      const sheetName = this.identifySheetName(workbook);
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) {
         throw LanguageService.instant('scene.reader.worksheetMissing', { sheet: sheetName });
      }
      return XLSX.utils.sheet_to_json(sheet);
   }

   private parsingOptions(rowCount: number): XLSX.ParsingOptions {
      return {
         type: 'array',
         sheetRows: rowCount,
         cellDates: true,
         cellText: false,
         sheets: this.attrSheetName.value === '' ? 0 : this.attrSheetName.value
      };
   }

   private identifySheetName(workbook: XLSX.WorkBook): string {
      if (this.attrSheetName.value !== '') {
         return this.attrSheetName.value;
      }
      return workbook.SheetNames[0];
   }
}
