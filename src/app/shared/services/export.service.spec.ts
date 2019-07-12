import { ExportService } from './export.service';
import * as FileSaver from 'file-saver';
import { ExportFormat } from '../model';

describe('ExportService', () => {

  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  it('#export should create CSV formatted data', () => {

    // given
    let blob: Blob;
    spyOn(FileSaver, 'saveAs').and.callFake(b => blob = b); // capture argument
    const data = [ {a: 'x', b: 1 }, {a: 'y', b: 2 } ]

    // when
    exportService.exportData(data, ExportFormat.CSV, 'testfile');

    // then
    expect(FileSaver.saveAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    const reader = new FileReader();
    reader.addEventListener('loadend', e => expect(reader.result).toEqual('a,b\nx,1\ny,2'));
    reader.readAsText(blob);
  });

  it('#export should save .csv file', () => {

    // given
    const saveAsSpy = spyOn(FileSaver, 'saveAs').and.stub();

    // when
    exportService.exportData([{a: 1}], ExportFormat.CSV, 'testfile');

    // then
    expect(FileSaver.saveAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.csv/);
  });

  it('#export should save .xlsx file', () => {

    // given
    const saveAsSpy = spyOn(FileSaver, 'saveAs').and.stub();

    // when
    exportService.exportData([{a: 1}], ExportFormat.EXCEL, 'testfile');

    // then
    expect(FileSaver.saveAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportTableAsExcel should save .xlsx file', () => {

    // given
    const table = <HTMLTableElement> document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.appendChild(document.createTextNode('test'));
    tr.appendChild(td)
    tbody.appendChild(tr);
    table.appendChild(tbody);
    const saveAsSpy = spyOn(FileSaver, 'saveAs').and.stub();

    // when
    exportService.exportTableAsExcel(table, 'testfile');

    // then
    expect(FileSaver.saveAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#export should create JSON formatted data', () => {

    // given
    let blob: Blob;
    spyOn(FileSaver, 'saveAs').and.callFake(b => blob = b); // capture argument
    const data = [ {a: 'x', b: 1 }, {a: 'y', b: 2 } ]

    // when
    exportService.exportData(data, ExportFormat.JSON, 'testfile');

    // then
    expect(FileSaver.saveAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    const reader = new FileReader();
    reader.addEventListener('loadend', e => expect(JSON.parse(<string>reader.result)).toEqual(data));
    reader.readAsText(blob);
  });

  it('#export should save .json file', () => {

    // given
    const saveAsSpy = spyOn(FileSaver, 'saveAs').and.stub();

    // when
    exportService.exportData([{a: 1}], ExportFormat.JSON, 'testfile');

    // then
    expect(FileSaver.saveAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.json/);
  });
});
