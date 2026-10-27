import { Injectable } from '@angular/core';
import { CSVReader } from './csv/csv-reader';
import { DataReader } from './data-reader.type';
import { ExcelReader } from './excel/excel-reader';
import { JSONReader } from './json/json-reader';
import { LogReader } from './log/log-reader';

@Injectable({
  providedIn: 'root'
})
export class ReaderService {

  private readonly readers: DataReader[] = [
    new CSVReader(),
    new ExcelReader(),
    new JSONReader(),
    new LogReader()
  ];

  getReaders(): DataReader[] {
    return this.readers;
  }

  readHeader(blob: Blob, bytesCount: number, encoding?: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = e => resolve(e.target.result as string);
      reader.onerror = e => reject(e);
      reader.readAsText(blob.slice(0, bytesCount), encoding);
    });
  }
}
