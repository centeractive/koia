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

export const SALES_CSV = csvFile(resolve(E2E_DATA_DIR, 'sales.csv'),
   [DataType.TIME, DataType.TEXT, DataType.TEXT, DataType.TEXT, DataType.NUMBER, DataType.NUMBER, DataType.NUMBER]);

export const READER_TEST_XLSX = excelFile(resolve(SRC_DIR, 'app/shared/services/reader/excel/test.xlsx'),
   [DataType.TEXT, DataType.NUMBER, DataType.BOOLEAN, DataType.TIME]);

export const DELIVERIES_JSON = jsonFile(resolve(E2E_DATA_DIR, 'deliveries.json'), [DataType.TEXT, DataType.NUMBER, DataType.TIME]);

/** 30 logback entries, one of them with a stack trace of 3 lines */
export const SERVER_LOG = logFile(resolve(E2E_DATA_DIR, 'server.log'), ['Time', 'Thread', 'Level', 'Logger', 'Message'], 30,
   [DataType.TIME, DataType.TEXT, DataType.TEXT, DataType.TEXT, DataType.TEXT]);

/** 10 entries with ISO times that have an offset */
export const SERVER_ISO_LOG = logFile(resolve(E2E_DATA_DIR, 'server-iso.log'), ['Time', 'Level', 'Message'], 10,
   [DataType.TIME, DataType.TEXT, DataType.TEXT]);

export const IMPORT_FILES = [ORDERS_CSV, SALES_CSV, READER_TEST_XLSX, DELIVERIES_JSON, SERVER_LOG];

export const LOG_LEVELS_JSON = jsonFile(resolve(E2E_DATA_DIR, 'log-levels.json'),
   [DataType.TIME, DataType.TEXT, DataType.TEXT, DataType.TEXT, DataType.TEXT]);

/** 15 ERROR rows of one message pattern longer than 100 characters, 45 INFO rows of three other patterns */
export const LOG_MESSAGES_CSV = csvFile(resolve(E2E_DATA_DIR, 'app-messages.csv'), [DataType.TIME, DataType.TEXT, DataType.TEXT]);

/** the 60 entries of LOG_MESSAGES_CSV as logback log, each ERROR with a stack trace of 2 lines */
export const APP_MESSAGES_LOG = logFile(resolve(E2E_DATA_DIR, 'app-messages.log'), ['Time', 'Thread', 'Level', 'Logger', 'Message'], 60,
   [DataType.TIME, DataType.TEXT, DataType.TEXT, DataType.TEXT, DataType.TEXT]);

export const SEMICOLON_ORDERS_CSV = csvFile(resolve(E2E_DATA_DIR, 'orders-semicolon.csv'), [DataType.TEXT, DataType.NUMBER, DataType.TIME], ';');

export const ORDERS_WITH_ID_CSV = csvFile(resolve(E2E_DATA_DIR, 'orders-with-id.csv'), [DataType.NUMBER, DataType.TEXT, DataType.NUMBER]);

export const MONTHLY_TWO_MEASURES_CSV = csvFile(resolve(E2E_DATA_DIR, 'monthly-two-measures.csv'), [DataType.TIME, DataType.NUMBER, DataType.NUMBER]);

export const CODES_CSV = csvFile(resolve(E2E_DATA_DIR, 'codes.csv'), [DataType.TEXT, DataType.NUMBER, DataType.TEXT]);

export const DUPLICATE_HEADERS_CSV = csvFile(resolve(E2E_DATA_DIR, 'duplicate-headers.csv'),
   [DataType.TEXT, DataType.TEXT, DataType.TEXT, DataType.NUMBER]);

export const MIXED_DATES_CSV = csvFile(resolve(E2E_DATA_DIR, 'mixed-dates.csv'), [DataType.TEXT, DataType.TIME]);

export const EPOCH_MILLIS_CSV = csvFile(resolve(E2E_DATA_DIR, 'epoch-millis.csv'), [DataType.TEXT, DataType.NUMBER]);

export const MISSING_TIMES_CSV = csvFile(resolve(E2E_DATA_DIR, 'missing-times.csv'), [DataType.TEXT, DataType.TIME]);

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

function logFile(path: string, columns: string[], rowCount: number, dataTypes: DataType[]): ImportFile {
   return { path, name: basename(path, extname(path)), sourceName: SourceName.LOG, columns, rowCount, dataTypes };
}

function fileWithRows(path: string, sourceName: SourceName, rows: object[], dataTypes: DataType[]): ImportFile {
   return { path, name: basename(path, extname(path)), sourceName, columns: Object.keys(rows[0]), rowCount: rows.length, dataTypes };
}
