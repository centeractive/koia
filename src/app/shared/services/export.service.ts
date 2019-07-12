import { Injectable } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ExportFormat } from '../model';
import * as FileSaver from 'file-saver';
import * as XLSX from 'xlsx';
import * as svg from 'save-svg-as-png';

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

  exportData(data: Object[], exportFormat: ExportFormat, baseFileName: string): void {
    if (exportFormat === ExportFormat.CSV) {
      this.exportAsCSV(data, baseFileName);
    } else if (exportFormat === ExportFormat.JSON) {
      this.exportAsJSON(data, baseFileName);
    } else if (exportFormat === ExportFormat.EXCEL) {
      this.saveExcelFile(XLSX.utils.json_to_sheet(data), baseFileName);
    } else {
      throw new Error('export format ' + exportFormat + ' is not supported');
    }
  }

  exportTableAsExcel(htmlTable: HTMLTableElement, baseFileName: string): void {
    const options = { raw: true }; // keeps original date/time format
    this.saveExcelFile(XLSX.utils.table_to_sheet(htmlTable, options), baseFileName);
  }

  exportImage(svgElement: SVGElement, exportFormat: ExportFormat, baseFileName: string): void {
    if (exportFormat === ExportFormat.PNG) {
      svg.saveSvgAsPng(svgElement, this.generateFileName(baseFileName, '.png'));
    }
  }

  private exportAsCSV(data: Object[], baseFileName: string): void {
    const csv = this.toCSV(data, ',');
    const blob: Blob = new Blob([csv], { type: ExportService.TYPE_CSV });
    FileSaver.saveAs(blob, this.generateFileName(baseFileName, '.csv'));
  }

  private toCSV(data: Object[], delimiter: string): string {
    const keys = Object.keys(data[0]);
    return keys.join(delimiter) + this.newline +
      data.map(e => this.toCSVLine(e, keys, delimiter))
        .join(this.newline);
  }

  private toCSVLine(element: Object, keys: string[], delimiter: string) {
    return keys.map(k => element[k])
      .join(delimiter);
  }

  private saveExcelFile(worksheet: XLSX.WorkSheet, baseFileName: string) {
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob: Blob = new Blob([excelBuffer], { type: ExportService.TYPE_EXCEL });
    FileSaver.saveAs(blob, this.generateFileName(baseFileName, '.xlsx'));
  }

  private exportAsJSON(data: Object[], baseFileName: string): void {
    const json = JSON.stringify(data);
    const blob: Blob = new Blob([json], { type: ExportService.TYPE_JSON });
    FileSaver.saveAs(blob, this.generateFileName(baseFileName, '.json'));
  }

  private generateFileName(baseFileName: string, extension: string): string {
    const formattedDate = this.datePipe.transform(new Date().getTime(), this.timeFormat);
    return baseFileName + '_' + formattedDate + extension;
  }
}
