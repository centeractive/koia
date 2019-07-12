import { Attribute, DataType } from 'app/shared/model';
import * as Papa from 'papaparse';
import { DataReader } from '../data-reader.type';
import { DataHandler } from '../data-handler.type';
import { Sample } from '../sample.type';
import { DataTypeUtils } from 'app/shared/utils';

export class CSVReader implements DataReader {

   private static readonly SEPARATORS = [',', ';', ':', '\|'];
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

   expectsPlainTextData() {
      return true;
   }

   furnishAttributes(dataHeader: string): Attribute[] {
      if (dataHeader && dataHeader.length > 0) {
         this.attrSeparator.value = this.detectSeparator(dataHeader);
         if (this.attrSeparator.value) {
            this.attrHasHeaderColumn.value = this.detectHeaderColumn(dataHeader);
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

   private detectHeaderColumn(text: string): boolean {
      const lines = text.split('\n');
      if (lines.length > 1) {
         return this.includesTextValuesOnly(lines[0].split(this.attrSeparator.value));
      }
      return false;
   }

   private includesTextValuesOnly(values: string[]): boolean {
      return values
         .filter(v => v !== '')
         .map(v => DataTypeUtils.typeOf(v))
         .find(t => t !== DataType.TEXT) === undefined;
   }

   readSample(url: string, entriesCount: number): Promise<Sample> {
      return new Promise<Sample>((resolve, reject) => {
         const sample: Sample = { tableData: [] };
         Papa.parse(url, {
            header: false,
            download: true,
            delimiter: this.separator(),
            step: (result, parser) => {
               if (this.hasHeaderColumn() && !sample.columnNames) {
                  sample.columnNames = result.data[0];
               } else {
                  sample.tableData.push(result.data[0]);
               }
               if (sample.tableData.length === entriesCount) {
                  parser.abort();
               }
            },
            error: e => reject(e),
            complete: () => {
               resolve(sample);
            }
         });
      });
   }

   /**
    * TODO: must consider chunkSize
    */
   readData(url: string, chunkSize: number, dataHandler: DataHandler): void {
      let headerToBeRemoved = this.hasHeaderColumn();
      Papa.parse(url, {
         header: false,
         download: true,
         delimiter: this.separator(),
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
      return <boolean>this.attrHasHeaderColumn.value;
   }

   private separator(): string {
      return <string>this.attrSeparator.value;
   }
}
