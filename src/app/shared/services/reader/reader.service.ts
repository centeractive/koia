import { Injectable } from '@angular/core';
import { DataReader } from './data-reader.type';
import { CSVReader } from './csv/csv-reader';
import { JSONReader } from './json/json-reader';
import { ExcelReader } from './excel/excel-reader';

@Injectable({
  providedIn: 'root'
})
export class ReaderService {

  private readonly readers: DataReader[] = [
    new CSVReader(),
    new ExcelReader(),
    new JSONReader()
  ];

  getReaders(): DataReader[] {
    return this.readers;
  }

  readHeader(blob: Blob, bytesCount: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = e => resolve((<any>e.target).result);
      reader.onerror = e => reject(e);
      reader.readAsText(blob.slice(0, bytesCount));
    });
  }
}
