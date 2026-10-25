import { Download, Page } from '@playwright/test';
import { readFileSync } from 'fs';
import * as XLSX from '@e965/xlsx';
import * as _ from 'lodash';
import { ExportFormat } from 'app/shared/model/export-format.enum';
import { EXPORT_FILE_EXTENSIONS } from 'app/shared/services/export/export-file';

export async function downloadOf(page: Page, trigger: () => Promise<void>): Promise<Download> {
   const [download] = await Promise.all([page.waitForEvent('download'), trigger()]);
   return download;
}

export async function contentOf(download: Download): Promise<string> {
   return readFileSync(await download.path(), 'utf-8').replace(/^\uFEFF/, '');
}

export async function bytesOf(download: Download): Promise<Buffer> {
   return readFileSync(await download.path());
}

/**
 * matches '<baseName>_<yyyy-MM-dd_HHmmss><extension>', the day is the first group
 */
export function exportFileName(baseName: string, format: ExportFormat): RegExp {
   return new RegExp('^' + _.escapeRegExp(baseName) + '_(\\d{4}-\\d{2}-\\d{2})_\\d{6}' + _.escapeRegExp(EXPORT_FILE_EXTENSIONS[format]) + '$');
}

export function exportDayOf(fileName: string, baseName: string, format: ExportFormat): string {
   return exportFileName(baseName, format).exec(fileName)[1];
}

export function localDayOf(date: Date): string {
   return [date.getFullYear(), date.getMonth() + 1, date.getDate()].map(n => String(n).padStart(2, '0')).join('-');
}

export async function sheetOf(download: Download): Promise<XLSX.WorkSheet> {
   const workbook = XLSX.readFile(await download.path());
   return workbook.Sheets[workbook.SheetNames[0]];
}
