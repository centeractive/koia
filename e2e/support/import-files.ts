import { readFileSync } from 'fs';
import { basename, extname, resolve } from 'path';
import * as Papa from 'papaparse';
import * as XLSX from '@e965/xlsx';
import { DataType } from 'app/shared/model/data-type.enum';
import { SourceName } from 'app/shared/services/reader/source-name.enum';
import { E2E_DATA_DIR, jsonOf, SRC_DIR } from './paths';

export interface ImportFile {
   path: string;
   /** file name without extension, the generated scene name starts with it */
   name: string;
   sourceName: SourceName;
   columns: string[];
   rowCount: number;
   /** expected result of the column type detection */
   dataTypes: DataType[];
   /** CSV only, the expected detected separator */
   separator?: string;
}

export const ORDERS_CSV = csvFile(resolve(E2E_DATA_DIR, 'orders.csv'), [DataType.TEXT, DataType.NUMBER, DataType.TIME]);

export const READER_TEST_XLSX = excelFile(resolve(SRC_DIR, 'app/shared/services/reader/excel/test.xlsx'),
   [DataType.TEXT, DataType.NUMBER, DataType.BOOLEAN, DataType.TIME]);

export const DELIVERIES_JSON = jsonFile(resolve(E2E_DATA_DIR, 'deliveries.json'), [DataType.TEXT, DataType.NUMBER, DataType.TIME]);

export const IMPORT_FILES = [ORDERS_CSV, READER_TEST_XLSX, DELIVERIES_JSON];

export const LOG_LEVELS_JSON = jsonFile(resolve(E2E_DATA_DIR, 'log-levels.json'),
   [DataType.TIME, DataType.TEXT, DataType.TEXT, DataType.TEXT, DataType.TEXT]);

export const SEMICOLON_ORDERS_CSV = csvFile(resolve(E2E_DATA_DIR, 'orders-semicolon.csv'), [DataType.TEXT, DataType.NUMBER, DataType.TIME], ';');

export const MONTHLY_TWO_MEASURES_CSV = csvFile(resolve(E2E_DATA_DIR, 'monthly-two-measures.csv'), [DataType.TIME, DataType.NUMBER, DataType.NUMBER]);

function csvFile(path: string, dataTypes: DataType[], separator = ','): ImportFile {
   const [columns, ...rows] = Papa.parse<string[]>(readFileSync(path, 'utf-8'), { delimiter: separator, skipEmptyLines: true }).data;
   return { path, name: basename(path, extname(path)), sourceName: SourceName.CSV, columns, rowCount: rows.length, dataTypes, separator };
}

function jsonFile(path: string, dataTypes: DataType[]): ImportFile {
   return fileWithRows(path, SourceName.JSON, jsonOf<object[]>(path), dataTypes);
}

function excelFile(path: string, dataTypes: DataType[]): ImportFile {
   const workbook = XLSX.readFile(path);
   return fileWithRows(path, SourceName.EXCEL, XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]), dataTypes);
}

function fileWithRows(path: string, sourceName: SourceName, rows: object[], dataTypes: DataType[]): ImportFile {
   return { path, name: basename(path, extname(path)), sourceName, columns: Object.keys(rows[0]), rowCount: rows.length, dataTypes };
}
