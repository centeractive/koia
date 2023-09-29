import { Attribute, DataType } from 'app/shared/model';
import * as XLSX from 'xlsx';
import { DataHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { Sample } from '../sample.type';

export class ExcelReader implements DataReader {

   private attrSheetName = new Attribute('Sheet Name', 'Name of Excel sheet that contains the data', DataType.TEXT, '');

   getDescription(): string {
      return 'Microsoft Excel is composed of one or several spreadsheets that contain data in tabular form.\n' +
         'It is expected that column names appear in the first row of the selected spreadsheet.';
   }

   getSourceName(): string {
      return 'Excel';
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
                  reject('Worksheet "' + sheetName + '" does not exist or cannot be parsed');
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
