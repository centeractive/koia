import { ExportService } from './export.service';
import { ExportFormat, DataType, Column } from '../../model';

describe('ExportService', () => {

  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  it('#exportData should create CSV formatted data', () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b); // capture argument    
    const data = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }]
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.NUMBER, width: 10 }
    ];

    // when
    exportService.exportData(data, columns, ExportFormat.CSV, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    const reader = new FileReader();
    reader.addEventListener('loadend', e => expect(reader.result).toEqual('a,b\nx,1\ny,2'));
    reader.readAsText(blob);
  });

  it('#exportData should save .csv file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.CSV, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.csv/);
  });

  it('#exportData should save .xlsx file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.EXCEL, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportData should create JSON formatted data', () => {

    // given
    let blob: Blob;
    vi.spyOn(exportService, 'saveBlobAs').mockImplementation(b => blob = b); // capture argument
    const data = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }]
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 10 },
      { name: 'b', dataType: DataType.NUMBER, width: 10 }
    ];

    // when
    exportService.exportData(data, columns, ExportFormat.JSON, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    const reader = new FileReader();
    reader.addEventListener('loadend', e => expect(JSON.parse(reader.result as string)).toEqual(data));
    reader.readAsText(blob);
  });

  it('#exportData should save .json file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    // when
    exportService.exportData([{ a: 1 }], [column], ExportFormat.JSON, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.json/);
  });

  it('#exportData should throw error when format is not supported', () => {
    const column: Column = { name: 'a', dataType: DataType.NUMBER, width: 10 };

    expect(() => exportService.exportData([{ a: 1 }], [column], ExportFormat.PNG, 'testfile')).toThrow(expect.objectContaining({ message: 'export format PNG is not supported' }));
  });

  it('#exportTableAsExcel should save .xlsx file', () => {

    // given
    const table = document.createElement('table');
    const tbody = document.createElement('tbody');
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.appendChild(document.createTextNode('test'));
    tr.appendChild(td)
    tbody.appendChild(tr);
    table.appendChild(tbody);
    const saveAsSpy = vi.spyOn(exportService, 'saveBlobAs').mockReturnValue(undefined);

    // when
    exportService.exportTableAsExcel(table, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportImage should save .png file', () => {

    // given
    const saveAsSpy = vi.spyOn(exportService, 'saveUrlAs').mockReturnValue(undefined);

    // when
    exportService.exportImage('base64Image...', ExportFormat.PNG, 'testfile');

    // then
    //expect(vi.mocked(saveAsSpy).mock.lastCall[0]).toBe('base64Image...');
    expect(vi.mocked(saveAsSpy).mock.lastCall[1]).toMatch(/testfile.*\.png/);
  });

  it('#exportImage should throw error when format is not supported', () => {
    expect(() => exportService.exportImage('base64Image...', ExportFormat.JSON, 'testfile')).toThrow(expect.objectContaining({ message: 'export format JSON is not supported' }));
  });

});
