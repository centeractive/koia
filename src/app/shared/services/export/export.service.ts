import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import * as XLSX from 'xlsx';
import { ExportDataConverter } from './data-converter/export-data-converter';
import { Column, ExportFormat } from 'app/shared/model';
import { ExcelDataConverter } from './data-converter/excel-data-converter';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  private static readonly TYPE_CSV = 'text/csv;charset=UTF-8';
  private static readonly TYPE_EXCEL = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8';
  private static readonly TYPE_JSON = 'application/javascript;charset=UTF-8';

  private newline = '\n';
  private datePipe = new DatePipe('en-US');
  private timeFormat = 'yyyy-mm-dd_HHmmss';
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
    const options = { raw: true }; // keeps original date/time format
    this.saveExcelFile(XLSX.utils.table_to_sheet(htmlTable, options), baseFileName);
  }

  exportImage(base64Image: string, exportFormat: ExportFormat, baseFileName: string): void {
    if (exportFormat === ExportFormat.PNG) {
      this.saveUrlAs(base64Image, this.generateFileName(baseFileName, '.png'));
    } else {
      throw new Error('export format ' + exportFormat + ' is not supported');
    }
  }

  private exportAsCSV(data: object[], columns: Column[], baseFileName: string): void {
    this.exportDataConverter.timeToFormattedString(data, columns);
    const csv = this.toCSV(data, ',');
    const blob: Blob = new Blob([csv], { type: ExportService.TYPE_CSV });
    this.saveBlobAs(blob, this.generateFileName(baseFileName, '.csv'));
  }

  private toCSV(data: object[], delimiter: string): string {
    const keys = Object.keys(data[0]);
    return keys.join(delimiter) + this.newline +
      data.map(e => this.toCSVLine(e, keys, delimiter))
        .join(this.newline);
  }

  private toCSVLine(element: object, keys: string[], delimiter: string) {
    return keys.map(k => element[k])
      .join(delimiter);
  }

  private exportAsExcel(data: object[], columns: Column[], baseFileName: string): void {
    this.excelDataConverter.convertTime(data, columns);
    const worksheet = this.excelDataConverter.toWorksheet(data, columns);
    this.saveExcelFile(worksheet, baseFileName);
  }

  private saveExcelFile(worksheet: XLSX.WorkSheet, baseFileName: string) {
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: ExportService.TYPE_EXCEL });
    this.saveBlobAs(blob, this.generateFileName(baseFileName, '.xlsx'));
  }

  private exportAsJSON(data: object[], columns: Column[], baseFileName: string): void {
    this.exportDataConverter.restoreJSONObjects(data, columns);
    this.exportDataConverter.timeToFormattedString(data, columns);
    const blob: Blob = new Blob([JSON.stringify(data, undefined, '  ')], { type: ExportService.TYPE_JSON });
    this.saveBlobAs(blob, this.generateFileName(baseFileName, '.json'));
  }

  private generateFileName(baseFileName: string, extension: string): string {
    const formattedDate = this.datePipe.transform(new Date().getTime(), this.timeFormat);
    return baseFileName + '_' + formattedDate + extension;
  }

  saveBlobAs(blob: Blob, filename: string): void {
    this.saveUrlAs(URL.createObjectURL(blob), filename);
  }

  saveUrlAs(url: string, filename: string): void {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }

}
