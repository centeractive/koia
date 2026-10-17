import { LanguageService } from '../../language';
import * as XLSX from '@e965/xlsx';
import { Attribute, DataType } from 'app/shared/model';
import { DataHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { Sample } from '../sample.type';
import { SourceName } from '../source-name.enum';

export class ExcelReader implements DataReader {

   private attrSheetName = new Attribute('scene.reader.excelSheetName', 'scene.reader.excelSheetNameDescription', DataType.TEXT, '');

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

   furnishAttributes(dataHeader: string): Attribute[] {
      return [this.attrSheetName];
   }

   readSample(file: File, entriesCount: number): Promise<Sample> {
      return new Promise<Sample>((resolve, reject) => {
         this.readEntries(file, entriesCount + 1)
            .then(entries => resolve({ entries: entries }))
            .catch(err => reject(err));
      });
   }

   readData(file: File, chunkSize: number, dataHandler: DataHandler): void {
      this.readEntries(file, Number.MAX_SAFE_INTEGER)
         .then(entries => {
            dataHandler.onEntries(entries);
            dataHandler.onComplete();
         })
         .catch(err => dataHandler.onError(err));
   }

   readEntries(file: File, rowCount: number): Promise<object[]> {
      const url = URL.createObjectURL(file);
      return new Promise<object[]>((resolve, reject) => {
         return fetch(url)
            .then(r => r.blob())
            .then(b => this.read(b))
            .then(data => {
               const workbook = XLSX.read(data, this.parsingOptions(rowCount));
               const sheetName = this.identifySheetName(workbook);
               const sheet = workbook.Sheets[sheetName];
               if (!sheet) {
                  reject(LanguageService.instant('scene.reader.worksheetMissing', { sheet: sheetName }));
               }
               resolve(XLSX.utils.sheet_to_json(sheet));
            });
      });
   }

   private parsingOptions(rowCount: number): XLSX.ParsingOptions {
      return {
         type: 'binary',
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

   private read(blob: Blob): Promise<any> {
      return new Promise<string>((resolve, reject) => {
         const reader = new FileReader();
         reader.onloadend = e => resolve((<any>e.target).result);
         reader.onerror = e => reject(e);
         reader.readAsBinaryString(blob);
      });
   }
}
