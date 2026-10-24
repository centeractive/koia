import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as XLSX from '@e965/xlsx';
import * as Papa from 'papaparse';
import { ExportDataConverter } from './data-converter/export-data-converter';
import { Column, ExportFormat } from 'app/shared/model';
import { ExcelDataConverter } from './data-converter/excel-data-converter';
import { EXPORT_FILE_EXTENSIONS } from './export-file';
import { typedTableClone } from './data-converter/typed-table';
import { propertyNamesOf } from './data-converter/property-names';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private static readonly TYPE_CSV = 'text/csv;charset=UTF-8';
  private static readonly TYPE_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  private static readonly TYPE_JSON = 'application/javascript;charset=UTF-8';
  static readonly OBJECT_URL_LIFETIME_MS = 40_000;
  private static readonly BYTE_ORDER_MARK = '\uFEFF';
  private static readonly FORMULA_START = /^[=+\-@\t\r]/;

  private newline = '\n';
  private datePipe = new DatePipe('en-US');
  private timeFormat = 'yyyy-MM-dd_HHmmss';
  private exportDataConverter = new ExportDataConverter();
  private excelDataConverter = new ExcelDataConverter();

  exportData(data: object[], columns: Column[], exportFormat: ExportFormat, baseFileName: string): void {
    if (exportFormat === ExportFormat.CSV) {
      this.exportAsCSV(data, columns, baseFileName);
    } else if (exportFormat === ExportFormat.JSON) {
      this.exportAsJSON(data, columns, baseFileName);
    } else if (exportFormat === ExportFormat.EXCEL) {
      this.exportAsExcel(data, columns, baseFileName);
    } else {
      throw new Error('export format ' + exportFormat + ' is not supported');
    }
  }

  exportTableAsExcel(htmlTable: HTMLTableElement, baseFileName: string): void {
    this.saveExcelFile(XLSX.utils.table_to_sheet(typedTableClone(htmlTable)), baseFileName);
  }

  exportImage(base64Image: string, exportFormat: ExportFormat, baseFileName: string): void {
    if (exportFormat === ExportFormat.PNG) {
      this.saveUrlAs(base64Image, this.generateFileName(baseFileName, EXPORT_FILE_EXTENSIONS[ExportFormat.PNG]));
    } else {
      throw new Error('export format ' + exportFormat + ' is not supported');
    }
  }

  private exportAsCSV(data: object[], columns: Column[], baseFileName: string): void {
    this.exportDataConverter.timeToFormattedString(data, columns);
    const csv = this.toCSV(data, columns, ',');
    const blob: Blob = new Blob([ExportService.BYTE_ORDER_MARK, csv], { type: ExportService.TYPE_CSV });
    this.saveBlobAs(blob, this.generateFileName(baseFileName, EXPORT_FILE_EXTENSIONS[ExportFormat.CSV]));
  }

  private toCSV(data: object[], columns: Column[], delimiter: string): string {
    return Papa.unparse({ fields: propertyNamesOf(data, columns), data }, { delimiter, newline: this.newline, escapeFormulae: ExportService.FORMULA_START });
  }

  private exportAsExcel(data: object[], columns: Column[], baseFileName: string): void {
    this.excelDataConverter.convertTime(data, columns);
    const worksheet = this.excelDataConverter.toWorksheet(data, columns);
    this.saveExcelFile(worksheet, baseFileName);
  }

  private saveExcelFile(worksheet: XLSX.WorkSheet, baseFileName: string) {
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: ArrayBuffer =XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: ExportService.TYPE_EXCEL });
    this.saveBlobAs(blob, this.generateFileName(baseFileName, EXPORT_FILE_EXTENSIONS[ExportFormat.EXCEL]));
  }

  private exportAsJSON(data: object[], columns: Column[], baseFileName: string): void {
    this.exportDataConverter.restoreJSONObjects(data, columns);
    this.exportDataConverter.timeToFormattedString(data, columns);
    const blob: Blob = new Blob([JSON.stringify(data, undefined, '  ')], { type: ExportService.TYPE_JSON });
    this.saveBlobAs(blob, this.generateFileName(baseFileName, EXPORT_FILE_EXTENSIONS[ExportFormat.JSON]));
  }

  private generateFileName(baseFileName: string, extension: string): string {
    const formattedDate = this.datePipe.transform(new Date().getTime(), this.timeFormat);
    return baseFileName + '_' + formattedDate + extension;
  }

  saveBlobAs(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    this.saveUrlAs(url, filename);
    setTimeout(() => URL.revokeObjectURL(url), ExportService.OBJECT_URL_LIFETIME_MS);
  }

  saveUrlAs(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

}
