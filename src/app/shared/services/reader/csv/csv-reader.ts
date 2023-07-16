import { Attribute, DataType } from 'app/shared/model';
import { DataTypeUtils } from 'app/shared/utils';
import * as Papa from 'papaparse';
import { DataHandler } from '../data-handler.type';
import { DataReader } from '../data-reader.type';
import { Sample } from '../sample.type';

export class CSVReader implements DataReader {

   private static readonly SEPARATORS = [',', ';', ':', '|'];
   private attrHasHeaderColumn = new Attribute('First row contains column names', undefined, DataType.BOOLEAN, false);
   private attrSeparator = new Attribute('Separator', undefined, DataType.TEXT, undefined);

   getDescription(): string {
      return 'CSV (Comma Separated Values) is plain text of tabular form.\n' +
         'Each line represents a row and individual fields of these rows must be separated by the same character (i.e. comma).';
   }

   getSourceName(): string {
      return 'CSV';
   }

   getFileExtension(): string {
      return '.csv';
   }

   expectsPlainTextData(): boolean {
      return true;
   }

   furnishAttributes(dataHeader: string, locale: string): Attribute[] {
      if (dataHeader && dataHeader.length > 0) {
         this.attrSeparator.value = this.detectSeparator(dataHeader);
         if (this.attrSeparator.value) {
            this.attrHasHeaderColumn.value = this.detectHeaderColumn(dataHeader, locale);
         }
      }
      return [this.attrHasHeaderColumn, this.attrSeparator];
   }

   /**
    * TODO: Retain separator that occurs same number of time in each line
    */
   private detectSeparator(text: string): string {
      const lines = text.split('\n');
      let detected = undefined;
      let detectedCount = 0;
      for (const separator of CSVReader.SEPARATORS) {
         const count = lines[0].split(separator).length;
         if (count > detectedCount) {
            detected = separator;
            detectedCount = count;
         }
      }
      return detected;
   }

   private detectHeaderColumn(text: string, locale: string): boolean {
      const lines = text.split('\n');
      if (lines.length > 1) {
         return this.includesTextValuesOnly(lines[0].split(this.attrSeparator.value), locale);
      }
      return false;
   }

   private includesTextValuesOnly(values: string[], locale: string): boolean {
      return values
         .filter(v => v !== '')
         .map(v => DataTypeUtils.typeOf(v, locale))
         .find(t => t !== DataType.TEXT) === undefined;
   }

   readSample(file: File, entriesCount: number, encoding?: string): Promise<Sample> {
      return new Promise<Sample>((resolve, reject) => {
         const sample: Sample = { tableData: [] };
         Papa.parse(file, {
            encoding,
            header: false,
            download: true,
            delimiter: this.separator(),
            skipEmptyLines: true,
            step: (result, parser) => {
               if (this.hasHeaderColumn() && !sample.columnNames) {
                  sample.columnNames = result.data;
               } else {
                  sample.tableData.push(result.data);
               }
               if (sample.tableData.length === entriesCount) {
                  parser.abort();
               }
            },
            error: e => reject(e),
            complete: () => resolve(sample)
         });
      });
   }

   /** 
    * @param chunkSize this parameter is meant to be the number of entries but Papa seems to interpret is as number of bytes,
    * therefore we ignore it and let Papa use its default Papa.LocalChunkSize instead 
    */
   readData(file: File, chunkSize: number, dataHandler: DataHandler, encoding?: string): void {
      let headerToBeRemoved = this.hasHeaderColumn();
      Papa.parse(file, {
         encoding,
         header: false,
         download: true,
         delimiter: this.separator(),
         skipEmptyLines: true,
         chunk: (result, parser) => {
            if (dataHandler.isCanceled()) {
               parser.abort();
            } else {
               if (headerToBeRemoved) {
                  result.data.shift();
                  headerToBeRemoved = false;
               }
               dataHandler.onValues(result.data)
            }
         },
         error: e => dataHandler.onError(e),
         complete: () => dataHandler.onComplete()
      });
   }

   private hasHeaderColumn(): boolean {
      return this.attrHasHeaderColumn.value;
   }

   private separator(): string {
      return this.attrSeparator.value;
   }
}
