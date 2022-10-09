import { ExportService } from './export.service';
import { ExportFormat, DataType, Column } from '../model';

describe('ExportService', () => {

  let exportService: ExportService;

  beforeEach(() => {
    exportService = new ExportService();
  });

  it('#restoreJSONObjects should restore stringified JSON objects', () => {

    // given
    const object = { x: 'test', y: 100, z: [1, 2, 3, 4] };
    const objectAsString = JSON.stringify(object);
    const array = [{ n: 1 }, { n: 2 }, { n: 3 }];
    const arrayAsString = JSON.stringify(array);
    const data = [
      { a: 'x', b: 1, c: objectAsString, d: arrayAsString },
      { a: 'y', b: 2, c: objectAsString },
      { a: 'z', b: 3, d: arrayAsString }
    ];
    const columns: Column[] = [
      { name: 'a', dataType: DataType.TEXT, width: 100 },
      { name: 'b', dataType: DataType.NUMBER, width: 60 },
      { name: 'c', dataType: DataType.OBJECT, width: 200 },
      { name: 'd', dataType: DataType.OBJECT, width: 200 }
    ];

    // when
    exportService.restoreJSONObjects(data, columns);

    // then
    const expected = [
      { a: 'x', b: 1, c: object, d: array },
      { a: 'y', b: 2, c: object },
      { a: 'z', b: 3, d: array }
    ];
    expect(data as any).toEqual(expected);
  });

  it('#exportData should create CSV formatted data', () => {

    // given
    let blob: Blob;
    spyOn(exportService, 'saveBlobAs').and.callFake(b => blob = b); // capture argument
    const data = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }]

    // when
    exportService.exportData(data, ExportFormat.CSV, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    const reader = new FileReader();
    reader.addEventListener('loadend', e => expect(reader.result).toEqual('a,b\nx,1\ny,2'));
    reader.readAsText(blob);
  });

  it('#exportData should save .csv file', () => {

    // given
    const saveAsSpy = spyOn(exportService, 'saveBlobAs').and.stub();

    // when
    exportService.exportData([{ a: 1 }], ExportFormat.CSV, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.csv/);
  });

  it('#exportData should save .xlsx file', () => {

    // given
    const saveAsSpy = spyOn(exportService, 'saveBlobAs').and.stub();

    // when
    exportService.exportData([{ a: 1 }], ExportFormat.EXCEL, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportData should create JSON formatted data', () => {

    // given
    let blob: Blob;
    spyOn(exportService, 'saveBlobAs').and.callFake(b => blob = b); // capture argument
    const data = [{ a: 'x', b: 1 }, { a: 'y', b: 2 }]

    // when
    exportService.exportData(data, ExportFormat.JSON, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(blob).toBeTruthy();
    const reader = new FileReader();
    reader.addEventListener('loadend', e => expect(JSON.parse(reader.result as string)).toEqual(data));
    reader.readAsText(blob);
  });

  it('#exportData should save .json file', () => {

    // given
    const saveAsSpy = spyOn(exportService, 'saveBlobAs').and.stub();

    // when
    exportService.exportData([{ a: 1 }], ExportFormat.JSON, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.json/);
  });

  it('#exportData should throw error when format is not supported', () => {
    expect(() => exportService.exportData([{ a: 1 }], ExportFormat.PNG, 'testfile'))
      .toThrowError('export format PNG is not supported');
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
    const saveAsSpy = spyOn(exportService, 'saveBlobAs').and.stub();

    // when
    exportService.exportTableAsExcel(table, 'testfile');

    // then
    expect(exportService.saveBlobAs).toHaveBeenCalled();
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.xlsx/);
  });

  it('#exportImage should save .png file', () => {

    // given
    const saveAsSpy = spyOn(exportService, 'saveUrlAs');

    // when
    exportService.exportImage('base64Image...', ExportFormat.PNG, 'testfile');

    // then
    //expect(saveAsSpy.calls.mostRecent().args[0]).toBe('base64Image...');
    expect(saveAsSpy.calls.mostRecent().args[1]).toMatch(/testfile.*\.png/);
  });

  it('#exportImage should throw error when format is not supported', () => {
    expect(() => exportService.exportImage('base64Image...', ExportFormat.JSON, 'testfile'))
      .toThrowError('export format JSON is not supported');
  });

});
